import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard";
import StoreDashboard from "./pages/StoreDashboard/StoreDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/OwnerDashboard" element={<OwnerDashboard />} />
        <Route path="/store/:storeId" element={<StoreDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
