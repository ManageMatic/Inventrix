require('dotenv').config({ path: __dirname + '/.env' });
const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');

// Connect to MongoDB
connectToMongo();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);

// Test route
app.get("/", (req, res) => res.send("Inventrix Backend API Running"));

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));