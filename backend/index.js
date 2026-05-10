require('dotenv').config({ path: __dirname + '/.env' });
const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const http = require('http');           // ← ADD
const { Server } = require('socket.io'); // ← ADD
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const saleRoutes = require('./routes/saleRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const path = require('path');
const os = require('os');

// Utility to get local IP address (for testing on LAN)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name of Object.keys(interfaces)) {
    for (let net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// Connect to MongoDB
connectToMongo();

const app = express();

// ── Create HTTP server (required for Socket.io) ──────────────
const server = http.createServer(app);  // ← ADD

// ── Socket.io setup ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Desktop joins a room using storeId
  socket.on("join-store", (storeId) => {
    socket.join(storeId);
    console.log(`📦 Socket ${socket.id} joined store room: ${storeId}`);
  });

  // User joins their personal room for notifications
  socket.on("join-user", (userId) => {
    socket.join(userId);
    console.log(`👤 Socket ${socket.id} joined user room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes')); // ← ADD
app.use('/qr_codes', express.static(path.join(__dirname, 'qr_codes')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));