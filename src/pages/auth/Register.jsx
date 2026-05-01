import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/auth.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "store_owner",
    store_id: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const navigate = useNavigate();

  // Fetch stores when userType changes to employee
  useEffect(() => {
    if (formData.userType === "employee") {
      fetchStores();
    }
  }, [formData.userType]);

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const res = await axios.get("http://localhost:5000/api/stores/all");
      if (res.data.success) {
        setStores(res.data.data);
        // Clear store_id if no stores available
        if (res.data.data.length === 0) {
          setFormData((prev) => ({ ...prev, store_id: "" }));
        }
      }
    } catch (err) {
      console.error("Error fetching stores:", err);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate store selection for employees
    if (formData.userType === "employee" && !formData.store_id) {
      setMessage("Please select a store to register as employee");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
      );
      setMessage(res.data.message || "Registered successfully!");
      navigate("/login");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error registering.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join Invintrix and manage your store smarter 🚀
        </p>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
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

        <select
          name="userType"
          onChange={handleChange}
          value={formData.userType}
        >
          <option value="store_owner">Store Owner</option>
          <option value="employee">Employee</option>
          <option value="supplier">Supplier</option>
        </select>

        {/* Store Selection for Employees */}
        {formData.userType === "employee" && (
          <select
            name="store_id"
            onChange={handleChange}
            value={formData.store_id}
            required
            disabled={loadingStores || stores.length === 0}
          >
            <option value="">
              {loadingStores
                ? "Loading stores..."
                : stores.length === 0
                  ? "No stores available"
                  : "Select your store"}
            </option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name} - {store.location}
              </option>
            ))}
          </select>
        )}

        <button type="submit">Register</button>
        {message && <p className="auth-message">{message}</p>}

        {/* Extra Link */}
        <p className="auth-extra">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
