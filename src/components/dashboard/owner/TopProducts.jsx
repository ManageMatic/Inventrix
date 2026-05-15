import React from 'react';

const TopProducts = ({ products }) => {
  const maxQty = products.length > 0 ? Math.max(...products.map(p => p.quantity)) : 0;

  return (
    <div className="analytics-card top-products">
      <h3>Top 5 Best Selling Products</h3>
      <div className="top-products-list">
        {products.length === 0 ? (
          <p className="empty-msg">No data available</p>
        ) : (
          products.map((product, index) => (
            <div key={index} className="product-progress-item">
              <div className="product-info">
                <span className="product-name">{product.name}</span>
                <span className="product-count">{product.quantity} sold</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${(product.quantity / maxQty) * 100}%`,
                    background: `linear-gradient(90deg, #3b82f6, #60a5fa)` 
                  }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopProducts;
