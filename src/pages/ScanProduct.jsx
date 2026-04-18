// src/pages/ScanProduct.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

const ScanProduct = () => {
  const { qrCode } = useParams();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [status, setStatus] = useState("scanning"); // scanning | success | error
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (qrCode) {
      sendScannedProduct();
    }
  }, [qrCode]);

  const sendScannedProduct = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/products/qr/${qrCode}?storeId=${storeId}`,
      );
      const data = await res.json();
      console.log("Scan response:", data);

      if (res.ok && data.success) {
        setProduct(data.data);
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setStatus("error");
    }
  };

  return (
    <div style={styles.container}>
      {status === "scanning" && (
        <>
          <div style={styles.spinner} />
          <p style={styles.text}>Looking up product...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={styles.checkmark}>✅</div>
          <h2 style={styles.title}>Product Added!</h2>
          <p style={styles.productName}>{product?.name}</p>
          <p style={styles.price}>₹{product?.sellingPrice}</p>
          <p style={styles.sub}>
            This product has been added to the sales table on desktop.
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.title}>Product Not Found</h2>
          <p style={styles.sub}>
            The scanned QR code did not match any product.
          </p>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4ff",
    fontFamily: "sans-serif",
    padding: "2rem",
    textAlign: "center",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "5px solid #ccc",
    borderTop: "5px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "1rem",
  },
  checkmark: { fontSize: 64, marginBottom: "1rem" },
  errorIcon: { fontSize: 64, marginBottom: "1rem" },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  productName: { fontSize: 20, fontWeight: 600, color: "#4f46e5" },
  price: { fontSize: 18, color: "#16a34a", margin: "0.5rem 0" },
  text: { fontSize: 16, color: "#64748b" },
  sub: { fontSize: 14, color: "#94a3b8", marginTop: "1rem", maxWidth: 300 },
};

export default ScanProduct;
