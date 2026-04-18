import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard";
import StoreDashboard from "./pages/StoreDashboard/StoreDashboard";
import ScanProduct from "./pages/ScanProduct";
import SalesTable from "./pages/StoreDashboard/SalesTable";
import CartModal from "./pages/StoreDashboard/CartModal";
import { useState } from "react";

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p._id === product._id);

      if (existing) {
        return prev.map((p) =>
          p._id === product._id ? { ...p, qty: p.qty + 1 } : p,
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });

    setCartOpen(true); // 🔥 OPEN MODAL
  };

  return (
    <BrowserRouter>
      {/* 🔥 ROUTES */}
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/OwnerDashboard" element={<OwnerDashboard />} />

        <Route
          path="/store/:storeId"
          element={
            <StoreDashboard
              cart={cart}
              setCart={setCart}
              setCartOpen={setCartOpen}
            />
          }
        />

        <Route
          path="/sales"
          element={<SalesTable cart={cart} setCart={setCart} />}
        />

        <Route
          path="/scan-product/:qrCode"
          element={<ScanProduct addToCart={addToCart} />}
        />
      </Routes>

      {/* 🔥 GLOBAL CART MODAL (PLACE HERE) */}
      {cartOpen && (
        <CartModal
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
