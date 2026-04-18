import { X, Trash2, Plus, Minus } from "lucide-react";

const CartModal = ({ cart, setCart, onClose }) => {
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
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            storeId: localStorage.getItem("storeId"),
          }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setCart([]);
        onClose();
      }
    } catch (err) {
      console.error(err);
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
          {cart.map((item) => (
            <div key={item._id} className="cart-row">
              <div className="cart-left">
                <h4>{item.name}</h4>
                <span>₹{item.sellingPrice}</span>
              </div>

              <div className="cart-center">
                <button onClick={() => decrease(item._id)}>
                  <Minus size={14} />
                </button>
                <span>{item.qty}</span>
                <button onClick={() => increase(item._id)}>
                  <Plus size={14} />
                </button>
              </div>

              <div className="cart-right">
                <span>₹{item.qty * item.sellingPrice}</span>
                <button onClick={() => remove(item._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <h3>Total: ₹{total}</h3>

          <button className="checkout-btn" onClick={handleCheckout}>
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
