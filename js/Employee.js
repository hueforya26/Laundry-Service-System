document.addEventListener("DOMContentLoaded", () => {
  const API_URL = (window.LAUNDRY_API_URL || "http://localhost:3000").replace(/\/$/, "");
  const modal = document.getElementById("ModalOverlay");
  const form = document.getElementById("customerForm");
  const tableBody = document.querySelector("#customerTable tbody");
  const searchInput = document.getElementById("searchInput");
  const recordsView = document.getElementById("recordsView");
  const salesView = document.getElementById("salesView");
  const notice = document.getElementById("notice");
  const emptyState = document.getElementById("emptyState");
  const recordCount = document.getElementById("recordCount");
  const formError = document.getElementById("formError");
  const saveButton = document.getElementById("saveBtn");
  const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 });
  let customers = [];
  let salesChart = null;
  let noticeTimer;

  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en-PH", {
    weekday: "long", month: "long", day: "numeric"
  }).format(new Date());

  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(options.headers || {})
        }
      });
    } catch (error) {
      throw new Error("Could not reach the laundry service. Check your connection and try again.");
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `The request failed (${response.status}).`);
    }
    return result;
  }

  function showNotice(message, isSuccess = false) {
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.toggle("is-success", isSuccess);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 5000);
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function amount(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? currency.format(numericValue) : currency.format(0);
  }

  function addCell(row, content, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    if (content instanceof Node) cell.appendChild(content);
    else cell.textContent = content;
    row.appendChild(cell);
    return cell;
  }

  function renderCustomers() {
    const filter = searchInput.value.trim().toLocaleLowerCase();
    const filteredCustomers = customers.filter(customer => [
      customer.name, customer.service, customer.kilo, customer.price, customer.email, customer.status
    ].some(value => String(value ?? "").toLocaleLowerCase().includes(filter)));

    tableBody.replaceChildren();
    filteredCustomers.forEach(customer => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const name = document.createElement("span");
      name.className = "customer-name";
      name.textContent = customer.name || "Unnamed customer";
      nameCell.appendChild(name);
      if (customer.created_at) {
        const date = document.createElement("span");
        date.className = "customer-secondary";
        const created = new Date(customer.created_at);
        date.textContent = Number.isNaN(created.getTime())
          ? ""
          : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(created);
        if (date.textContent) nameCell.appendChild(date);
      }
      row.appendChild(nameCell);

      addCell(row, customer.service || "—");
      addCell(row, `${customer.kilo ?? "—"} kg`);
      addCell(row, amount(customer.price));
      addCell(row, customer.email || "—");

      const statusCell = addCell(row, "", "status-cell");
      const statusSelect = document.createElement("select");
      statusSelect.className = "status-badge";
      statusSelect.setAttribute("aria-label", `Order status for ${customer.name || "customer"}`);
      const statuses = ["Pending", "Ready to pick up", "Completed"];
      statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
      });
      statusSelect.value = statuses.includes(customer.status) ? customer.status : "Pending";
      setStatusClass(statusSelect);
      statusSelect.addEventListener("change", async () => {
        const previousStatus = customer.status || "Pending";
        statusSelect.disabled = true;
        try {
          await apiRequest(`/updateStatus/${encodeURIComponent(customer.id)}`, {
            method: "PUT",
            body: JSON.stringify({ status: statusSelect.value })
          });
          customer.status = statusSelect.value;
          setStatusClass(statusSelect);
          updateSummary();
          showNotice(`Order status updated to ${customer.status}.`, true);
        } catch (error) {
          statusSelect.value = previousStatus;
          setStatusClass(statusSelect);
          showNotice(error.message);
        } finally {
          statusSelect.disabled = false;
        }
      });
      statusCell.appendChild(statusSelect);

      const actionCell = addCell(row, "");
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-delete";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete order for ${customer.name || "customer"}`);
      deleteButton.addEventListener("click", async () => {
        if (!window.confirm(`Delete the order for ${customer.name || "this customer"}?`)) return;
        deleteButton.disabled = true;
        try {
          await apiRequest(`/deleteCustomer/${encodeURIComponent(customer.id)}`, { method: "DELETE" });
          customers = customers.filter(item => item.id !== customer.id);
          updateSummary();
          renderCustomers();
          showNotice("Customer order deleted.", true);
        } catch (error) {
          deleteButton.disabled = false;
          showNotice(error.message);
        }
      });
      actionCell.appendChild(deleteButton);
      tableBody.appendChild(row);
    });

    recordCount.textContent = filter
      ? `${filteredCustomers.length} of ${customers.length} orders`
      : `${customers.length} ${customers.length === 1 ? "order" : "orders"}`;
    emptyState.hidden = filteredCustomers.length > 0;
    document.querySelector(".table-scroll").hidden = filteredCustomers.length === 0;
    if (filteredCustomers.length === 0 && filter) {
      emptyState.querySelector("h3").textContent = "No matching orders";
      emptyState.querySelector("p").textContent = "Try searching with a different name, service, or contact.";
      document.getElementById("emptyAddBtn").hidden = true;
    } else {
      emptyState.querySelector("h3").textContent = "No orders found";
      emptyState.querySelector("p").textContent = "Try a different search or add your first customer order.";
      document.getElementById("emptyAddBtn").hidden = false;
    }
  }

  function setStatusClass(select) {
    select.classList.remove("status-pending", "status-ready", "status-completed");
    const statusClass = select.value === "Ready to pick up"
      ? "status-ready"
      : select.value === "Completed" ? "status-completed" : "status-pending";
    select.classList.add(statusClass);
  }

  function updateSummary() {
    const today = localDateKey();
    const thisMonth = today.slice(0, 7);
    const todayCustomers = customers.filter(customer => String(customer.created_at || "").slice(0, 10) === today);
    const pending = customers.filter(customer => !customer.status || customer.status === "Pending").length;
    const ready = customers.filter(customer => customer.status === "Ready to pick up").length;
    const monthSales = customers.reduce((total, customer) => (
      String(customer.created_at || "").slice(0, 7) === thisMonth ? total + (Number(customer.price) || 0) : total
    ), 0);

    document.getElementById("ordersToday").textContent = String(todayCustomers.length);
    document.getElementById("ordersPending").textContent = String(pending);
    document.getElementById("ordersReady").textContent = String(ready);
    document.getElementById("salesThisMonth").textContent = amount(monthSales);
    document.getElementById("salesSummaryTotal").textContent = amount(monthSales);
    document.getElementById("salesSummaryCaption").textContent = `${todayCustomers.length} orders recorded today · ${customers.length} orders in the records`;
  }

  function renderSalesChart() {
    const canvas = document.getElementById("salesChart");
    const isDark = document.documentElement.dataset.theme === "dark";
    if (typeof Chart === "undefined") {
      showNotice("The sales chart library could not be loaded. Check your connection and refresh.");
      return;
    }

    const now = new Date();
    const monthSlots = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(date),
        total: 0
      };
    });
    const totalsByMonth = new Map(monthSlots.map(slot => [slot.key, 0]));
    customers.forEach(customer => {
      const key = String(customer.created_at || "").slice(0, 7);
      if (totalsByMonth.has(key)) totalsByMonth.set(key, totalsByMonth.get(key) + (Number(customer.price) || 0));
    });
    monthSlots.forEach(slot => { slot.total = totalsByMonth.get(slot.key); });

    if (salesChart) salesChart.destroy();
    salesChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: monthSlots.map(slot => slot.label),
        datasets: [{
          label: "Sales",
          data: monthSlots.map(slot => slot.total),
          backgroundColor: monthSlots.map((_, index) => index === 11 ? "rgba(110, 82, 181, .86)" : "rgba(166, 148, 213, .48)"),
          borderColor: monthSlots.map((_, index) => index === 11 ? "#6e52b5" : "#a694d5"),
          borderWidth: 1,
          borderRadius: 7,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: context => ` ${amount(context.parsed.y)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? "#aaa4bd" : "#858195", maxRotation: 0, autoSkip: true } },
          y: {
            beginAtZero: true,
            grid: { color: isDark ? "rgba(255,255,255,.08)" : "#f0eef4" },
            ticks: { color: isDark ? "#aaa4bd" : "#858195", callback: value => `₱${Number(value).toLocaleString("en-PH")}` }
          }
        }
      }
    });
  }

  async function loadCustomers(showError = true) {
    const refreshButtons = [document.getElementById("refreshBtn"), document.getElementById("salesRefreshBtn")];
    refreshButtons.forEach(button => { button.disabled = true; });
    try {
      const data = await apiRequest("/customers?scope=all");
      if (!Array.isArray(data)) throw new Error("The service returned an invalid customer list.");
      customers = data;
      renderCustomers();
      updateSummary();
      renderSalesChart();
    } catch (error) {
      if (showError) showNotice(error.message);
      recordCount.textContent = "Could not load orders";
    } finally {
      refreshButtons.forEach(button => { button.disabled = false; });
    }
  }

  function openModal() {
    form.reset();
    formError.hidden = true;
    modal.hidden = false;
    document.getElementById("name").focus();
  }

  function closeModal() {
    modal.hidden = true;
    formError.hidden = true;
  }

  document.getElementById("openModal").addEventListener("click", openModal);
  document.getElementById("emptyAddBtn").addEventListener("click", openModal);
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("refreshBtn").addEventListener("click", () => loadCustomers());
  document.getElementById("salesRefreshBtn").addEventListener("click", () => loadCustomers());
  searchInput.addEventListener("input", renderCustomers);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  document.querySelectorAll(".nav-link[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      const showSales = button.dataset.view === "sales";
      recordsView.hidden = showSales;
      salesView.hidden = !showSales;
      document.querySelectorAll(".nav-link[data-view]").forEach(link => {
        link.classList.toggle("is-active", link === button);
        link.setAttribute("aria-current", link === button ? "page" : "false");
      });
      document.addEventListener("themechange", () => {
        if (salesChart) renderSalesChart();
      });
      if (showSales && !salesChart) renderSalesChart();
    });
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    formError.hidden = true;
    const weight = Number(document.getElementById("kilo").value);
    const price = Number(document.getElementById("price").value);
    const contact = document.getElementById("number").value.trim();
    if (!Number.isFinite(weight) || weight <= 0 || weight > 100 || !Number.isFinite(price) || price <= 0 || price > 100000) {
      formError.textContent = "Enter a valid weight and price within the allowed range.";
      formError.hidden = false;
      return;
    }
    if (contact.length < 7) {
      formError.textContent = "Enter a valid contact number with at least 7 characters.";
      formError.hidden = false;
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
    try {
      await apiRequest("/addCustomer", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("name").value.trim(),
          service: document.getElementById("service").value,
          kilo: weight,
          price,
          email: contact
        })
      });
      closeModal();
      searchInput.value = "";
      await loadCustomers(false);
      showNotice("Customer order added successfully.", true);
    } catch (error) {
      formError.textContent = error.message;
      formError.hidden = false;
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save customer";
    }
  });

  loadCustomers();
  window.setInterval(() => {
    if (document.visibilityState === "visible" && modal.hidden) loadCustomers(false);
  }, 30000);
});
