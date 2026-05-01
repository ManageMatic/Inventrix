import "../../../styles/GenerateQR.css";
import { useEffect, useState, useRef } from "react";
const API_URL = import.meta.env.VITE_API_URL;

// ── Helper: Extract IP from API URL ──────────────────────
const getIPFromURL = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

const GenerateQR = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // For cache-busting QR images
  const [currentIP, setCurrentIP] = useState(getIPFromURL(API_URL));
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  const ipCheckIntervalRef = useRef(null);
  const token = localStorage.getItem("token");

  // ── IP Change Detection ──────────────────────────────────
  useEffect(() => {
    const checkIPChange = () => {
      const newIP = getIPFromURL(API_URL);
      if (newIP && newIP !== currentIP) {
        console.log(`🔄 IP changed from ${currentIP} to ${newIP}. Refreshing QR codes...`);
        setCurrentIP(newIP);
        setRefreshKey((prev) => prev + 1); // Trigger re-render with new cache-buster
        setShowRefreshNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => setShowRefreshNotification(false), 3000);
      }
    };

    // Check for IP change every 10 seconds
    ipCheckIntervalRef.current = setInterval(checkIPChange, 10000);

    return () => {
      if (ipCheckIntervalRef.current) {
        clearInterval(ipCheckIntervalRef.current);
      }
    };
  }, [currentIP]);

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
    <div className="generate-qr-wrapper">      {/* IP Change Notification */}
      {showRefreshNotification && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "16px 24px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          animation: "slideIn 0.3s ease-in-out"
        }}>
          ✅ QR codes refreshed - IP updated
        </div>
      )}
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
                key={refreshKey}
                src={`${API_URL}/qr_codes/QR_${p.name}.png?t=${refreshKey}`}
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
