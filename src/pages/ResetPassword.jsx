import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/auth.css";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/auth";

function ResetPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [toast, setToast] = useState(null);

  const inputsRef = useRef([]);
  const navigate = useNavigate();

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  // ⏱ Timer
  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  // 🔢 OTP input
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // 📩 SEND OTP
  const sendOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/send-otp`, { email });

      if (res.data.success) {
        showToast("OTP sent!", "success");
        setStep(2);
        setTimer(30);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 RESEND OTP
  const resendOTP = async () => {
    if (timer > 0) return;

    try {
      setLoading(true);

      const res = await axios.post(`${API}/send-otp`, { email });

      if (res.data.success) {
        showToast("OTP resent successfully!", "success");

        setTimer(30); // ⏱ reset timer
        setOtp(new Array(6).fill("")); // 🔥 clear inputs

        // focus first input
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      showToast("Failed to resend OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 AUTO VERIFY OTP
  useEffect(() => {
    const verifyOTP = async () => {
      const fullOtp = otp.join("");

      if (fullOtp.length === 6) {
        setLoading(true);
        try {
          const res = await axios.post(`${API}/verify-otp`, {
            email,
            otp: fullOtp,
          });

          if (res.data.success) {
            showToast("OTP Verified!", "success");
            setStep(3); // 🔥 move to password step
          }
        } catch (err) {
          showToast("Invalid OTP", "error");
          setOtp(new Array(6).fill(""));
          inputsRef.current[0].focus();
        } finally {
          setLoading(false);
        }
      }
    };

    verifyOTP();
  }, [otp]);

  // 🔐 RESET PASSWORD
  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/reset-password`, {
        email,
        newPassword,
      });

      if (res.data.success) {
        showToast("Password updated!", "success");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      showToast("Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Reset Password</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p className="auth-description">
              Enter your email to receive a password reset OTP.
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendOTP}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 2 - OTP */}
        {step === 2 && (
          <>
            <div className="otp-wrapper">
              <p className="auth-description">
                Enter the 6-digit OTP sent to your email
              </p>

              <div className="otp-container">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                  />
                ))}
              </div>
            </div>

            <p className="otp-resend">
              {timer > 0 ? (
                <span className="disabled">Resend in {timer}s</span>
              ) : (
                <span className="active" onClick={resendOTP}>
                  Resend OTP
                </span>
              )}
            </p>
          </>
        )}

        {/* STEP 3 - PASSWORD */}
        {step === 3 && (
          <>
            <p className="auth-description">Enter your new password below.</p>
            <input
              type="password"
              placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handleReset}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}

export default ResetPassword;
