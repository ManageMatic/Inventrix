// seedRoles.js
const mongoose = require('mongoose');
const Role = require('./models/Role');
const defaultRolePermissions = require('./utils/rolePermissions');

require('dotenv').config({ path: __dirname + '/.env' });

const connectToMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedRoles = async () => {
    try {
        for (const key of Object.keys(defaultRolePermissions)) {
            const roleData = defaultRolePermissions[key];
            const exists = await Role.findOne({ name: roleData.name });
            if (!exists) {
                await Role.create(roleData);
                console.log(`Role created: ${roleData.name}`);
            } else {
                console.log(`Role exists: ${roleData.name}`);
            }
        }
        console.log('Seeding roles completed');
        process.exit(0);
    } catch (err) {
        console.error('Seeding roles failed:', err);
        process.exit(1);
    }
};

connectToMongo().then(seedRoles);
