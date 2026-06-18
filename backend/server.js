const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.get("/customers", (req, res) => {
  const sql = `
    SELECT *
    FROM customers
    WHERE DATE(created_at) = CURDATE()
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    res.json(results);
  });
});



app.post("/addCustomer", (req, res) => {
  const { name, service, kilo, price, email } = req.body;

  console.log("📦 Received:", { name, service, kilo, price, email }); // ADD THIS

  if (!name || !service || !kilo || !price || !email) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = `
    INSERT INTO customers 
    (name, email, service, price, kilo, created_at, status)
    VALUES (?, ?, ?, ?, ?, NOW(), 'Pending')
  `;

  db.query(sql, [name, email, service, price, kilo], (err, result) => {
    if (err) {
      console.error("❌ Insert error:", err); // THIS WILL SHOW THE REAL ERROR
      return res.status(500).json({ message: "Insert failed", error: err.message });
    }
    console.log("✅ Insert successful:", result);
    res.json({ message: "Customer added", id: result.insertId });
  });
});

app.put("/updateStatus/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = "UPDATE customers SET status = ? WHERE id = ?";

  db.query(sql, [status, id], err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Update failed" });
    }
    res.json({ message: "Status updated" });
  });
});

app.delete("/deleteCustomer/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM customers WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted" });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
