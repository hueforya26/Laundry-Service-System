document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("ModalOverlay");
  const openBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeModal");
  const saveBtn = document.getElementById("saveBtn");
  const tableBody = document.querySelector("#customerTable tbody");
  const statusLegend = document.getElementById("statusLegend");

  const nameInput = document.getElementById("name");
  const serviceInput = document.getElementById("service");
  const kiloInput = document.getElementById("kilo");
  const priceInput = document.getElementById("price");
  const gmailInput = document.getElementById("gmail");

  function clearInputs() {
    nameInput.value = "";
    serviceInput.value = "";
    kiloInput.value = "";
    priceInput.value = "";
    gmailInput.value = "";
  }

  function searchCustomer() {
    const input = document.getElementById("searchInput");
    const filter = input.value.toLowerCase();
    const table = document.getElementById("customerTable");
    const rows = table.getElementsByTagName("tr");
    const clearBtn = document.querySelector(".clear-btn");

    clearBtn.style.display = input.value ? "block" : "none";

    for (let i = 1; i < rows.length; i++) {
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

  function clearSearch() {
    const input = document.getElementById("searchInput");
    input.value = "";
    searchCustomer();
    input.focus();
  }

  // Add event listener for search input
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", searchCustomer);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchCustomer();
    }
  });

  // Add event listener for clear button
  const clearBtn = document.querySelector(".clear-btn");
  clearBtn.addEventListener("click", clearSearch);

  openBtn.onclick = () => {
    clearInputs();
    modal.style.display = "flex";
  };
  closeBtn.onclick = () => {
    clearInputs();
    modal.style.display = "none";
  };



  saveBtn.onclick = () => {

    if (!nameInput.value || !serviceInput.value || !kiloInput.value || !priceInput.value || !gmailInput.value) {
      alert("Please fill all fields");
      return;
    }

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${nameInput.value}</td>
      <td>${serviceInput.value}</td>
      <td>${kiloInput.value}</td>
      <td>₱ ${priceInput.value}</td>
      <td>${gmailInput.value}</td>

      <td>
        <select class="status pending">
          <option value="pending" selected>Pending</option>
          <option value="washing">Washing</option>
          <option value="drying">Drying</option>
          <option value="ready">Ready</option>
          <option value="claimed">Claimed</option>
        </select>
      </td>

      <td>
        <button class="btn-done">✔ Done</button>
        <button class="btn-delete">🗑 Delete</button>
      </td>
    `;

    const status = row.querySelector(".status");
    const doneBtn = row.querySelector(".btn-done");
    const deleteBtn = row.querySelector(".btn-delete");

    status.addEventListener("change", () => {
      status.className = "status " + status.value;
      doneBtn.disabled = (status.value === "claimed");
    });

    doneBtn.onclick = () => {
      status.value = "ready";
      status.className = "status ready";
    };

    deleteBtn.onclick = () => {
      row.remove();
    };

    tableBody.appendChild(row);

    modal.style.display = "none";

    nameInput.value = serviceInput.value =
    kiloInput.value = priceInput.value =
    gmailInput.value = "";
  };

});55