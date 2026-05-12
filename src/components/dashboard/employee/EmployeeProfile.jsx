import { User } from "lucide-react";

const EmployeeProfile = ({ employee, onUpdate }) => {
    return (
        <div className="employee-placeholder">
            <User size={64} opacity={0.5} />
            <h2>My Profile & Security</h2>
            <p>Update your personal information and change your password.</p>
            <p><em>(Module coming soon in the next phase)</em></p>
        </div>
    );
};

export default EmployeeProfile;
