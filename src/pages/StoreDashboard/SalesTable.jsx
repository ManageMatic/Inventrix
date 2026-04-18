import { Plus, Minus, Trash2 } from "lucide-react";

const SalesTable = () => {
  const { cart, increaseQty, decreaseQty, removeFromCart, grandTotal } =
    useCart();

  return (
    <div className="sales-section">
      <div className="sales-header">
        <h2>Sales Table</h2>
      </div>

      {cart.length === 0 ? (
        <p>No products added yet.</p>
      ) : (
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>

                  <td>&#8377;{item.sellingPrice}</td>

                  <td className="qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => decreaseQty(item._id)}
                    >
                      <Minus size={14} />
                    </button>

                    <span>{item.qty}</span>

                    <button
                      className="qty-btn"
                      onClick={() => increaseQty(item._id)}
                    >
                      <Plus size={14} />
                    </button>
                  </td>

                  <td>&#8377;{item.qty * item.sellingPrice}</td>

                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="sales-total">
            <h3>Total: &#8377;{grandTotal}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTable;