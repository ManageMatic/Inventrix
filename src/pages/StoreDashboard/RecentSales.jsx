import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const RecentSales = () => {
  const { storeId } = useParams();
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!storeId) return;
    fetchRecentSales();
  }, [storeId]);

  const fetchRecentSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/recent/${storeId}?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data.success) {
        setRecentSales(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch recent sales error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="recent-sales"><p>Loading...</p></div>;

  if (error) return <div className="recent-sales"><p style={{ color: 'red' }}>Error: {error}</p></div>;

  return (
    <div className="recent-sales">
      <h2>Recent Sales</h2>
      {recentSales.length === 0 ? (
        <p>No recent sales found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Date</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale, i) => (
              <tr key={i}>
                <td>{sale.product}</td>
                <td>{sale.date}</td>
                <td>{sale.quantity}</td>
                <td>{sale.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentSales;
