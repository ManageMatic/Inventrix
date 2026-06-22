const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Employee = require('../models/Employee');
const StoreOwner = require('../models/StoreOwner');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Role = require('../models/Role');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// ---------------- Register ----------------
exports.register = async (req, res) => {
    try {
        const { userType, name, email, password, phone, store_id } = req.body;

        if (userType === 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Customers cannot register.'
            });
        }

        let Model;
        if (userType === 'employee') Model = Employee;
        else if (userType === 'store_owner') Model = StoreOwner;
        else if (userType === 'supplier') Model = Supplier;
        else return res.status(400).json({ success: false, message: 'Invalid user type' });

        // Check if email already exists
        const existing = await Model.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-generate IDs and extra fields
        let extraFields = {};
        if (userType === 'employee') {
            // Validate store_id for employees
            if (!store_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Employees must select a store'
                });
            }

            let defaultRole = await Role.findOne({ name: 'employee' });
            if (!defaultRole) {
                const defaultRolePermissions = require('../utils/rolePermissions');
                defaultRole = await Role.create(defaultRolePermissions.employee);
            }
            extraFields = {
                employee_id: `EMP${Date.now()}`,
                role: defaultRole._id,
                store_id: store_id // Add store_id for employee
            };
        }

        if (userType === 'store_owner') {
            extraFields = {
                owner_id: `OWNER${Date.now()}`
            };
        }

        if (userType === 'supplier') {
            extraFields = {
                supplier_id: `SUP${Date.now()}`,
                contact: phone
            };
        }

        // Create user
        const user = await Model.create({
            name,
            email,
            phone,
            password: hashedPassword,
            ...extraFields
        });

        const token = generateToken(user._id, userType, user.role || null);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: `${userType} registered successfully`,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                userType,
                store_id: user.store_id || null
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
};

// ---------------- Login ----------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Employee.findOne({ email }).select('+password');
        let userType = 'employee';

        if (!user) {
            user = await StoreOwner.findOne({ email }).select('+password');
            userType = 'store_owner';
        }
        if (!user) {
            user = await Supplier.findOne({ email }).select('+password');
            userType = 'supplier';
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = generateToken(user._id, userType, user.role || null);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                userType
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};

// ---------------- Get Current User ----------------
exports.getCurrentUser = async (req, res) => {
    try {
        let user = req.user;

        // 🛠️ Auto-Sync Stats for Employees: Ensure performance matches real sales
        if (req.userType === 'employee') {
            const Sale = require('../models/Sale');
            const stats = await Sale.aggregate([
                { $match: { employee_id: user._id, status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]);

            const actualCount = stats.length > 0 ? stats[0].count : 0;
            const actualRevenue = stats.length > 0 ? stats[0].total : 0;

            // If DB stats are out of sync, update them
            if (user.performance.salesCount !== actualCount || user.performance.totalRevenue !== actualRevenue) {
                const Employee = require('../models/Employee');
                user = await Employee.findByIdAndUpdate(
                    user._id,
                    {
                        'performance.salesCount': actualCount,
                        'performance.totalRevenue': actualRevenue
                    },
                    { new: true }
                ).populate('role').populate('store_id', 'name');
            }
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                employee_id: user.employee_id || null, // For staff
                supplier_id: user.supplier_id || null, // For suppliers
                name: user.name,
                email: user.email,
                phone: user.phone || user.contact || null, // Map contact to phone for suppliers
                address: user.address || null, // Address for suppliers
                userType: req.userType,
                role: user.role || null,
                store_id: user.store_id || null,
                schedule: user.schedule || null,
                performance: user.performance || null, // Added for stats
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch user", error: error.message });
    }
};

// ---------------- Update Profile ----------------
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const userId = req.user._id;
        const userType = req.userType;

        let Model;
        let updatePayload = { name };

        if (userType === 'employee') {
            Model = Employee;
            updatePayload.phone = phone;
        } else if (userType === 'store_owner') {
            Model = StoreOwner;
            updatePayload.phone = phone;
        } else if (userType === 'supplier') {
            Model = Supplier;
            updatePayload.contact = phone; // Map phone to contact for Supplier model
            updatePayload.address = address; // Add address support
        } else {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }

        const updatedUser = await Model.findByIdAndUpdate(
            userId,
            updatePayload,
            { new: true }
        );

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone || updatedUser.contact || null,
                address: updatedUser.address || null,
                userType: userType
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }
};

// ---------------- Change Password ----------------
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;
        const userType = req.userType;

        let Model;
        if (userType === 'employee') Model = Employee;
        else if (userType === 'store_owner') Model = StoreOwner;
        else if (userType === 'supplier') Model = Supplier;
        else return res.status(400).json({ success: false, message: 'Invalid user type' });

        const user = await Model.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to change password", error: error.message });
    }
};

