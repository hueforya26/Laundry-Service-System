document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("ModalOverlay");
  const openBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeModal");
  const saveBtn = document.getElementById("saveBtn");
  const tableBody = document.querySelector("#customerTable tbody");

  const nameInput = document.getElementById("name");
  const serviceInput = document.getElementById("service");
  const kiloInput = document.getElementById("kilo");
  const priceInput = document.getElementById("price");
  const gmailInput = document.getElementById("gmail");

  let currentSearch = "";

  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value.toLowerCase();
    applySearch();
    clearBtn.style.display = currentSearch ? "block" : "none";
  });



  openBtn.onclick = () => {
    clearInputs();
    modal.style.display = "flex";
  };

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  function clearInputs() {
    nameInput.value = "";
    serviceInput.value = "";
    kiloInput.value = "";
    priceInput.value = "";
    gmailInput.value = "";
  }

  saveBtn.onclick = () => {
    if (!nameInput.value || !serviceInput.value || !kiloInput.value || !priceInput.value || !gmailInput.value) {
      alert("Please fill all fields");
      return;
    }

    fetch("http://localhost:3000/addCustomer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value,
        service: serviceInput.value,
        kilo: kiloInput.value,
        price: priceInput.value,
        email: gmailInput.value
      })
    })
    .then(() => {
      modal.style.display = "none";
      clearInputs();
      loadCustomers();
    })
    .catch(err => console.error("Save error:", err));
  };

  function loadCustomers() {
    fetch("http://localhost:3000/customers")
      .then(res => res.json())
      .then(data => {
        tableBody.innerHTML = "";

        data.forEach(c => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.service}</td>
            <td>${c.kilo}</td>
            <td>₱ ${c.price}</td>
            <td>${c.email}</td>
            <td>
              <select class="status-select">
                <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                <option value="Ready to pick up" ${c.status === "Ready to pick up" ? "selected" : ""}>Ready to pick up</option>
                <option value="Completed" ${c.status === "Completed" ? "selected" : ""}>Completed</option>
              </select>
            </td>
            <td>
              <button class="btn-delete">Delete</button>
            </td>
          `;

          row.querySelector(".status-select").onchange = () => {
            updateStatus(c.id, row.querySelector(".status-select").value);
          };

          row.querySelector(".btn-delete").onclick = () => {
            if (!confirm("Are you sure you want to delete this record?")) return;

            fetch(`http://localhost:3000/deleteCustomer/${c.id}`, {
              method: "DELETE"
            })
            .then(res => res.json())
            .then(() => loadCustomers())
            .catch(err => console.error("Delete error:", err));
          };

          tableBody.appendChild(row);

          applySearch();
        });
      });
  }

  function applySearch() {
    const rows = tableBody.querySelectorAll("tr");
    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(currentSearch)
        ? ""
        : "none";
    });
  }


  function updateStatus(id, status) {
    fetch(`http://localhost:3000/updateStatus/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    .then(() => loadCustomers());
  }

  loadCustomers();
});
