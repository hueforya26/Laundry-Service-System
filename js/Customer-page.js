const jsCustomerBtn = document.querySelector('.jsCustomerBtn');

jsCustomerBtn.addEventListener('click', () => {
    const containerModal = document.querySelector('.containerModal');
    containerModal.classList.remove('offContainer');
    
});
const closeBtn = document.querySelector('.closeBtn');

closeBtn.addEventListener('click', () => {
    const containerModal = document.querySelector('.containerModal');
    containerModal.classList.add('offContainer');
 });



 document.addEventListener("DOMContentLoaded", () => {

  const tableBody = document.querySelector("#customerTable tbody");

  function loadQueue() {
    fetch("http://localhost:3000/customers")
      .then(res => res.json())
      .then(data => {
        tableBody.innerHTML = "";

        if (!data || data.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="4">No customers in queue</td>
            </tr>
          `;
          return;
        }

        data.forEach(c => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>₱ ${c.price}</td>
            <td class="status ${formatStatus(c.status)}">
              ${c.status}
            </td>
          `;

          tableBody.appendChild(row);
        });
      })
      .catch(err => console.error("Queue load error:", err));
  }

  function formatStatus(status) {
    if (!status) return "";
    return status.toLowerCase().replace(/\s/g, "-");
  }

  loadQueue();
  setInterval(loadQueue, 5000);

});


jsCustomerBtn.addEventListener('click', () => {
    const containerModal = document.querySelector('.containerModal');
    const shadowModal = document.querySelector('.containerModalShadow');
    shadowModal.classList.remove('offShadow');
    containerModal.classList.remove('offContainer');
    

});