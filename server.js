const express = require("express");
const { Pool, types } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

types.setTypeParser(1700, (v) => parseFloat(v)); // numeric
types.setTypeParser(20, (v) => parseInt(v, 10)); // bigint

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

console.log("DATABASE_URL set:", Boolean(process.env.DATABASE_URL));

db.query("SELECT 1")
  .then(() => console.log("Connected to the Supabase database"))
  .catch((err) =>
    console.error(
      "Database connection failed:",
      err.code || "",
      err.message || "",
      (err.errors || []).map((e) => e.message).join(" | ")
    )
  );

app.get("/customers", async (req, res) => {
  const includeAll = req.query.scope === "all";
  const sql = includeAll
    ? "SELECT * FROM customers ORDER BY id DESC"
    : "SELECT * FROM customers WHERE created_at::date = CURRENT_DATE ORDER BY id DESC";

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("Customer list query failed:", err.message);
    res.status(500).json({ message: "Could not load customer records." });
  }
});

app.post("/addCustomer", async (req, res) => {
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
    INSERT INTO customers (name, email, service, price, kilo, created_at, status)
    VALUES ($1, $2, $3, $4, $5, NOW(), 'Pending')
    RETURNING id
  `;

  try {
    const result = await db.query(sql, [trimmedName, trimmedEmail, trimmedService, numericPrice, numericKilo]);
    res.status(201).json({ message: "Customer added", id: result.rows[0].id });
  } catch (err) {
    console.error("Customer insert failed:", err.message);
    res.status(500).json({ message: "Could not add the customer order." });
  }
});

app.put("/updateStatus/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["Pending", "Ready to pick up", "Completed"];

  if (!/^\d+$/.test(id) || !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Enter a valid customer ID and order status." });
  }

  try {
    const result = await db.query("UPDATE customers SET status = $1 WHERE id = $2", [status, Number(id)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ message: "Status updated" });
  } catch (err) {
    console.error("Customer status update failed:", err.message);
    res.status(500).json({ message: "Could not update the order status." });
  }
});

app.delete("/deleteCustomer/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ message: "Enter a valid customer ID." });
  }

  try {
    const result = await db.query("DELETE FROM customers WHERE id = $1", [Number(id)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error("Customer delete failed:", err.message);
    res.status(500).json({ message: "Could not delete the customer order." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});