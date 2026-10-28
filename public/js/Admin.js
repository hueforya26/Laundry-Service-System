document.addEventListener("DOMContentLoaded", () => {
  const adminPassword = "admin123";
  const loginScreen = document.getElementById("adminLogin");
  const loginForm = document.getElementById("adminLoginForm");
  const loginInput = document.getElementById("adminPassword");
  const loginMessage = document.getElementById("adminLoginMessage");
  const dashboard = document.getElementById("adminDashboard");
  const logoutButton = document.getElementById("adminLogout");
  const API_URL = (window.LAUNDRY_API_URL || "https://laundrybackend-production-3c03.up.railway.app").replace(/\/$/, "");
  const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  });
  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric"
  });
  const customersBody = document.getElementById("recentOrdersBody");
  const refreshButton = document.getElementById("refreshDashboard");
  const notice = document.getElementById("adminNotice");
  let customers = [];
  let salesChart = null;
  let isLoading = false;

  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function parseOrderDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value !== "string" || !value.trim()) return null;

    const sqlDate = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (sqlDate) {
      const [, year, month, day, hour = "0", minute = "0", second = "0"] = sqlDate;
      const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function amount(value) {
    const numeric = Number(value);
    return currency.format(Number.isFinite(numeric) ? numeric : 0);
  }

  function orderPrice(customer) {
    const price = Number(customer.price);
    return Number.isFinite(price) && price > 0 ? price : 0;
  }

  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, options);
    } catch (error) {
      throw new Error("Could not reach the laundry service. Check your connection and try again.");
    }

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result && result.message ? result.message : `The request failed (${response.status}).`);
    }
    return result;
  }

  function setNotice(message, isSuccess = false) {
    notice.textContent = message;
    notice.hidden = !message;
    notice.classList.toggle("is-success", isSuccess);
  }

  function unlockDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    loadDashboard();
  }

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    if (loginInput.value !== adminPassword) {
      loginMessage.textContent = "Incorrect password. Please try again.";
      loginInput.focus();
      loginInput.select();
      return;
    }
    loginMessage.textContent = "";
    loginInput.value = "";
    unlockDashboard();
  });

  logoutButton.addEventListener("click", () => {
    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }
    customers = [];
    dashboard.hidden = true;
    loginScreen.hidden = false;
    loginInput.value = "";
    loginMessage.textContent = "";
    loginInput.focus();
  });

  function dateRangeLabel(start, end) {
    const first = dateFormatter.format(start);
    const last = dateFormatter.format(end);
    return `${first}–${last}`;
  }

  function getDateWindows() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentStart = new Date(today);
    currentStart.setDate(currentStart.getDate() - 6);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    return { today, currentStart, previousStart };
  }

  function isBetween(date, start, endExclusive) {
    return date >= start && date < endExclusive;
  }

  function getSales(start, endExclusive) {
    return customers.reduce((result, customer) => {
      const date = parseOrderDate(customer.created_at);
      if (!date || !isBetween(date, start, endExclusive)) return result;
      result.total += orderPrice(customer);
      result.orders += 1;
      return result;
    }, { total: 0, orders: 0 });
  }

  function updateComparison() {
    const { today, currentStart, previousStart } = getDateWindows();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const current = getSales(currentStart, tomorrow);
    const previous = getSales(previousStart, currentStart);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);

    document.getElementById("currentPeriodLabel").textContent = `Last 7 days · ${dateRangeLabel(currentStart, today)}`;
    document.getElementById("previousPeriodLabel").textContent = `Previous 7 days · ${dateRangeLabel(previousStart, previousEnd)}`;
    document.getElementById("currentPeriodSales").textContent = amount(current.total);
    document.getElementById("previousPeriodSales").textContent = amount(previous.total);
    document.getElementById("currentPeriodOrders").textContent = `${current.orders} ${current.orders === 1 ? "order" : "orders"}`;
    document.getElementById("previousPeriodOrders").textContent = `${previous.orders} ${previous.orders === 1 ? "order" : "orders"}`;

    const largest = Math.max(current.total, previous.total);
    document.getElementById("currentPeriodBar").style.width = largest ? `${(current.total / largest) * 100}%` : "0%";
    document.getElementById("previousPeriodBar").style.width = largest ? `${(previous.total / largest) * 100}%` : "0%";

    const comparison = document.querySelector(".comparison-change");
    const changeIcon = document.getElementById("salesChangeIcon");
    const change = document.getElementById("salesChange");
    comparison.classList.remove("is-up", "is-down");
    if (previous.total === 0) {
      changeIcon.textContent = current.total > 0 ? "↑" : "—";
      change.textContent = current.total > 0 ? "New sales" : "No sales";
    } else {
      const percentage = ((current.total - previous.total) / previous.total) * 100;
      const roundedPercentage = Math.round(Math.abs(percentage));
      if (percentage > 0) {
        comparison.classList.add("is-up");
        changeIcon.textContent = "↑";
        change.textContent = `${roundedPercentage}% higher`;
      } else if (percentage < 0) {
        comparison.classList.add("is-down");
        changeIcon.textContent = "↓";
        change.textContent = `${roundedPercentage}% lower`;
      } else {
        changeIcon.textContent = "→";
        change.textContent = "No change";
      }
    }
  }

  function renderRecentOrders() {
    const recentOrders = [...customers]
      .sort((a, b) => (parseOrderDate(b.created_at)?.getTime() || 0) - (parseOrderDate(a.created_at)?.getTime() || 0))
      .slice(0, 8);
    const empty = document.getElementById("recentOrdersEmpty");
    const table = document.querySelector(".admin-recent-table");
    customersBody.replaceChildren();
    empty.hidden = recentOrders.length > 0;
    table.hidden = recentOrders.length === 0;

    recentOrders.forEach(customer => {
      const row = document.createElement("tr");
      const date = parseOrderDate(customer.created_at);
      const nameCell = document.createElement("td");
      nameCell.textContent = customer.name || "Unnamed customer";
      const serviceCell = document.createElement("td");
      serviceCell.textContent = customer.service || "—";
      const dateCell = document.createElement("td");
      dateCell.textContent = date ? dateFormatter.format(date) : "—";
      const priceCell = document.createElement("td");
      priceCell.textContent = amount(orderPrice(customer));
      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn-delete";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete order for ${customer.name || "customer"}`);
      deleteButton.addEventListener("click", async () => {
        if (!window.confirm(`Delete the order for ${customer.name || "this customer"}? This cannot be undone.`)) return;
        deleteButton.disabled = true;
        try {
          await apiRequest(`/deleteCustomer/${encodeURIComponent(customer.id)}`, { method: "DELETE" });
          customers = customers.filter(item => String(item.id) !== String(customer.id));
          renderDashboard();
          setNotice("Customer order deleted.", true);
        } catch (error) {
          deleteButton.disabled = false;
          setNotice(error.message);
        }
      });
      actionCell.appendChild(deleteButton);
      row.append(nameCell, serviceCell, dateCell, priceCell, actionCell);
      customersBody.appendChild(row);
    });
  }

  function renderSalesChart() {
    const canvas = document.getElementById("salesChart");
    const unavailable = document.getElementById("chartUnavailable");
    if (typeof Chart === "undefined") {
      canvas.hidden = true;
      unavailable.hidden = false;
      return;
    }

    canvas.hidden = false;
    unavailable.hidden = true;
    const now = new Date();
    const monthSlots = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(date),
        total: 0
      };
    });
    const totals = new Map(monthSlots.map(slot => [slot.key, 0]));
    customers.forEach(customer => {
      const date = parseOrderDate(customer.created_at);
      if (!date) return;
      const key = localDateKey(date).slice(0, 7);
      if (totals.has(key)) totals.set(key, totals.get(key) + orderPrice(customer));
    });
    monthSlots.forEach(slot => { slot.total = totals.get(slot.key); });

    if (salesChart) salesChart.destroy();
    const isDark = document.documentElement.dataset.theme === "dark";
    salesChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: monthSlots.map(slot => slot.label),
        datasets: [{
          label: "Recorded sales",
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

  function renderDashboard() {
    updateComparison();
    renderRecentOrders();
    renderSalesChart();
  }

  async function loadDashboard() {
    if (isLoading) return;
    isLoading = true;
    refreshButton.disabled = true;
    refreshButton.setAttribute("aria-busy", "true");
    try {
      const data = await apiRequest("/customers?scope=all");
      if (!Array.isArray(data)) throw new Error("The service returned an invalid customer list.");
      customers = data;
      renderDashboard();
      const updatedAt = new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date());
      document.getElementById("lastUpdated").textContent = `Updated at ${updatedAt} · ${customers.length} total orders`;
      setNotice("");
    } catch (error) {
      setNotice(error.message);
      document.getElementById("lastUpdated").textContent = "Dashboard data could not be refreshed.";
    } finally {
      isLoading = false;
      refreshButton.disabled = false;
      refreshButton.removeAttribute("aria-busy");
    }
  }

  document.querySelectorAll(".nav-link[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      const showSales = button.dataset.view === "sales";
      document.getElementById("overviewView").hidden = showSales;
      document.getElementById("salesView").hidden = !showSales;
      document.querySelectorAll(".nav-link[data-view]").forEach(link => {
        const active = link === button;
        link.classList.toggle("is-active", active);
        link.setAttribute("aria-current", active ? "page" : "false");
      });
      if (showSales && customers.length) renderSalesChart();
    });
  });

  refreshButton.addEventListener("click", loadDashboard);
  document.addEventListener("themechange", () => {
    if (customers.length) renderSalesChart();
  });

  window.setInterval(() => {
    if (document.visibilityState === "visible" && !dashboard.hidden) loadDashboard();
  }, 30000);
});
