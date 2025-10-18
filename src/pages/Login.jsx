import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
        {
          withCredentials: true,
        }
      );
      localStorage.setItem("token", res.data.token);
      setMessage("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
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
        {message && <p className="auth-message">{message}</p>}

        {/* Extra Links */}
        <p className="auth-extra">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-extra">
          Forgot your password? <Link to="/reset-password">Reset here</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
