import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

const GenerateQR = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.message || "Failed to load products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Download QR as PNG ──────────────────────────────────────
  const handleDownload = (productName) => {
    const url = `${API_URL}/qr_codes/QR_${productName}.png`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR_${productName}.png`;
    link.click();
  };

  // ── Print single QR (DMart style - Multiple QR on single page) ────────
  const handlePrint = (productName, productFullName) => {
    const url = `${API_URL}/qr_codes/QR_${productName}.png`;
    const qrPerRow = 4;
    const qrPerCol = 6;
    const totalQRs = qrPerRow * qrPerCol; // 24 QR codes per page

    // Generate QR grid HTML
    let qrGrid = "";
    for (let i = 0; i < totalQRs; i++) {
      qrGrid += `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #ddd;
          padding: 12px;
          width: 22%;
          text-align: center;
          break-inside: avoid;
        ">
          <img src="${url}" width="120" height="120" style="margin-bottom: 8px;" />
          <p style="margin: 4px 0; font-size: 11px; font-weight: 600;">${productFullName}</p>
          <small style="margin: 0; font-size: 9px; color: #666;">${productName}</small>
        </div>
      `;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ${productFullName}</title>
        </head>
        <body style="
          margin: 10px;
          padding: 0;
          font-family: Arial, sans-serif;
          background: white;
        ">
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 0;
            justify-content: flex-start;
            width: 100%;
          ">
            ${qrGrid}
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="generate-qr-center-box">
        <div className="generate-qr-spinner" />
        <p className="generate-qr-loading-text">Loading QR codes...</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="generate-qr-center-box">
        <p className="generate-qr-error-text">⚠️ {error}</p>
        <button className="generate-qr-retry-btn" onClick={fetchProducts}>
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="generate-qr-center-box">
        <p className="generate-qr-empty-text">No products found for this store.</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────
  return (
    <div className="generate-qr-wrapper">
      {/* Header row */}
      <div className="generate-qr-header">
        <h2 className="generate-qr-title">QR Codes</h2>
        <span className="generate-qr-badge">{products.length} products</span>
      </div>

      {/* QR grid */}
      <div className="generate-qr-grid">
        {products.map((p) => (
          <div 
            key={p._id} 
            className="generate-qr-card"
          >
            {/* QR Image */}
            <div className="generate-qr-box">
              <img
                src={`${API_URL}/qr_codes/QR_${p.name}.png`}
                alt={p.name}
                width="140"
                height="140"
                className="generate-qr-img"
                onError={(e) => {
                  // Show placeholder if QR image not found
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              {/* Fallback placeholder */}
              <div className="generate-qr-placeholder" style={{ display: "none" }}>
                <span>🔲</span>
                <small>QR not generated</small>
              </div>
            </div>

            {/* Product info */}
            <div className="generate-qr-info">
              <p className="generate-qr-product-name">{p.name}</p>
              <small className="generate-qr-product-id">{p.product_id}</small>
            </div>

            {/* Action buttons */}
            <div className="generate-qr-actions">
              <button
                className="generate-qr-download-btn"
                onClick={() => handleDownload(p.name)}
                title="Download QR"
              >
                ⬇ Download
              </button>
              <button
                className="generate-qr-print-btn"
                onClick={() => handlePrint(p.name, p.name)}
                title="Print QR"
              >
                🖨 Print
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerateQR;
