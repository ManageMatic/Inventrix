const Employee = require('../models/Employee');

exports.getEmployeeCountByStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const count = await Employee.countDocuments({ store_id: storeId });

        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('GET EMPLOYEE COUNT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee count',
            error: error.message
        });
    }
};
