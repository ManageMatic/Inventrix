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
import { API_URL } from "../../config";

// Layout components
import EmployeeHeader from "../../components/dashboard/employee/EmployeeHeader";
import EmployeeSidebar from "../../components/dashboard/employee/EmployeeSidebar";

// Lazy-loaded or separate components
import PointOfSale from "../../components/dashboard/employee/PointOfSale";
import TimeClock from "../../components/dashboard/employee/TimeClock";
import EmployeeProfile from "../../components/dashboard/employee/EmployeeProfile";

// Reusing Owner's tables but wrapped/restricted in future if needed
import ProductsTable from "../../components/dashboard/store/ProductsTable"; 
import SalesTable from "../../components/dashboard/store/SalesTable";

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
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

    // Core Tabs (Everyone gets these)
    tabs.push({ id: "profile", label: "My Profile", icon: <User size={20} /> });
    tabs.push({ id: "clock", label: "Time & Schedule", icon: <Clock size={20} /> });

    // RBAC Tabs
    if (hasPermission("sales", "create")) {
        tabs.push({ id: "pos", label: "Point of Sale", icon: <ShoppingCart size={20} /> });
    }
    
    if (hasPermission("sales", "read")) {
        tabs.push({ id: "sales_history", label: "Sales History", icon: <TrendingUp size={20} /> });
    }

    if (hasPermission("products", "read") || hasPermission("products", "update")) {
        tabs.push({ id: "inventory", label: "Inventory", icon: <Package size={20} /> });
    }

    return tabs;
  };

  const renderContent = () => {
    if (loading) return <div className="employee-placeholder"><div className="spinner"></div><p>Loading Workspace...</p></div>;
    
    switch (activeTab) {
      case "profile":
        return <EmployeeProfile employee={employee} onUpdate={fetchEmployeeProfile} />;
      case "clock":
        return <TimeClock employee={employee} onUpdate={fetchEmployeeProfile} />;
      case "pos":
        return <PointOfSale storeId={employee?.store_id} />;
      case "sales_history":
        return <SalesTable storeId={employee?.store_id} />;
      case "inventory":
        return <ProductsTable storeId={employee?.store_id} refreshSignal={0} />;
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