// ---------------- Email Configuration ----------------
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ---------------- Send Reset Password OTP ----------------
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        let user =
            await Employee.findOne({ email }) ||
            await StoreOwner.findOne({ email }) ||
            await Supplier.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not registered",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "🔐 Password Reset Request — Inventrix",
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:48px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#1a1035;border-radius:20px;overflow:hidden;border:1px solid rgba(220,38,38,0.25);box-shadow:0 20px 60px rgba(0,0,0,0.6);">

        <!-- Header: Crimson security theme -->
        <tr>
          <td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 50%,#991b1b 100%);padding:40px;text-align:center;">
            <div style="width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:60px;">🔐</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.5px;">Password Reset</h1>
            <p style="margin:8px 0 0;color:#fca5a5;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Security Verification Required</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#cbd5e1;font-size:15px;line-height:1.6;">
              We received a request to reset your <strong style="color:#f87171;">Inventrix</strong> account password.
              Use the OTP below to proceed. This code is time-sensitive.
            </p>
            <p style="margin:0 0 28px;color:#94a3b8;font-size:13px;">If you did not request this, please ignore this email — your account remains secure.</p>

            <!-- OTP Box -->
            <div style="background:#0f0a1e;border:2px solid #dc2626;border-radius:14px;padding:32px;text-align:center;margin:0 0 28px;">
              <p style="margin:0 0 10px;color:#f87171;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:700;">
                One-Time Password
              </p>
              <div style="font-size:46px;font-weight:900;letter-spacing:14px;color:#ffffff;font-family:monospace;text-shadow:0 0 30px rgba(220,38,38,0.6);">
                ${otp}
              </div>
              <div style="margin:16px auto 0;width:80px;height:3px;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:2px;"></div>
              <p style="margin:14px 0 0;color:#6b7280;font-size:12px;">
                ⏱ Expires in <strong style="color:#ef4444;">10 minutes</strong>
              </p>
            </div>

            <!-- Warning -->
            <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:16px 18px;">
              <p style="margin:0;color:#fca5a5;font-size:13px;line-height:1.6;">
                🚨 <strong>Never share this code</strong> with anyone — including Inventrix support.
                We will never ask you for your OTP.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0a0718;padding:24px 40px;border-top:1px solid rgba(220,38,38,0.15);text-align:center;">
            <p style="margin:0 0 4px;color:#475569;font-size:12px;">
              Sent to <strong style="color:#64748b;">${email}</strong>
            </p>
            <p style="margin:0;color:#334155;font-size:11px;">
              © ${new Date().getFullYear()} Inventrix · Secure Store Management
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
            `,
        });

        res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
    }
}

// ---------------- Send Customer Portal OTP ----------------
exports.sendCustomerOTP = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await Customer.findOne({ email });

        // Auto-create customer if first time visiting portal
        if (!user) {
            user = await Customer.create({
                name: "Customer",
                email: email,
                phone: "CUST-" + Date.now(),
                isRegistered: true
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "🛍️ Your Inventrix Customer Portal Access Code",
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8faff;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:48px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(99,102,241,0.15);">

        <!-- Header: Indigo/Purple customer theme -->
        <tr>
          <td style="background:linear-gradient(135deg,#4338ca 0%,#7c3aed 50%,#a855f7 100%);padding:40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:12px;">🛍️</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Inventrix</h1>
            <p style="margin:6px 0 0;color:#c4b5fd;font-size:13px;letter-spacing:0.5px;">Customer Purchase Portal</p>
          </td>
        </tr>

        <!-- Welcome banner -->
        <tr>
          <td style="background:#faf5ff;border-bottom:2px solid #ede9fe;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#6d28d9;font-size:14px;font-weight:600;">
              ✨ Welcome back! Here's your secure access code.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="margin:0 0 6px;color:#1e1b4b;font-size:16px;font-weight:700;">Hello there 👋</p>
            <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">
              You requested access to your <strong style="color:#7c3aed;">purchase history</strong> on the Inventrix Customer Portal.
              Use the code below to securely view your invoices and spending analytics.
            </p>

            <!-- OTP Box: Light purple card -->
            <div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border:2px solid #c4b5fd;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px;">
              <p style="margin:0 0 10px;color:#7c3aed;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:800;">
                Access Code
              </p>
              <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#4338ca;font-family:monospace;">
                ${otp}
              </div>
              <div style="margin:16px auto 0;width:80px;height:3px;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:2px;"></div>
              <p style="margin:14px 0 0;color:#9ca3af;font-size:12px;">
                ⏱ Valid for <strong style="color:#7c3aed;">10 minutes</strong>
              </p>
            </div>

            <!-- Feature highlights -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td width="32%" style="background:#faf5ff;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:20px;">📄</div>
                  <p style="margin:6px 0 0;color:#6d28d9;font-size:11px;font-weight:700;">View Invoices</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:#faf5ff;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:20px;">📊</div>
                  <p style="margin:6px 0 0;color:#6d28d9;font-size:11px;font-weight:700;">Spending Analytics</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:#faf5ff;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:20px;">⬇️</div>
                  <p style="margin:6px 0 0;color:#6d28d9;font-size:11px;font-weight:700;">Download PDFs</p>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#d1d5db;font-size:12px;">
              If you didn't request this code, simply ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#faf5ff;padding:24px 40px;border-top:1px solid #ede9fe;text-align:center;">
            <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">
              Sent to <strong style="color:#6d28d9;">${email}</strong>
            </p>
            <p style="margin:0;color:#c4b5fd;font-size:11px;">
              © ${new Date().getFullYear()} Inventrix · Smart Store Management
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
            `,
        });

        res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
    }
}


