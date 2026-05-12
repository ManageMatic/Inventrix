import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  User, 
  TrendingUp
} from "lucide-react";
import "../../styles/OwnerDashboard.css"; // Using Owner Dashboard styling
import Toast from "../../components/common/Toast";
import { API_URL, SOCKET_URL } from "../../config";
import { io } from "socket.io-client";

// Layout components
import EmployeeHeader from "../../components/dashboard/employee/EmployeeHeader";
import EmployeeSidebar from "../../components/dashboard/employee/EmployeeSidebar";

// Lazy-loaded or separate components
import TimeClock from "../../components/dashboard/employee/TimeClock";
import EmployeeProfile from "../../components/dashboard/employee/EmployeeProfile";

// Reusing Owner's tables but wrapped/restricted in future if needed
import ProductsTable from "../../components/dashboard/store/ProductsTable"; 
import SalesTable from "../../components/dashboard/store/SalesTable";

// Create socket instance outside component to prevent reconnects
const socket = io(SOCKET_URL);

const EmployeeDashboard = ({ cart, setCart, setCartOpen, dashboardRefresh, updateCartStoreId }) => {
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState("clock");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.user.userType === "employee") {
        setEmployee(data.user);
        
        // Extract permissions from populated role object
        if (data.user.role && data.user.role.permissions) {
            setPermissions(data.user.role.permissions);
        }

        // Setup Socket Listener for the employee's store
        const storeId = data.user.store_id?._id || data.user.store_id;
        if (storeId) {
          updateCartStoreId(storeId);
          const joinRoom = () => socket.emit("join-store", storeId);
          if (socket.connected) joinRoom();
          socket.on("connect", joinRoom);
        }

      } else {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching employee profile:", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Socket listener for global scanning
  useEffect(() => {
    const handleScan = (product) => {
      setCart((prev) => {
        const existing = prev.find((p) => p._id === product._id);
        if (existing) {
          return prev.map((p) => p._id === product._id ? { ...p, qty: p.qty + 1 } : p);
        }
        return [...prev, { ...product, qty: 1 }];
      });
      setCartOpen(true); // Open the global cart modal immediately!
    };

    socket.on("product-scanned", handleScan);
    return () => socket.off("product-scanned", handleScan);
  }, [setCart, setCartOpen]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const hasPermission = (resource, action) => {
    const perm = permissions.find(p => p.resource === resource);
    return perm && perm.actions.includes(action);
  };

  // Determine what tabs this employee has access to
  const getAvailableTabs = () => {
    const tabs = [];

    // Core Tabs
    tabs.push({ id: "clock", label: "Time & Schedule", icon: <Clock size={20} /> });

    // RBAC Tabs
    if (hasPermission("products", "read") || hasPermission("products", "update")) {
        tabs.push({ id: "inventory", label: "Inventory", icon: <Package size={20} /> });
    }

    if (hasPermission("sales", "read")) {
        tabs.push({ id: "sales_history", label: "Sales History", icon: <TrendingUp size={20} /> });
    }

    // Profile at the very bottom
    tabs.push({ id: "profile", label: "My Profile", icon: <User size={20} /> });

    return tabs;
  };

  const renderContent = () => {
    if (loading) return <div className="employee-placeholder"><div className="spinner"></div><p>Loading Workspace...</p></div>;
    
    switch (activeTab) {
      case "clock":
        return <TimeClock employee={employee} onUpdate={fetchEmployeeProfile} />;
      case "inventory":
        // 🔒 RBAC: Employees can ONLY view and create products (No Edit/Delete)
        const inventoryPerms = permissions.filter(p => p.resource === "products")
          .map(p => ({ ...p, actions: p.actions.filter(a => a === "read" || a === "create") }));
        return <ProductsTable storeId={employee?.store_id?._id || employee?.store_id} refreshSignal={dashboardRefresh} permissions={inventoryPerms} />;
      case "sales_history":
        // 🔒 RBAC: Employees can ONLY view their OWN sales history (No Edit/Delete)
        const salesPerms = permissions.filter(p => p.resource === "sales")
          .map(p => ({ ...p, actions: p.actions.filter(a => a === "read") }));
        return <SalesTable 
          storeId={employee?.store_id?._id || employee?.store_id} 
          employeeId={employee?.id} 
          refreshSignal={dashboardRefresh} 
          permissions={salesPerms} 
        />;
      case "profile":
        return <EmployeeProfile employee={employee} onUpdate={fetchEmployeeProfile} />;
      default:
        return <div className="employee-placeholder"><h2>Access Denied</h2></div>;
    }
  };

  const availableTabs = getAvailableTabs();

  if (loading) {
      return <div className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <EmployeeSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        employee={employee}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTabs={availableTabs}
      />

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? "main-expanded" : ""}`}>
        <EmployeeHeader
          user={employee}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        <div className="content-area">
          {renderContent()}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmployeeDashboard;
