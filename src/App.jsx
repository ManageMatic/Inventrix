import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OwnerDashboard from "./pages/dashboard/OwnerDashboard";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import StoreDashboard from "./pages/dashboard/StoreDashboard";
import ScanProduct from "./pages/ScanProduct";
import SalesTable from "./components/dashboard/store/SalesTable";
import CartModal from "./components/dashboard/store/CartModal";
import ResetPassword from "./pages/auth/ResetPassword";
import { useState } from "react";

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);

  const updateCartStoreId = (id) => {
    setActiveStoreId(id);
  };

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

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard Routes */}
        <Route path="/OwnerDashboard" element={<OwnerDashboard />} />
        <Route 
          path="/EmployeeDashboard" 
          element={
            <EmployeeDashboard 
              cart={cart}
              setCart={setCart}
              setCartOpen={setCartOpen}
              dashboardRefresh={dashboardRefresh}
              updateCartStoreId={updateCartStoreId}
            />
          } 
        />

        <Route
          path="/store/:storeId"
          element={
            <StoreDashboard
              cart={cart}
              setCart={setCart}
              setCartOpen={setCartOpen}
              dashboardRefresh={dashboardRefresh}
              updateCartStoreId={updateCartStoreId}
            />
          }
        />

        <Route
          path="/sales"
          element={<SalesTable storeId="All" cart={cart} setCart={setCart} />}
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
          refreshDashboard={() => setDashboardRefresh((prev) => prev + 1)}
          storeId={activeStoreId}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
