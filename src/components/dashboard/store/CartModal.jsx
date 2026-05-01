import "../../../styles/CartModal.css";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import Toast from "../../common/Toast";
import { API_URL } from "../../../config";

const CartModal = ({ cart, setCart, onClose, refreshDashboard }) => {
  const location = useLocation();
  // Extract storeId from URL path /store/:storeId
  const storeId = location.pathname.split("/store/")[1];
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  const increase = (id) => {
    setCart(cart.map((p) => (p._id === id ? { ...p, qty: p.qty + 1 } : p)));
  };

  const decrease = (id) => {
    setCart(
      cart
        .map((p) => (p._id === id ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0),
    );
  };

  const remove = (id) => {
    setCart(cart.filter((p) => p._id !== id));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.qty,
    0,
  );

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showToast("You are not authenticated. Please log in again.", "error");
        return;
      }

      if (!storeId) {
        showToast("Store information not found. Please try again.", "error");
        return;
      }

      // Step 1: Create Sale
      if (!customerEmail) {
        showToast("Customer email is required to send the invoice.", "error");
        return;
      }

      const saleRes = await fetch(
        `${API_URL}/api/sales/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: cart,
            store_id: storeId,
            subtotal: total,
            totalAmount: total,
            customer_mobile: customerMobile || null,
          }),
        },
      );

      const saleData = await saleRes.json();

      if (!saleData.success) {
        showToast(saleData.message || "Failed to create sale", "error");
        return;
      }

      // Step 2: Generate Invoice from Sale
      const saleId = saleData.data._id;
      const invoiceRes = await fetch(
        `${API_URL}/api/invoices/generate/${saleId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customer_email: customerEmail,
            customer_mobile: customerMobile || null,
          }),
        },
      );

      const invoiceData = await invoiceRes.json();

      if (invoiceData.success) {
        showToast("Invoice emailed successfully to the customer.", "success");
        if (refreshDashboard) {
          refreshDashboard();
        }
        setTimeout(() => {
          setCart([]);
          onClose();
        }, 1200);
      } else {
        showToast(
          invoiceData.message || "Failed to send invoice email.",
          "error",
        );
      }
    } catch (err) {
      console.error(err);
      showToast("Error completing checkout: " + err.message, "error");
    }
  };

  return (
    <div className="cart-overlay">
      <div className="cart-modal">
        <div className="cart-header">
          <h2>🛒 Billing</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="cart-items">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="product-name">{item.name}</div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          marginTop: "2px",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="product-price">₹{item.sellingPrice}</td>
                  <td>
                    <div className="cart-quantity-controls">
                      <button onClick={() => decrease(item._id)}>
                        <Minus size={14} />
                      </button>
                      <span>{item.qty}</span>
                      <button onClick={() => increase(item._id)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td>₹{item.qty * item.sellingPrice}</td>
                  <td>
                    <button
                      className="cart-remove-btn"
                      onClick={() => remove(item._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
        <div className="cart-footer">
          <div className="customer-email">
            <label>Customer Email:</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="customer-mobile">
            <label>Customer Mobile:</label>
            <input
              type="tel"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Enter mobile number"
            />
          </div>

          <div className="cart-total">
            <h3>Total: ₹{total}</h3>
          </div>

          <div className="cart-actions">
            <button className="cancel-btn1" onClick={onClose}>
              Cancel
            </button>
            <button className="checkout-btn" onClick={handleCheckout}>
              Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
