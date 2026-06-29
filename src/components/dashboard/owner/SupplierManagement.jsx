import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Truck, 
  PlusCircle, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Briefcase 
} from "lucide-react";
import Toast from "../../common/Toast";
import DatePicker from "../../common/DatePicker";
import "../../../styles/SupplierManagement.css";
import "../../../styles/ProductsTable.css";
import { API_URL } from "../../../config";

function SupplierManagement({ storeId }) {
  const [activeTab, setActiveTab] = useState("directory"); // directory, po_create, po_list
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [poForm, setPoForm] = useState({ store_id: "", supplier_id: "", expectedDeliveryDate: "", notes: "" });
  
  // PO items builder
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQty, setItemQty] = useState(10);
  const [itemPrice, setItemPrice] = useState(100);
  const [poItems, setPoItems] = useState([]);

  const token = localStorage.getItem("token");

  const filteredProducts = products;

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  useEffect(() => {
    fetchSuppliers();
    fetchPOs();
    fetchStores();
  }, []);

  const fetchSupplierCatalog = async (supplierId) => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/products/catalog/${supplierId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (poForm.supplier_id) {
      fetchSupplierCatalog(poForm.supplier_id);
    } else {
      setProducts([]);
    }
  }, [poForm.supplier_id]);

  // Reset PO items when Store or Supplier changes to prevent data mismatches
  useEffect(() => {
    setPoItems([]);
  }, [poForm.store_id, poForm.supplier_id]);

  // Reactive selection of the first product supplied by the selected supplier
  useEffect(() => {
    if (poForm.supplier_id && products.length > 0) {
      if (!products.some(f => f._id === selectedProduct)) {
        setSelectedProduct(products[0]._id);
        setItemPrice(products[0].purchasePrice || 100);
      }
    } else {
      setSelectedProduct("");
      setItemPrice(0);
    }
  }, [poForm.supplier_id, products]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/owner-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers/po/owner`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPurchaseOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/stores/getMyStores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStores(res.data.data);
        if (res.data.data.length > 0) {
          setPoForm(prev => ({ ...prev, store_id: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    const prod = products.find(p => p._id === productId);
    if (prod) {
      setItemPrice(prod.purchasePrice || 100);
    }
  };



  const handleAddPOItem = () => {
    if (!selectedProduct) {
      showToast("Select a product to add", "error");
      return;
    }
    const prod = products.find(p => p._id === selectedProduct);
    if (!prod) return;

    // Check if already in list
    if (poItems.some(i => i.product_id === selectedProduct)) {
      showToast("Product already added to list", "error");
      return;
    }

    setPoItems(prev => [...prev, {
      product_id: selectedProduct,
      productName: prod.name,
      quantity: Number(itemQty),
      unitPrice: Number(itemPrice)
    }]);
  };

  const handleRemovePOItem = (prodId) => {
    setPoItems(prev => prev.filter(i => i.product_id !== prodId));
  };

  const handleSendPO = async (e) => {
    e.preventDefault();
    if (!poForm.store_id || !poForm.supplier_id || poItems.length === 0) {
      showToast("Store, Supplier, and at least one item are required.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/suppliers/po/create`, {
        ...poForm,
        items: poItems
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast("Purchase Order successfully sent!", "success");
        setPoItems([]);
        setPoForm({ store_id: stores[0]?._id || "", supplier_id: "", expectedDeliveryDate: "", notes: "" });
        fetchPOs();
        setActiveTab("po_list");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to send purchase order", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-owner-panel">
      <div className="section-title">
        <Truck size={24} style={{ color: "#818cf8" }} />
        <span>Suppliers Management Workspace</span>
      </div>

      <div className="owner-supplier-tabs">
        <button className={`owner-supplier-tab-btn ${activeTab === "directory" ? "active" : ""}`} onClick={() => setActiveTab("directory")}>Supplier Directory</button>
        <button className={`owner-supplier-tab-btn ${activeTab === "po_create" ? "active" : ""}`} onClick={() => setActiveTab("po_create")}>Create Purchase Order</button>
        <button className={`owner-supplier-tab-btn ${activeTab === "po_list" ? "active" : ""}`} onClick={() => setActiveTab("po_list")}>Purchase Orders Log</button>
      </div>

      {/* Directory Tab */}
      {activeTab === "directory" && (
        suppliers.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", padding: "4rem", borderRadius: "20px", textAlign: "center", color: "#64748b" }}>
            <Truck size={36} style={{ margin: "0 auto 1.5rem auto", display: "block" }} />
            <h3>No Suppliers Registered</h3>
            <p>There are no suppliers registered in your network.</p>
          </div>
        ) : (
          <div className="supplier-directory-grid">
            {suppliers.map((sup) => (
              <div className="supplier-directory-card" key={sup._id}>
                <div className="supplier-card-header">
                  <div className="supplier-card-avatar">{sup.name.charAt(0).toUpperCase()}</div>
                  <div className="supplier-card-name">{sup.name}</div>
                </div>
                <div className="supplier-card-info-item">
                  <Mail size={14} style={{ color: "#818cf8" }} />
                  <span>{sup.email}</span>
                </div>
                <div className="supplier-card-info-item">
                  <Phone size={14} style={{ color: "#818cf8" }} />
                  <span>{sup.contact}</span>
                </div>
                {sup.address && (
                  <div className="supplier-card-info-item">
                    <MapPin size={14} style={{ color: "#818cf8" }} />
                    <span>{sup.address}</span>
                  </div>
                )}
                <div className="supplier-card-info-item" style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
                  <span>Supplier Ref: {sup.supplier_id}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}



      {/* Create Purchase Order Tab */}
      {activeTab === "po_create" && (
        <div className="owner-supplier-form" style={{ maxWidth: "750px" }}>
          <h3 className="auth-title">Create Purchase Order</h3>
          <p className="auth-desc">Select products from your inventory, enter request rates and quantities, and assign them directly to a supplier.</p>
          <form onSubmit={handleSendPO}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Deliver to Store</label>
                <select className="form-select-input" value={poForm.store_id} onChange={(e) => setPoForm({ ...poForm, store_id: e.target.value })} required>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Supplier</label>
                <select className="form-select-input" value={poForm.supplier_id} onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })} required>
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Items Adder Box */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
              <h4 style={{ margin: "0 0 1rem 0", color: "#818cf8" }}>Add Items to PO</h4>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Select Product</label>
                  <select 
                    className="form-select-input" 
                    value={selectedProduct} 
                    onChange={(e) => handleProductChange(e.target.value)}
                    disabled={!poForm.supplier_id || filteredProducts.length === 0}
                  >
                    {!poForm.supplier_id ? (
                      <option value="">Select supplier first...</option>
                    ) : filteredProducts.length === 0 ? (
                      <option value="">No products supplied by this supplier...</option>
                    ) : (
                      filteredProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)
                    )}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Quantity</label>
                  <input type="number" className="form-input" value={itemQty} onChange={(e) => setItemQty(e.target.value)} min={1} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Unit Price (Rs)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={itemPrice}
                    readOnly
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      color: "#94a3b8",
                      cursor: "not-allowed"
                    }}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn-add-item" 
                  onClick={handleAddPOItem} 
                  style={{ padding: "0.9rem" }}
                  disabled={!selectedProduct || filteredProducts.length === 0}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Items List */}
              {poItems.length > 0 && (
                <table className="po-creator-items-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Product</th>
                      <th style={{ textAlign: "center" }}>Quantity</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "center" }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.productName}</td>
                        <td style={{ textAlign: "center" }}>{item.quantity}</td>
                        <td style={{ textAlign: "right" }}>₹{item.unitPrice}</td>
                        <td style={{ textAlign: "right", color: "#10b981", fontWeight: 700 }}>₹{item.quantity * item.unitPrice}</td>
                        <td style={{ textAlign: "center" }}>
                          <button type="button" onClick={() => handleRemovePOItem(item.product_id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div className="form-group">
                <label>Expected Delivery Date</label>
                <DatePicker
                  value={poForm.expectedDeliveryDate}
                  onChange={(val) => setPoForm({ ...poForm, expectedDeliveryDate: val })}
                />
              </div>
              <div className="form-group">
                <label>Total PO Amount</label>
                <div className="form-input" style={{ background: "rgba(255,255,255,0.02)", color: "#10b981", fontWeight: "bold" }}>
                  ₹{poItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Special Instructions / Notes</label>
              <textarea className="form-input" style={{ resize: "none" }} placeholder="Deliver post 4 PM. Ensure cold storage pack..." rows={3} value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} />
            </div>

            <button type="submit" className="primary-btn" disabled={loading || poItems.length === 0}>
              {loading ? "Sending..." : "Dispatch Purchase Order"}
            </button>
          </form>
        </div>
      )}

      {/* Sent Purchase Orders List Tab */}
      {activeTab === "po_list" && (
        <div className="products-section">
          <h3 className="auth-title" style={{ marginBottom: "1.5rem" }}>Purchase Orders Log</h3>
          {purchaseOrders.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", padding: "3rem", borderRadius: "16px", textAlign: "center", color: "#64748b" }}>
              <Clock size={36} style={{ margin: "0 auto 1rem auto", display: "block" }} />
              <span>No purchase orders placed yet.</span>
            </div>
          ) : (
            <div className="products-table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>Destination Store</th>
                    <th>Supplier Partner</th>
                    <th>Value</th>
                    <th>Delivery Target</th>
                    <th>Status</th>
                    <th>Supplier Response</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po._id}>
                      <td>
                        <span className="invoice-badge" style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899" }}>{po.po_id}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "white" }}>{po.store_id?.name || "Retail Outlet"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "white" }}>{po.supplier_id?.name || "Supplier"}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{po.supplier_id?.email || ""}</div>
                      </td>
                      <td>
                        <span className="amount-text">₹{po.totalAmount}</span>
                      </td>
                      <td>
                        <div>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN") : "Not scheduled"}</div>
                      </td>
                      <td>
                        <span className={`po-status-badge ${po.status}`}>{po.status}</span>
                      </td>
                      <td style={{ maxWidth: "200px", fontSize: "0.85rem" }}>
                        {po.supplierResponse?.message ? (
                          <div>
                            <div style={{ fontWeight: "bold", color: "#a78bfa" }}>Response:</div>
                            <div style={{ color: "#94a3b8" }}>{po.supplierResponse.message}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#64748b", fontStyle: "italic" }}>Awaiting response...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}

export default SupplierManagement;
