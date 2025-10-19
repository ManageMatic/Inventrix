require('dotenv').config({ path: __dirname + '/.env' });
const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');

// Connect to MongoDB
connectToMongo();

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000", // frontend URL
  credentials: true,              // allow cookies, tokens, etc.
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));