// ---------------- Reset Password ----------------
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        let user =
            await StoreOwner.findOne({ email }) ||
            await Employee.findOne({ email }) ||
            await Customer.findOne({ email }) ||
            await Supplier.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // ❌ REMOVE OTP CHECK HERE

        user.password = await bcrypt.hash(newPassword, 10);

        // clear OTP after success
        user.resetOTP = null;
        user.otpExpiry = null;

        await user.save();

        res.json({
            success: true,
            message: "Password reset successful",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ---------------- Verify OTP ----------------
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        let user = await StoreOwner.findOne({ email });
        let userType = 'store_owner';

        if (!user) {
            user = await Employee.findOne({ email });
            userType = 'employee';
        }
        if (!user) {
            user = await Customer.findOne({ email });
            userType = 'customer';
        }
        if (!user) {
            user = await Supplier.findOne({ email });
            userType = 'supplier';
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.resetOTP !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        // Clear OTP after success
        user.resetOTP = null;
        user.otpExpiry = null;
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id, userType, user.role || null);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType
            }
        });
    } catch (error) {
        console.error("OTP ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- Verify Customer Portal OTP ----------------
exports.verifyCustomerOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Only look in Customer model — prevents collision with owner/employee emails
        const user = await Customer.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found" });
        }

        if (user.resetOTP !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        // Clear OTP after success
        user.resetOTP = null;
        user.otpExpiry = null;
        await user.save();

        // Generate a short-lived customer token
        const token = generateToken(user._id, 'customer', null);

        res.json({
            success: true,
            token,
            user: { id: user._id, email: user.email, userType: 'customer' }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ---------------- Logout ----------------
exports.logout = async (req, res) => {
    try {
        res.clearCookie('refreshToken', { path: '/' });
        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
    }
};
