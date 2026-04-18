const Invoice = require("../models/Invoice");
const Sale = require("../models/Sale");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, "../invoices");
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

exports.generateInvoice = async (req, res) => {
    try {
        const { saleId } = req.params;

        // Find the sale
        const sale = await Sale.findById(saleId)
            .populate("store_id")
            .populate("employee_id")
            .populate("store_owner_id")
            .populate("items.product_id");

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        // Check if invoice already exists for this sale
        let invoice = await Invoice.findOne({ sale_id: saleId });

        if (!invoice) {
            // Create new invoice record
            invoice = new Invoice({
                invoice_id: "INV-" + Date.now(),
                sale_id: saleId,
                store_id: sale.store_id._id,
                employee_id: sale.employee_id || sale.store_owner_id,
                date: new Date(),
                items: sale.items.map(item => ({
                    product_id: item.product_id._id,
                    productName: item.product_id.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal
                })),
                subtotal: sale.subtotal,
                tax: sale.tax,
                discount: sale.discount,
                totalAmount: sale.totalAmount,
                paymentMethod: sale.paymentMethod
            });

            // Generate PDF
            const fileName = `${invoice.invoice_id}.pdf`;
            const filePath = path.join(invoicesDir, fileName);
            
            // Create PDF document
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // PDF Header
            doc.fontSize(20).font("Helvetica-Bold").text(sale.store_id.name, 50, 50);
            doc.fontSize(10).font("Helvetica").text(`Store ID: ${sale.store_id._id}`, 50, 80);
            doc.fontSize(10).text(`Phone: ${sale.store_id.phone || "N/A"}`, 50, 95);

            // Invoice Title
            doc.fontSize(16).font("Helvetica-Bold").text("INVOICE", 400, 50);
            
            // Invoice Details
            doc.fontSize(10).font("Helvetica");
            doc.text(`Invoice ID: ${invoice.invoice_id}`, 50, 140);
            doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 50, 155);
            doc.text(`Sale ID: ${sale.sale_id}`, 50, 170);

            // Customer Info (if available)
            if (sale.customer_mobile) {
                doc.text(`Customer Mobile: ${sale.customer_mobile}`, 50, 200);
            }

            // Items Table Header
            const tableTop = 240;
            const col1 = 50;
            const col2 = 250;
            const col3 = 380;
            const col4 = 480;

            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("Product", col1, tableTop);
            doc.text("Qty", col2, tableTop);
            doc.text("Price", col3, tableTop);
            doc.text("Total", col4, tableTop);

            // Items
            doc.font("Helvetica");
            let y = tableTop + 20;
            sale.items.forEach(item => {
                doc.text(item.product_id.name, col1, y);
                doc.text(item.quantity.toString(), col2, y);
                doc.text(`₹${item.price}`, col3, y);
                doc.text(`₹${item.subtotal}`, col4, y);
                y += 20;
            });

            // Totals Section
            const totalsY = y + 20;
            doc.fontSize(11).font("Helvetica-Bold");
            doc.text(`Subtotal: ₹${sale.subtotal}`, col3, totalsY);
            if (sale.tax) {
                doc.text(`Tax: ₹${sale.tax}`, col3, totalsY + 20);
            }
            if (sale.discount) {
                doc.text(`Discount: ₹${sale.discount}`, col3, totalsY + 40);
            }
            doc.fontSize(12).text(`Total: ₹${sale.totalAmount}`, col3, totalsY + 60);

            // Payment Method
            doc.fontSize(10).font("Helvetica");
            doc.text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`, 50, totalsY + 100);

            // Footer
            doc.fontSize(9).text("Thank you for your purchase!", 50, totalsY + 150);

            doc.end();

            // When PDF writing is finished
            stream.on("finish", async () => {
                try {
                    // Store the path in invoice document
                    invoice.invoiceUrl = `/invoices/${fileName}`;
                    await invoice.save();

                    res.json({
                        success: true,
                        message: "Invoice generated successfully",
                        data: {
                            invoiceId: invoice._id,
                            invoiceUrl: invoice.invoiceUrl,
                            fileName: fileName
                        }
                    });
                } catch (err) {
                    console.error("Error saving invoice:", err);
                    res.status(500).json({
                        success: false,
                        message: "Error saving invoice record"
                    });
                }
            });

            stream.on("error", (err) => {
                console.error("PDF Stream Error:", err);
                res.status(500).json({
                    success: false,
                    message: "Error generating PDF"
                });
            });
        } else {
            // Invoice already exists, return existing
            res.json({
                success: true,
                message: "Invoice already exists",
                data: {
                    invoiceId: invoice._id,
                    invoiceUrl: invoice.invoiceUrl,
                    fileName: path.basename(invoice.invoiceUrl)
                }
            });
        }
    } catch (error) {
        console.error("INVOICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findById(invoiceId)
            .populate("store_id")
            .populate("employee_id")
            .populate("items.product_id");

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error("GET INVOICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.downloadInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        const filePath = path.join(invoicesDir, path.basename(invoice.invoiceUrl));

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "PDF file not found"
            });
        }

        // Send file as download
        res.download(filePath, `${invoice.invoice_id}.pdf`);
    } catch (error) {
        console.error("DOWNLOAD INVOICE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
