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

  // ── Print single QR ─────────────────────────────────────────
  const handlePrint = (productName, name) => {
    const url = `${API_URL}/qr_codes/QR_${productName}.png`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <body style="display:flex;flex-direction:column;align-items:center;
                     justify-content:center;height:100vh;font-family:sans-serif;">
          <img src="${url}" width="200" />
          <p style="font-size:18px;font-weight:600;margin-top:12px;">${name}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading QR codes...</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.centerBox}>
        <p style={styles.errorText}>⚠️ {error}</p>
        <button style={styles.retryBtn} onClick={fetchProducts}>
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div style={styles.centerBox}>
        <p style={styles.emptyText}>No products found for this store.</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      {/* Header row */}
      <div style={styles.header}>
        <h2 style={styles.title}>QR Codes</h2>
        <span style={styles.badge}>{products.length} products</span>
      </div>

      {/* QR grid */}
      <div style={styles.grid}>
        {products.map((p) => (
          <div key={p._id} style={styles.card}>
            {/* QR Image */}
            <div style={styles.qrBox}>
              <img
                src={`${API_URL}/qr_codes/QR_${p.name}.png`}
                alt={p.name}
                width="140"
                height="140"
                style={styles.qrImg}
                onError={(e) => {
                  // Show placeholder if QR image not found
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              {/* Fallback placeholder */}
              <div style={{ ...styles.qrPlaceholder, display: "none" }}>
                <span style={{ fontSize: 36 }}>🔲</span>
                <small style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                  QR not generated
                </small>
              </div>
            </div>

            {/* Product info */}
            <div style={styles.info}>
              <p style={styles.productName}>{p.name}</p>
              <small style={styles.productId}>{p.product_id}</small>

              {/* ── What this QR encodes (debug helper) ── */}
              <small style={styles.qrUrl}>
                🔗 /scan-product/{p.qr_code}?storeId={storeId}
              </small>
            </div>

            {/* Action buttons */}
            <div style={styles.actions}>
              <button
                style={styles.downloadBtn}
                onClick={() => handleDownload(p.name)}
                title="Download QR"
              >
                ⬇ Download
              </button>
              <button
                style={styles.printBtn}
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

// ── Styles ────────────────────────────────────────────────────
const styles = {
  wrapper: {
    padding: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  badge: {
    background: "#e0e7ff",
    color: "#4f46e5",
    borderRadius: 20,
    padding: "2px 12px",
    fontSize: 13,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  qrBox: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImg: {
    display: "block",
    borderRadius: 6,
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    borderRadius: 6,
  },
  info: {
    textAlign: "center",
    width: "100%",
  },
  productName: {
    fontWeight: 600,
    fontSize: 15,
    color: "#1e293b",
    margin: "0 0 2px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  productId: {
    color: "#94a3b8",
    fontSize: 12,
    display: "block",
  },
  qrUrl: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 10,
    marginTop: 4,
    wordBreak: "break-all",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  downloadBtn: {
    flex: 1,
    padding: "7px 0",
    border: "none",
    borderRadius: 8,
    background: "#4f46e5",
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  printBtn: {
    flex: 1,
    padding: "7px 0",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    color: "#475569",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: 12,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: 600,
  },
  retryBtn: {
    padding: "8px 20px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
  },
};

export default GenerateQR;
