import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import Toast from "../../components/common/Toast";
import { API_URL } from "../../config";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        formData,
        { withCredentials: true },
      );

      localStorage.setItem("token", res.data.token);

      showToast("Login successful!", "success");

      // small delay so toast is visible
      setTimeout(() => {
        if (res.data.user.userType === 'employee') {
          navigate("/EmployeeDashboard");
        } else {
          navigate("/OwnerDashboard");
        }
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid credentials", "error");
    }
  };

  return (
    <>
      {/* MAIN FORM */}
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">
            Login to continue managing your store 🛒
          </p>

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit">Login</button>

          {/* Links */}
          <p className="auth-extra">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
          <p className="auth-extra">
            Forgot your password? <Link to="/reset-password">Reset here</Link>
          </p>
        </form>
      </div>

      {/* TOAST */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </>
  );
}

export default Login;
