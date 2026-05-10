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

            // ── HEADER BANNER ───────────────────────────────────────────
            doc.rect(0, 0, 595, 110).fill("#1e293b");

            // Store name
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22)
                .text(sale.store_id.name, 40, 22);

            // Format address string properly
            const addrObj = sale.store_id.address;
            const addressString = addrObj && typeof addrObj === 'object'
                ? [addrObj.street, addrObj.city, addrObj.state, addrObj.zipCode].filter(Boolean).join(', ')
                : (addrObj || "Surat, Gujarat");

            // Store details
            doc.font("Helvetica").fontSize(9).fillColor("#cbd5e1")
                .text(addressString, 40, 48)
                .text(`Phone: ${sale.store_id.contact?.phone || "N/A"}  |  Email: ${sale.store_id.contact?.email || "N/A"}`, 40, 60);
            // INVOICE accent badge (top right)
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30)
                .text("INVOICE", 420, 26, { width: 130, align: "right" });

            // Invoice meta (below badge)
            doc.font("Helvetica").fontSize(8).fillColor("#94a3b8")
                .text(`No: ${invoiceRecord.invoice_id}`, 420, 56, { width: 135, align: "right" })
                .text(`Date: ${new Date(invoiceRecord.date).toLocaleDateString()}`, 420, 67, { width: 135, align: "right" })
                .text(`Sale: ${sale.sale_id}`, 420, 78, { width: 135, align: "right" });

            // ── BILL TO + INVOICE INFO CARDS ────────────────────────────
            const cardY = 125;

            // Left card — Bill To
            doc.roundedRect(40, cardY, 240, 80, 4).fill("#f8fafc").stroke("#e2e8f0");

            doc.fillColor("#4f46e5").font("Helvetica-Bold").fontSize(8)
                .text("BILL TO", 55, cardY + 12);

            doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10)
                .text(customerEmail, 55, cardY + 26, { width: 210 });

            doc.fillColor("#64748b").font("Helvetica").fontSize(9)
                .text(invoiceMobile ? `Mobile: ${invoiceMobile}` : "Mobile: N/A", 55, cardY + 42)
                .text(`Payment: ${sale.paymentMethod?.toUpperCase() || "CASH"}`, 55, cardY + 56);

            // Right card — Invoice Details
            doc.roundedRect(315, cardY, 240, 80, 4).fill("#f8fafc").stroke("#e2e8f0");

            doc.fillColor("#4f46e5").font("Helvetica-Bold").fontSize(8)
                .text("INVOICE DETAILS", 330, cardY + 12);

            doc.fillColor("#64748b").font("Helvetica").fontSize(9)
                .text("Invoice ID", 330, cardY + 28, { width: 80 })
                .text("Date", 330, cardY + 42, { width: 80 })
                .text("Sale ID", 330, cardY + 56, { width: 80 });

            doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9)
                .text(invoiceRecord.invoice_id, 330, cardY + 28, { width: 210, align: "right" })
                .text(new Date(invoiceRecord.date).toLocaleDateString("en-IN"), 330, cardY + 42, { width: 210, align: "right" })
                .text(sale.sale_id, 330, cardY + 56, { width: 210, align: "right" });

            // ── DIVIDER ─────────────────────────────────────────────────
            doc.moveTo(40, cardY + 92)
                .lineTo(555, cardY + 92)
                .strokeColor("#e2e8f0")
                .lineWidth(0.5)
                .stroke();

            // ── ITEMS TABLE ─────────────────────────────────────────────
            const tableTop = 235;

            // Table header background
            doc.rect(40, tableTop, 515, 24).fill("#1e293b");

            // Header labels
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
            doc.text("#", 50, tableTop + 8, { width: 20, align: "center" });
            doc.text("Product", 75, tableTop + 8, { width: 200, align: "left" });
            doc.text("Qty", 310, tableTop + 8, { width: 50, align: "center" });
            doc.text("Price", 375, tableTop + 8, { width: 80, align: "right" });
            doc.text("Total", 460, tableTop + 8, { width: 85, align: "right" });

            let y = tableTop + 32;

            sale.items.forEach((item, index) => {
                const productName = item.product_id?.name || "Unnamed product";
                const description = item.product_id?.description || "";
                const qty = item.quantity || 1;
                const price = item.price || 0;
                const subtotal = item.subtotal || (price * qty);

                // Calculate row height dynamically
                const descHeight = description
                    ? doc.heightOfString(description, { width: 200, fontSize: 8 })
                    : 0;
                const rowHeight = Math.max(28, 18 + descHeight + 6);

                // Alternating row background
                if (index % 2 === 0) {
                    doc.rect(40, y - 4, 515, rowHeight).fill("#f8fafc");
                }

                // Serial number
                doc.fillColor("#94a3b8").font("Helvetica").fontSize(8)
                    .text((index + 1).toString(), 50, y + 2, { width: 20, align: "center" });

                // Product name
                doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9)
                    .text(productName, 75, y, { width: 200 });

                // Description below name
                if (description) {
                    doc.fillColor("#64748b").font("Helvetica").fontSize(8)
                        .text(description, 75, y + 14, { width: 200 });
                }

                // Qty — centered
                doc.fillColor("#111827").font("Helvetica").fontSize(9)
                    .text(qty.toString(), 310, y + 2, { width: 50, align: "center" });

                // Price — right aligned
                doc.fillColor("#475569").font("Helvetica").fontSize(9)
                    .text(formatCurrency(price), 375, y + 2, { width: 80, align: "right" });

                // Total — right aligned bold
                doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9)
                    .text(formatCurrency(subtotal), 460, y + 2, { width: 85, align: "right" });

                // Row bottom border
                y += rowHeight;
                doc.moveTo(40, y - 2)
                    .lineTo(555, y - 2)
                    .strokeColor("#e2e8f0")
                    .lineWidth(0.3)
                    .stroke();

                // Page break
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });

            const totalsY = y + 20;

            // Totals background box
            doc.roundedRect(350, totalsY - 10, 210, 100, 4)
                .fill("#f8fafc")
                .stroke("#e2e8f0");

            // Helper function for each row
            const drawTotalRow = (label, value, yOffset, bold = false, color = "#1e293b") => {
                doc.fillColor("#64748b")
                    .font("Helvetica")
                    .fontSize(9)
                    .text(label, 365, totalsY + yOffset, { width: 100, align: "left" });

                doc.fillColor(color)
                    .font(bold ? "Helvetica-Bold" : "Helvetica")
                    .fontSize(bold ? 11 : 9)
                    .text(value, 365, totalsY + yOffset, { width: 185, align: "right" });
            };

            drawTotalRow("Subtotal", formatCurrency(sale.subtotal || sale.totalAmount), 8);

            if (sale.tax) {
                drawTotalRow("Tax", formatCurrency(sale.tax), 26);
            }

            if (sale.discount) {
                drawTotalRow("Discount", formatCurrency(sale.discount), 44);
            }

            // Divider line above total
            doc.moveTo(360, totalsY + 62)
                .lineTo(555, totalsY + 62)
                .strokeColor("#e2e8f0")
                .lineWidth(0.5)
                .stroke();

            // Grand total row (bold + accent color)
            drawTotalRow("TOTAL", formatCurrency(sale.totalAmount), 72, true, "#4f46e5");

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
