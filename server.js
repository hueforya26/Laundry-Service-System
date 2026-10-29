const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Customer-page.html"));
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: false
  }
});



db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  connection.release();
  console.log("Connected to the customer database");
});

app.get("/customers", (req, res) => {
  const includeAll = req.query.scope === "all";
  const sql = includeAll
    ? "SELECT * FROM customers ORDER BY id DESC"
    : `SELECT * FROM customers WHERE DATE(created_at) = CURDATE() ORDER BY id DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Customer list query failed:", err.message);
      return res.status(500).json({ message: "Could not load customer records." });
    }
    res.json(results);
  });
});



app.post("/addCustomer", (req, res) => {
  const { name, service, kilo, price, email } = req.body;
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedService = typeof service === "string" ? service.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const numericKilo = Number(kilo);
  const numericPrice = Number(price);

  if (
    !trimmedName || trimmedName.length > 100 ||
    !trimmedService || trimmedService.length > 80 ||
    !trimmedEmail || trimmedEmail.length > 30 ||
    !Number.isFinite(numericKilo) || numericKilo <= 0 || numericKilo > 100 ||
    !Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 100000
  ) {
    return res.status(400).json({ message: "Enter a valid name, service, contact, weight, and price." });
  }

  const sql = `
    INSERT INTO customers 
    (name, email, service, price, kilo, created_at, status)
    VALUES (?, ?, ?, ?, ?, NOW(), 'Pending')
  `;

  db.query(sql, [trimmedName, trimmedEmail, trimmedService, numericPrice, numericKilo], (err, result) => {
    if (err) {
      console.error("Customer insert failed:", err.message);
      return res.status(500).json({ message: "Could not add the customer order." });
    }
    res.status(201).json({ message: "Customer added", id: result.insertId });
  });
});

app.put("/updateStatus/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["Pending", "Ready to pick up", "Completed"];
  if (!/^\d+$/.test(id) || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Enter a valid customer ID and order status." });
  }

  const sql = "UPDATE customers SET status = ? WHERE id = ?";

  db.query(sql, [status, Number(id)], (err, result) => {
    if (err) {
      console.error("Customer status update failed:", err.message);
      return res.status(500).json({ message: "Could not update the order status." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ message: "Status updated" });
  });
});

app.delete("/deleteCustomer/:id", (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: "Enter a valid customer ID." });
  }

  const sql = "DELETE FROM customers WHERE id = ?";

  db.query(sql, [Number(id)], (err, result) => {
    if (err) {
      console.error("Customer delete failed:", err.message);
      return res.status(500).json({ message: "Could not delete the customer order." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted" });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});