require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const connectToMongo = async () => {
    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully!');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
};

module.exports = connectToMongo;
