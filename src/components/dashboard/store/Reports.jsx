import { useState } from "react";
import { Download, Package, Users, DollarSign, Loader2, TrendingUp } from "lucide-react";
import Toast from "../../common/Toast";
import "../../../styles/Reports.css";
import { API_URL } from "../../../config";

const Reports = ({ storeId }) => {
    const [loading, setLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [timeframe, setTimeframe] = useState("all");

    const showToast = (message, type = "info") => setToast({ message, type });

    const downloadCSV = (csvContent, fileName) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const convertToCSV = (data, headers, totalRow = null) => {
        const csvRows = [];
        // Add headers
        csvRows.push(headers.join(','));

        // Add data
        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + (row[header] !== undefined && row[header] !== null ? row[header] : '')).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        // Add Total Row if provided
        if (totalRow) {
            const values = headers.map(header => {
                const escaped = ('' + (totalRow[header] !== undefined && totalRow[header] !== null ? totalRow[header] : '')).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    };

    const fetchReportData = async (endpoint) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch data");
        return data.data;
    };

    const generateInventoryReport = async () => {
        setLoading("inventory");
        try {
            const products = await fetchReportData(`/api/products/${storeId}`);

            if (!products || products.length === 0) {
                showToast("No products found to report", "error");
                return;
            }

            let totalValueSum = 0;

            const formattedData = products.map(p => {
                const totalValue = p.costPrice * p.quantity;
                totalValueSum += totalValue || 0;
                return {
                    'Store': p.store?.name || 'N/A',
                    'Product ID': p.product_id,
                    'Name': p.name,
                    'Category': p.category || 'N/A',
                    'Cost Price': p.costPrice || 0,
                    'Selling Price': p.sellingPrice || 0,
                    'Quantity': p.quantity,
                    'Reorder Level': p.reorderLevel || 10,
                    'Total Value': totalValue.toFixed(2),
                    'Status': p.quantity <= 5 ? 'Low Stock' : 'In Stock'
                };
            });

            const headers = Object.keys(formattedData[0]);
            
            const totalRow = {
                'Store': 'TOTAL',
                'Product ID': '',
                'Name': '',
                'Category': '',
                'Cost Price': '',
                'Selling Price': '',
                'Quantity': '',
                'Reorder Level': '',
                'Total Value': totalValueSum.toFixed(2),
                'Status': ''
            };

            const csv = convertToCSV(formattedData, headers, totalRow);
            downloadCSV(csv, `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
            showToast("Inventory Report generated!", "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(null);
        }
    };

    const generateStaffReport = async () => {
        setLoading("staff");
        try {
            const employees = await fetchReportData(`/api/employees/${storeId}`);

            if (!employees || employees.length === 0) {
                showToast("No staff members found", "error");
                return;
            }

            const formattedData = employees.map(e => ({
                'Store': e.store_id?.name || 'N/A',
                'Employee ID': e.employee_id,
                'Name': e.name,
                'Email': e.email,
                'Phone': e.phone,
                'Role': e.role?.name || 'N/A',
                'Status': e.status,
                'Clocked In': e.schedule?.clockedIn ? 'Yes' : 'No'
            }));

            const headers = Object.keys(formattedData[0]);
            const csv = convertToCSV(formattedData, headers);
            downloadCSV(csv, `staff_roster_${new Date().toISOString().split('T')[0]}.csv`);
            showToast("Staff Report generated!", "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(null);
        }
    };

    const generateSalesReport = async () => {
        setLoading("sales");
        try {
            const sales = await fetchReportData(`/api/sales/store/${storeId}?limit=5000&timeframe=${timeframe}`);

            if (!sales || sales.length === 0) {
                showToast(`No sales transactions found for ${timeframe}`, "error");
                return;
            }

            let totalRevenueSum = 0;

            const formattedData = sales.map(s => {
                totalRevenueSum += s.totalAmount || 0;
                return {
                    'Sale ID': s.sale_id,
                    'Date': new Date(s.date).toLocaleString(),
                    'Store': s.store_id?.name || 'N/A',
                    'Total Amount': s.totalAmount,
                    'Payment Method': s.paymentMethod,
                    'Items Sold': s.items?.length || 0,
                    'Handled By': s.employee_id?.name || s.store_owner_id?.name || 'N/A'
                };
            });

            const headers = Object.keys(formattedData[0]);

            const totalRow = {
                'Sale ID': 'TOTAL',
                'Date': '',
                'Store': '',
                'Total Amount': totalRevenueSum.toFixed(2),
                'Payment Method': '',
                'Items Sold': '',
                'Handled By': ''
            };

            const csv = convertToCSV(formattedData, headers, totalRow);
            downloadCSV(csv, `sales_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
            showToast("Sales Report generated!", "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(null);
        }
    };

    const generatePerformanceReport = async () => {
        setLoading("performance");
        try {
            const sales = await fetchReportData(`/api/sales/store/${storeId}?limit=5000&timeframe=${timeframe}`);

            if (!sales || sales.length === 0) {
                showToast(`No sales transactions found for ${timeframe}`, "error");
                return;
            }

            // Aggregate products
            const productStats = {};
            let totalRevenueSum = 0;
            let totalItemsSold = 0;

            for (const sale of sales) {
                for (const item of sale.items) {
                    // item.product_id might be populated or just an ID string depending on getSalesByStore
                    // The backend does populate items.product_id if requested, but wait! getSalesByStore doesn't populate items.product_id currently.
                    // Actually, let's just do a simple aggregation if it's not populated, or we can use product_id as the key.
                    // Let's assume it's just the ID since it wasn't populated in getSalesByStore.
                    // Wait, getSaleById populates it, but getSalesByStore doesn't. 
                    // Let's fetch all products to map ID to Name.
                    const pid = item.product_id?.toString();
                    if (!productStats[pid]) {
                        productStats[pid] = {
                            qty: 0,
                            revenue: 0
                        };
                    }
                    productStats[pid].qty += item.quantity;
                    productStats[pid].revenue += item.subtotal || (item.quantity * item.price);
                    
                    totalItemsSold += item.quantity;
                    totalRevenueSum += item.subtotal || (item.quantity * item.price);
                }
            }

            // Fetch products to map names
            const products = await fetchReportData(`/api/products/${storeId}`);
            const productMap = {};
            products.forEach(p => {
                productMap[p._id.toString()] = p;
            });

            const formattedData = Object.keys(productStats).map(pid => {
                const prod = productMap[pid];
                return {
                    'Product ID': prod ? prod.product_id : pid,
                    'Product Name': prod ? prod.name : 'Unknown Product',
                    'Category': prod ? prod.category : 'N/A',
                    'Store': prod ? (prod.store?.name || 'N/A') : 'N/A',
                    'Quantity Sold': productStats[pid].qty,
                    'Revenue Generated': productStats[pid].revenue.toFixed(2)
                };
            });

            // Sort by Revenue descending
            formattedData.sort((a, b) => parseFloat(b['Revenue Generated']) - parseFloat(a['Revenue Generated']));

            const headers = Object.keys(formattedData[0]);

            const totalRow = {
                'Product ID': 'TOTAL',
                'Product Name': '',
                'Category': '',
                'Store': '',
                'Quantity Sold': totalItemsSold,
                'Revenue Generated': totalRevenueSum.toFixed(2)
            };

            const csv = convertToCSV(formattedData, headers, totalRow);
            downloadCSV(csv, `performance_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
            showToast("Product Performance Report generated!", "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="reports-tab">
            <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2>Data & Reports</h2>
                    <p>Generate and download comprehensive spreadsheets for your business.</p>
                </div>
                
                <div className="timeframe-selector" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Timeframe:</label>
                    <select 
                        value={timeframe} 
                        onChange={(e) => setTimeframe(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.95rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="all" style={{ background: '#0f172a' }}>All Time</option>
                        <option value="week" style={{ background: '#0f172a' }}>Past 7 Days</option>
                        <option value="month" style={{ background: '#0f172a' }}>Past 30 Days</option>
                        <option value="year" style={{ background: '#0f172a' }}>Past 12 Months</option>
                    </select>
                </div>
            </div>

            <div className="reports-grid">
                {/* Product Performance Report Card */}
                <div className="report-card">
                    <div className="report-info">
                        <div className="report-icon-wrapper">
                            <TrendingUp size={24} />
                        </div>
                        <h3>Product Performance</h3>
                        <p>Analyze which items sold the most and generated the most revenue within your selected timeframe.</p>
                    </div>
                    <button
                        className="generate-btn"
                        onClick={generatePerformanceReport}
                        disabled={loading !== null}
                    >
                        {loading === "performance" ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                        {loading === "performance" ? "Generating..." : "Download CSV"}
                    </button>
                </div>

                {/* Sales Transaction Report Card */}
                <div className="report-card">
                    <div className="report-info">
                        <div className="report-icon-wrapper">
                            <DollarSign size={24} />
                        </div>
                        <h3>Sales Transactions</h3>
                        <p>Export a comprehensive log of recent sales transactions, revenue totals, and employee handling data.</p>
                    </div>
                    <button
                        className="generate-btn"
                        onClick={generateSalesReport}
                        disabled={loading !== null}
                    >
                        {loading === "sales" ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                        {loading === "sales" ? "Generating..." : "Download CSV"}
                    </button>
                </div>

                {/* Inventory Report Card */}
                <div className="report-card">
                    <div className="report-info">
                        <div className="report-icon-wrapper">
                            <Package size={24} />
                        </div>
                        <h3>Inventory Snapshot</h3>
                        <p>Export a full master list of your current warehouse stock, pricing, total asset value, and low-stock alerts.</p>
                    </div>
                    <button
                        className="generate-btn"
                        onClick={generateInventoryReport}
                        disabled={loading !== null}
                    >
                        {loading === "inventory" ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                        {loading === "inventory" ? "Generating..." : "Download CSV"}
                    </button>
                </div>

                {/* Staff Roster Report Card */}
                <div className="report-card">
                    <div className="report-info">
                        <div className="report-icon-wrapper">
                            <Users size={24} />
                        </div>
                        <h3>Staff Roster</h3>
                        <p>Download a complete directory of your employees across the franchise, including contact info and active status.</p>
                    </div>
                    <button
                        className="generate-btn"
                        onClick={generateStaffReport}
                        disabled={loading !== null}
                    >
                        {loading === "staff" ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                        {loading === "staff" ? "Generating..." : "Download CSV"}
                    </button>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Reports;
