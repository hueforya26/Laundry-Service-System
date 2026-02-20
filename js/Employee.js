document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("ModalOverlay");
  const openBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeModal");

  const tableBody = document.querySelector("#customerTable tbody");
  const recordsSection = document.getElementById("CustomerRecord");
  const ctx = document.getElementById("salesChart").getContext("2d");

  const nameInput = document.getElementById("name");
  const serviceInput = document.getElementById("service");
  const kiloInput = document.getElementById("kilo");
  const priceInput = document.getElementById("price");
  const numberInput = document.getElementById("number");

  const searchInput = document.getElementById("searchInput");

  const salesLink = document.getElementById("salesLink");
  const recordsLink = document.getElementById("recordsLink");
  const salesSection = document.getElementById("monthlySales");

  function clearInputs() {
    nameInput.value = "";
    serviceInput.value = "";
    kiloInput.value = "";
    priceInput.value = "";
    numberInput.value = "";
  }

  function searchCustomer() {
    const filter = searchInput.value.toLowerCase();
    const rows = tableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      let found = false;
      for (let j = 0; j < cells.length; j++) {
        const textValue = cells[j].textContent || cells[j].innerText;
        if (textValue.toLowerCase().includes(filter)) {
          found = true;
          break;
        }
      }
      rows[i].style.display = found ? "" : "none";
    }
  }

  openBtn.onclick = () => {
    clearInputs();
    modal.style.display = "flex";
  };

  closeBtn.onclick = () => {
    clearInputs();
    modal.style.display = "none";
  };

  kiloInput.addEventListener('input', () => {
    kiloInput.value = kiloInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    if (parseFloat(kiloInput.value) > 100) kiloInput.value = 100;
  });

  priceInput.addEventListener('input', () => {
    priceInput.value = priceInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    if (parseFloat(priceInput.value) > 100000) priceInput.value = 100000;
  });

  numberInput.addEventListener('input', () => {
    let value = numberInput.value.replace(/\D/g, '');

    if (value.length <= 4) {
      numberInput.value = value;
    } else if (value.length <= 7) {
      numberInput.value = value.replace(/^(\d{4})(\d+)/, '$1-$2');
    } else {
      numberInput.value = value.replace(/^(\d{4})(\d{3})(\d+)/, '$1-$2-$3');
    }
  });

  searchInput.addEventListener("input", searchCustomer);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchCustomer();
  });

  const sampleData = [
    { id: 1, name: "John", service: "Wash", kilo: 5, price: 250, contact: "09736881137", status: "Done", time: "2026-01-10" },
    { id: 2, name: "Evan", service: "Dry Clean", kilo: 3, price: 300, contact: "09229844110", status: "Done", time: "2026-02-15" },
    { id: 3, name: "Zeus", service: "Iron", kilo: 2, price: 150, contact: "09912779934", status: "Done", time: "2026-03-20" },
    { id: 4, name: "Patrick", service: "Wash", kilo: 4, price: 200, contact: "09700437593", status: "Done", time: "2026-02-05" },
    { id: 5, name: "Anna", service: "Wash", kilo: 3, price: 180, contact: "09833473261", status: "Done", time: "2026-07-12" },
    { id: 6, name: "Joy", service: "Iron", kilo: 1, price: 100, contact: "09476199162", status: "Done", time: "2026-07-20" },
    { id: 7, name: "Bruno", service: "Dry Clean", kilo: 2, price: 250, contact: "09389922843", status: "Done", time: "2026-06-18" },
    { id: 8, name: "Cherry", service: "Wash", kilo: 5, price: 300, contact: "09331982335", status: "Done", time: "2026-05-08" }
  ];

  const monthlySales = {};
  sampleData.forEach(order => {
    const date = new Date(order.time);
    const month = date.getMonth();
    monthlySales[month] = (monthlySales[month] || 0) + order.price;
  });

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const salesData = monthLabels.map((_, index) => monthlySales[index] || 0);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [{
        label: "Monthly Sales (₱)",
        data: salesData,
        backgroundColor: salesData.map(val => val > 0 ? "rgba(106, 27, 154, 0.7)" : "rgba(200, 200, 200, 0.3)"),
        borderColor: "rgba(106, 27, 154, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "top" },
        title: { display: true, text: "Monthly Sales" }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: value => "₱" + value } }
      }
    }
  });

  const saveBtn = document.getElementById("saveBtn");

  saveBtn.onclick = (e) => {
    e.preventDefault();
  console.log("🔵 SAVE BUTTON CLICKED - LINE 1"); // ← ADD THIS
  
  if (!nameInput.value || !serviceInput.value || !kiloInput.value || !priceInput.value || !numberInput.value) {
    alert("Please fill all fields");
    return;
  }
  
  console.log("🔵 Validation passed, about to fetch"); // ← ADD THIS

  fetch("https://laundrybackend-production-3c03.up.railway.app/addCustomer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      service: serviceInput.value,
      kilo: kiloInput.value,
      price: priceInput.value,
      email: numberInput.value
    })
  })
  .then(res => {
    console.log("🔵 Fetch response received:", res.status); // ← ADD THIS
    return res.json();
  })
  .then(() => {
    console.log("🔵 Save successful, closing modal"); // ← ADD THIS
    modal.style.display = "none";
    clearInputs();
    loadCustomers();
  })
  .catch(err => {
    console.error("🔴 Fetch error:", err); // ← ADD THIS
  });
};

  function loadCustomers() {
  fetch("https://laundrybackend-production-3c03.up.railway.app/customers")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("📥 Customers data:", data); // DEBUG: see what we get
      
      // SAFETY CHECK: ensure data is an array
      if (!Array.isArray(data)) {
        console.error("❌ Data is not an array:", data);
        tableBody.innerHTML = "<tr><td colspan='7'>Error loading data</td></tr>";
        return;
      }
      
      tableBody.innerHTML = "";
      
      data.forEach(c => {
        // ... rest of your code stays the same
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${c.name}</td>
          <td>${c.service}</td>
          <td>${c.kilo}</td>
          <td>₱ ${c.price}</td>
          <td>${c.email}</td>
          <td>
            <select class="status-select status">
              <option class="status pending" value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
              <option class="status ready" value="Ready to pick up" ${c.status === "Ready to pick up" ? "selected" : ""}>Ready to pick up</option>
              <option class="status claimed" value="Completed" ${c.status === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </td>
          <td>
            <button class="btn-delete">Delete</button>
          </td>
        `;
        
        const statusSelect = row.querySelector(".status-select");
        applyStatusColor(statusSelect);
        
        statusSelect.onchange = () => {
          applyStatusColor(statusSelect);
          updateStatus(c.id, statusSelect.value);
        };
        
        row.querySelector(".btn-delete").onclick = () => {
          if (!confirm("Are you sure you want to delete this record?")) return;
          
          fetch(`https://laundrybackend-production-3c03.up.railway.app/deleteCustomer/${c.id}`, {
            method: "DELETE"
          })
          .then(res => res.json())
          .then(() => loadCustomers())
          .catch(err => console.error("Delete error:", err));
        };
        
        tableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Load customers error:", err);
      tableBody.innerHTML = "<tr><td colspan='7'>Error loading data</td></tr>";
    });
}

  function applyStatusColor(select) {
  select.classList.remove("pending", "ready", "completed");

  if (select.value === "Pending") {
    select.classList.add("pending");
  } else if (select.value === "Ready to pick up") {
    select.classList.add("ready");
  } else if (select.value === "Completed") {
    select.classList.add("completed");
  }
}

  recordsLink.addEventListener("click", (e) => {
    e.preventDefault();
    recordsSection.style.display = "block";
    salesSection.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  salesLink.addEventListener("click", (e) => {
    e.preventDefault();
    salesSection.style.display = "block";
    recordsSection.style.display = "block";

    document.querySelector("#CustomerRecord").style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

    function updateStatus(id, status) {
    fetch(`https://laundrybackend-production-3c03.up.railway.app/updateStatus/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    .then(() => loadCustomers());
  }

  loadCustomers();
    setInterval(() => {
    loadCustomers();
  }, 5000);
});
const modalLogin = document.getElementById("modalLogin");
const openLogin = document.getElementById("salesLink");
const loginBtn = document.querySelector(".login");
const cancelBtn = document.querySelector(".cancel");
const passwordInput = document.getElementById("adminPassword");

function clearloginInputs()  {
  passwordInput.value = "";
}

openLogin.onclick =() => {
  clearloginInputs();
  modalLogin.style.display = "flex";
};

cancelBtn.onclick =()=>{
  clearloginInputs();
  modalLogin.style.display = "none";
};

const pass = "admin123";
loginBtn.addEventListener("click", function(e) {
  e.preventDefault();

  
    if (passwordInput.value === pass) {
      document.getElementById("CustomerRecord").style.display ="none";
      document.getElementById("modalLogin").style.display ="none";
      document.getElementById("monthlySales").style.display="block";
    } else{
      alert("Incorrect Password!");
    }
});