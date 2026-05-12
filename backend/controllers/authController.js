const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Employee = require('../models/Employee');
const StoreOwner = require('../models/StoreOwner');
const Supplier = require('../models/Supplier');
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

            const defaultRole = await Role.findOne({ name: 'employee' });
            extraFields = {
                employee_id: `EMP${Date.now()}`,
                role: defaultRole ? defaultRole._id : undefined,
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
        const user = req.user; // populated by authenticateStoreOwner middleware
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                userType: req.userType,
                role: user.role || null,
                store_id: user.store_id || null,
                schedule: user.schedule || null,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch user", error: error.message });
    }
};

// ---------------- Update Profile ----------------
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user._id;
        const userType = req.user.userType;

        let Model;
        if (userType === 'employee') Model = Employee;
        else if (userType === 'store_owner') Model = StoreOwner;
        else if (userType === 'supplier') Model = Supplier;
        else return res.status(400).json({ success: false, message: 'Invalid user type' });

        const updatedUser = await Model.findByIdAndUpdate(
            userId,
            { name, phone },
            { new: true }
        );

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
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
        const userType = req.user.userType;

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
        let user = await Employee.findOne({ email }) || await StoreOwner.findOne({ email }) || await Supplier.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not registered",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOTP = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "🔐 Your Password Reset OTP - Inventrix",
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#4f46e5 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:1px;">
              Inventrix
            </h1>
            <p style="margin:6px 0 0;color:#a5b4fc;font-size:13px;">Your Smart Store Management Solution</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 20px;">
            <h2 style="margin:0 0 10px;color:#1e293b;font-size:20px;">Password Reset Request</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
              We received a request to reset your password. Use the OTP below to proceed.
              If you didn't request this, you can safely ignore this email.
            </p>

            <!-- OTP Box -->
            <div style="background:#f8fafc;border:2px dashed #4f46e5;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
                Your One-Time Password
              </p>
              <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#4f46e5;font-family:monospace;">
                ${otp}
              </div>
              <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;">
                ⏱️ Valid for <strong style="color:#ef4444;">10 minutes</strong> only
              </p>
            </div>

            <!-- Warning -->
            <div style="background:#fef9c3;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 16px;margin:0 0 24px;">
              <p style="margin:0;color:#92400e;font-size:13px;">
                ⚠️ <strong>Never share this OTP</strong> with anyone. Inventrix will never ask for your OTP.
              </p>
            </div>

            <!-- Steps -->
            <p style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:700;">How to reset your password:</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${["Enter the OTP on the reset page", "Create a new strong password", "Log in with your new password"]
                    .map((step, i) => `
                <tr>
                  <td style="padding:6px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#4f46e5;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:12px;font-weight:700;">${i + 1}</span>
                        </td>
                        <td style="padding-left:12px;color:#475569;font-size:13px;">${step}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
              This email was sent to <strong>${email}</strong>
            </p>
            <p style="margin:0;color:#cbd5e1;font-size:11px;">
              © ${new Date().getFullYear()} Inventrix. All rights reserved.
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
            await Customer.findOne({ email });

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

        let user =
            await StoreOwner.findOne({ email }) ||
            await Employee.findOne({ email }) ||
            await Customer.findOne({ email });

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

        res.json({ success: true });
    } catch (error) {
        console.error("OTP ERROR:", error);
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
