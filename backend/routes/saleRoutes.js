const express = require("express");
const router = express.Router();
const { createSale } = require("../controllers/salesController");

router.post("/create", createSale);

module.exports = router;