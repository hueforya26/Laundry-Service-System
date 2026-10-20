document.addEventListener("DOMContentLoaded", () => {
  const API_URL = (window.LAUNDRY_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const openButton = document.querySelector(".jsCustomerBtn");
  const overlay = document.getElementById("containerModal");
  const closeButton = document.querySelector(".closeBtn");
  const tableBody = document.querySelector("#customerTable tbody");
  const emptyState = document.getElementById("queueEmpty");
  const notice = document.getElementById("queueNotice");
  const table = document.querySelector(".rounded-table");
  const refreshButton = document.getElementById("queueRefresh");

  function setModalOpen(open) {
    overlay.classList.toggle("offShadow", !open);
    document.querySelector(".containerModal").classList.toggle("offContainer", !open);
    openButton.setAttribute("aria-expanded", String(open));
    if (open) document.querySelector("#customerName").focus();
  }

  openButton.addEventListener("click", () => setModalOpen(true));
  closeButton.addEventListener("click", () => setModalOpen(false));
  overlay.addEventListener("click", event => {
    if (event.target === overlay) setModalOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.classList.contains("offShadow")) setModalOpen(false);
  });

  function addTextCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }

  async function loadQueue() {
    refreshButton.disabled = true;
    notice.hidden = true;
    try {
      const response = await fetch(`${API_URL}/customers`);
      const customers = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(customers.message || "Could not load today's orders.");
      if (!Array.isArray(customers)) throw new Error("The service returned an invalid order list.");

      tableBody.replaceChildren();
      customers.forEach(customer => {
        const row = document.createElement("tr");
        addTextCell(row, customer.name || "Unnamed customer");
        addTextCell(row, customer.email || "—");
        const priceCell = addTextCell(row, "");
        const price = Number(customer.price);
        priceCell.textContent = Number.isFinite(price)
          ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price)
          : "—";
        const statusCell = addTextCell(row, "");
        const status = document.createElement("span");
        status.className = `status ${String(customer.status || "pending").toLowerCase().replace(/\s+/g, "-")}`;
        status.textContent = customer.status || "Pending";
        statusCell.appendChild(status);
        tableBody.appendChild(row);
      });
      emptyState.hidden = customers.length > 0;
      table.hidden = customers.length === 0;
    } catch (error) {
      notice.textContent = error.message;
      notice.hidden = false;
    } finally {
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener("click", loadQueue);
  loadQueue();
  window.setInterval(() => {
    if (document.visibilityState === "visible") loadQueue();
  }, 30000);
});
