const RecentSales = () => {
  const data = [
    { product: "Milk 1L", date: "19 Oct 2025", qty: 10, amt: "₹500" },
    { product: "Bread", date: "18 Oct 2025", qty: 5, amt: "₹150" },
  ];

  return (
    <div className="recent-sales">
      <h2>Recent Sales</h2>
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
          {data.map((s, i) => (
            <tr key={i}>
              <td>{s.product}</td>
              <td>{s.date}</td>
              <td>{s.qty}</td>
              <td>{s.amt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentSales;
