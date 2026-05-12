import { ShoppingCart } from "lucide-react";

const PointOfSale = ({ storeId }) => {
    return (
        <div className="employee-placeholder">
            <ShoppingCart size={64} opacity={0.5} />
            <h2>Point of Sale (POS)</h2>
            <p>Scan items and process customer checkouts here.</p>
            <p><em>(Module coming soon in the next phase)</em></p>
        </div>
    );
};

export default PointOfSale;
