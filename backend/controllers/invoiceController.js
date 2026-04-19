const Invoice = require("../models/Invoice");
const Sale = require("../models/Sale");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, "../invoices");
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

const formatCurrency = (value) => {
    return `Rs ${Number(value).toFixed(2)}`;
};

const sendInvoiceEmail = async (to, subject, text, html, attachmentPath, attachmentName) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_FROM) {
        throw new Error("Email configuration is incomplete. Please set SMTP env variables.");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.verify();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
        attachments: [
            {
                filename: attachmentName,
                path: attachmentPath
            }
        ]
    });
};

exports.generateInvoice = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { customer_email: customerEmail, customer_mobile: customerMobile } = req.body;

        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                message: "Customer email is required to send the invoice."
            });
        }

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
        const invoiceMobile = customerMobile || sale.customer_mobile || null;

        const createPdfAndSend = async (invoiceRecord) => {
            const fileName = `${invoiceRecord.invoice_id}.pdf`;
            const filePath = path.join(invoicesDir, fileName);

            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Professional header
            doc.rect(40, 45, 515, 100).fill("#1e293b");
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text(sale.store_id.name, 50, 60);
            doc.font("Helvetica").fontSize(9).fillColor("#cbd5e1").text(`Phone: ${sale.store_id.phone || "N/A"}`, 50, 86);
            doc.text(`Store ID: ${sale.store_id._id}`, 50, 100);
            doc.font("Helvetica-Bold").fontSize(30).text("INVOICE", 400, 60, { width: 130, align: "right" });

            doc.fillColor("#111827");
            doc.lineWidth(1).moveTo(40, 155).lineTo(555, 155).stroke();

            // Bill to and invoice details
            const detailsTop = 165;
            doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Bill To", 50, detailsTop);
            doc.font("Helvetica").fontSize(9).text(customerEmail, 50, detailsTop + 15);
            if (invoiceMobile) {
                doc.text(`Mobile: ${invoiceMobile}`, 50, detailsTop + 30);
            }

            doc.font("Helvetica-Bold").fontSize(10).text("Invoice Details", 320, detailsTop);
            doc.font("Helvetica").fontSize(9).text(`Invoice ID: ${invoiceRecord.invoice_id}`, 320, detailsTop + 15);
            doc.text(`Date: ${new Date(invoiceRecord.date).toLocaleDateString()}`, 320, detailsTop + 30);
            doc.text(`Sale ID: ${sale.sale_id}`, 320, detailsTop + 45);

            // Items table
            const tableTop = 235;
            doc.rect(40, tableTop, 515, 22).fill("#f3f4f6");
            doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
            doc.text("Product", 50, tableTop + 6);
            doc.text("Qty", 320, tableTop + 6, { width: 40, align: "right" });
            doc.text("Price", 400, tableTop + 6, { width: 70, align: "right" });
            doc.text("Total", 500, tableTop + 6, { width: 55, align: "right" });
            doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(40, tableTop + 22).lineTo(555, tableTop + 22).stroke();
            doc.fillColor("#111827");

            let y = tableTop + 32;
            sale.items.forEach(item => {
                const description = item.product_id.description || "";
                const productName = item.product_id.name || "Unnamed product";
                const productWidth = 260;
                const qtyX = 320;
                const priceX = 400;
                const totalX = 500;

                doc.font("Helvetica-Bold").fontSize(10).text(productName, 50, y, { width: productWidth });
                y += 14;

                if (description) {
                    const descHeight = doc.heightOfString(description, { width: productWidth });
                    doc.font("Helvetica").fontSize(8).fillColor("#475569").text(description, 50, y, { width: productWidth });
                    y += descHeight + 6;
                    doc.fillColor("#111827");
                }

                doc.font("Helvetica").fontSize(10);
                doc.text(item.quantity.toString(), qtyX, y - 14, { width: 50, align: "right" });
                doc.text(formatCurrency(item.price), priceX, y - 14, { width: 70, align: "right" });
                doc.text(formatCurrency(item.subtotal), totalX, y - 14, { width: 75, align: "right" });

                y += 18;
                doc.strokeColor("#e5e7eb").lineWidth(0.5).moveTo(40, y - 6).lineTo(555, y - 6).stroke();

                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });

            const totalsY = y + 20;
            doc.font("Helvetica-Bold").fontSize(11);
            doc.text("Subtotal", 380, totalsY, { width: 130, align: "right" });
            doc.text(formatCurrency(sale.subtotal), 520, totalsY, { width: 85, align: "right" });
            if (sale.tax) {
                doc.text("Tax", 380, totalsY + 18, { width: 130, align: "right" });
                doc.text(formatCurrency(sale.tax), 520, totalsY + 18, { width: 85, align: "right" });
            }
            if (sale.discount) {
                doc.text("Discount", 380, totalsY + 36, { width: 130, align: "right" });
                doc.text(formatCurrency(sale.discount), 520, totalsY + 36, { width: 85, align: "right" });
            }
            doc.fontSize(13).text("Total", 380, totalsY + 64, { width: 130, align: "right" });
            doc.text(formatCurrency(sale.totalAmount), 520, totalsY + 64, { width: 85, align: "right" });

            doc.font("Helvetica").fontSize(10).fillColor("#111827").text(`Payment method: ${sale.paymentMethod.toUpperCase()}`, 50, totalsY + 110);
            doc.fillColor("#475569").fontSize(10).text("Thank you for your purchase!", 50, totalsY + 130);

            doc.end();

            await new Promise((resolve, reject) => {
                stream.on("finish", resolve);
                stream.on("error", reject);
            });

            invoiceRecord.invoiceUrl = `/invoices/${fileName}`;
            await invoiceRecord.save();

            const emailSubject = `Your invoice ${invoiceRecord.invoice_id} from ${sale.store_id.name}`;
            const emailText = `Dear Customer,\n\nThank you for your purchase at ${sale.store_id.name}. Please find attached your invoice ${invoiceRecord.invoice_id}.\n\nInvoice total: ${formatCurrency(sale.totalAmount)}\n${invoiceMobile ? `Customer mobile: ${invoiceMobile}\n` : ""}\n\nIf you have any questions, reply to this email.\n\nBest regards,\n${sale.store_id.name}`;
            const emailHtml = `
                <p>Dear Customer,</p>
                <p>Thank you for your purchase at <strong>${sale.store_id.name}</strong>. Please find attached your invoice <strong>${invoiceRecord.invoice_id}</strong>.</p>
                <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="border-bottom: 2px solid #ddd; text-align:left; padding:8px;">Product</th>
                            <th style="border-bottom: 2px solid #ddd; text-align:right; padding:8px;">Qty</th>
                            <th style="border-bottom: 2px solid #ddd; text-align:right; padding:8px;">Price</th>
                            <th style="border-bottom: 2px solid #ddd; text-align:right; padding:8px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => {
                            const desc = item.product_id.description ? `<div style="font-size:12px; color:#55606b; margin-top:4px;">${item.product_id.description}</div>` : "";
                            return `
                                <tr>
                                    <td style="padding:8px; border-bottom:1px solid #eee; vertical-align: top;">
                                        <strong>${item.product_id.name}</strong>${desc}
                                    </td>
                                    <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${item.quantity}</td>
                                    <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(item.price)}</td>
                                    <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(item.subtotal)}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
                <p style="margin-top:20px; font-size:14px;"><strong>Invoice total:</strong> ${formatCurrency(sale.totalAmount)}</p>
                ${invoiceMobile ? `<p><strong>Customer mobile:</strong> ${invoiceMobile}</p>` : ""}
                <p>Best regards,<br/>${sale.store_id.name}</p>
            `;

            await sendInvoiceEmail(customerEmail, emailSubject, emailText, emailHtml, filePath, fileName);

            return {
                invoiceId: invoiceRecord._id,
                invoiceUrl: invoiceRecord.invoiceUrl,
                fileName
            };
        };

        if (!invoice) {
            invoice = new Invoice({
                invoice_id: "INV-" + Date.now(),
                sale_id: saleId,
                store_id: sale.store_id._id,
                employee_id: sale.employee_id || sale.store_owner_id,
                date: new Date(),
                customer_mobile: invoiceMobile,
                customer_email: customerEmail,
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

            const invoiceData = await createPdfAndSend(invoice);
            return res.json({
                success: true,
                message: "Invoice generated and emailed successfully.",
                data: invoiceData
            });
        }

        // If invoice already exists, resend it to the requested email.
        const existingFilePath = path.join(invoicesDir, path.basename(invoice.invoiceUrl || ""));
        if (!fs.existsSync(existingFilePath)) {
            return res.status(404).json({
                success: false,
                message: "Existing invoice PDF not found. Please regenerate."
            });
        }

        if (invoice.customer_email !== customerEmail) {
            invoice.customer_email = customerEmail;
        }
        if (invoiceMobile && invoice.customer_mobile !== invoiceMobile) {
            invoice.customer_mobile = invoiceMobile;
        }
        await invoice.save();

        const emailSubject = `Your invoice ${invoice.invoice_id} from ${sale.store_id.name}`;
        const emailText = `Dear Customer,\n\nPlease find attached your invoice ${invoice.invoice_id} from ${sale.store_id.name}.\n\nInvoice total: ₹${sale.totalAmount}\n${invoiceMobile ? `Customer mobile: ${invoiceMobile}\n` : ""}\n\nThank you for your purchase.`;
        const emailHtml = `<p>Dear Customer,</p><p>Please find attached your invoice <strong>${invoice.invoice_id}</strong> from <strong>${sale.store_id.name}</strong>.</p><p><strong>Invoice total:</strong> ₹${sale.totalAmount}</p>${invoiceMobile ? `<p><strong>Customer mobile:</strong> ${invoiceMobile}</p>` : ""}<p>Thank you for your purchase.</p>`;

        await sendInvoiceEmail(customerEmail, emailSubject, emailText, emailHtml, existingFilePath, path.basename(existingFilePath));

        res.json({
            success: true,
            message: "Existing invoice resent to customer email.",
            data: {
                invoiceId: invoice._id,
                invoiceUrl: invoice.invoiceUrl,
                fileName: path.basename(invoice.invoiceUrl)
            }
        });
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
