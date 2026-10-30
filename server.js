const express = require("express");
const { Pool, types } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

types.setTypeParser(1700, (value) => Number.parseFloat(value));

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
      err.message || ""
    )
  );

app.get("/customers", async (req, res) => {
  const conditions =
    req.query.scope === "all"
      ? ""
      : "WHERE o.created_at::date = CURRENT_DATE";

  const sql = `
    SELECT
      o.id AS id,
      c.id AS customer_id,
      c.name,
      c.phone,
      c.email,
      o.service,
      o.kilo,
      o.price,
      o.created_at,
      COALESCE(o.order_status, o.status, 'Pending') AS status
    FROM public.orders AS o
    JOIN public.customers AS c
      ON c.id = o.customer_id
    ${conditions}
    ORDER BY o.id DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(
      "Customer/order list query failed:",
      err.code || "",
      err.message
    );

    res.status(500).json({
      message: "Could not load customer orders.",
    });
  }
});

app.post("/addCustomer", async (req, res) => {
  const { name, service, kilo, price } = req.body;

  const rawContact = [req.body.contact, req.body.phone, req.body.email].find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  const contact = rawContact ? rawContact.trim() : "";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const phoneDigits = contact.replace(/\D/g, "");
  const isPhone =
    /^[+\d\s\-()]+$/.test(contact) &&
    phoneDigits.length >= 7 &&
    phoneDigits.length <= 15;

  const trimmedName =
    typeof name === "string" ? name.trim() : "";

  const trimmedService =
    typeof service === "string" ? service.trim() : "";

  const numericKilo = Number(kilo);
  const numericPrice = Number(price);

  if (
    !trimmedName ||
    trimmedName.length > 100 ||
    !trimmedService ||
    trimmedService.length > 80 ||
    !contact ||
    contact.length > 100 ||
    (!isEmail && !isPhone) ||
    !Number.isFinite(numericKilo) ||
    numericKilo <= 0 ||
    numericKilo > 100 ||
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0 ||
    numericPrice > 100000
  ) {
    return res.status(400).json({
      message:
        "Enter a valid name, service, phone number or email, weight, and price.",
    });
  }

  let client;

  try {
    client = await db.connect();

    await client.query("BEGIN");

    const customerResult = await client.query(
      `INSERT INTO public.customers
         (name, phone, email, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [
        trimmedName,
        isEmail ? null : contact,
        isEmail ? contact.toLowerCase() : null,
      ]
    );

    const customerId = customerResult.rows[0].id;

    const orderResult = await client.query(
      `INSERT INTO public.orders
         (customer_id, service, kilo, price,
          order_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'Pending', NOW(), NOW())
       RETURNING id`,
      [
        customerId,
        trimmedService,
        numericKilo,
        numericPrice,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Customer order added",
      id: orderResult.rows[0].id,
      customer_id: customerId,
    });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error(
      "Customer/order insert failed:",
      err.code || "",
      err.message
    );

    res.status(500).json({
      message:
        "Could not add the customer order. Check the backend logs.",
      code: err.code || undefined,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.put("/updateStatus/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Ready to pick up",
    "Completed",
  ];

  if (!/^\d+$/.test(id) || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Enter a valid order ID and order status.",
    });
  }

  try {
    const result = await db.query(
      `UPDATE public.orders
       SET order_status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.json({
      message: "Order status updated",
    });
  } catch (err) {
    console.error(
      "Order status update failed:",
      err.code || "",
      err.message
    );

    res.status(500).json({
      message: "Could not update the order status.",
    });
  }
});

app.delete("/deleteCustomer/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      message: "Enter a valid order ID.",
    });
  }

  try {
    const result = await db.query(
      "DELETE FROM public.orders WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.json({
      message: "Order deleted",
    });
  } catch (err) {
    console.error(
      "Order delete failed:",
      err.code || "",
      err.message
    );

    res.status(500).json({
      message: "Could not delete the order.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});