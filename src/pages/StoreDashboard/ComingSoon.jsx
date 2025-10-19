const ComingSoon = ({ tab }) => {
  return (
    <div className="coming-soon">
      <h2>{tab.charAt(0).toUpperCase() + tab.slice(1)} Management</h2>
      <p>Coming soon with full CRUD functionality!</p>
    </div>
  );
};

export default ComingSoon;
