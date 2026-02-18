(function () {
  emailjs.init("t6MDpS7dkfS8CHno3");
})();

console.log("emailjs:", emailjs)

const form = document.getElementById("loginForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const customerName = form.customerName.value;
  const email = form.email.value;
  const selectConcern = form.selectConcern.value;
  const message = form.message.value;

  emailjs.send("service_ul5j1zt", "template_mvk3297", {
    customer_name: customerName,
    user_email: email,
    concern_type: selectConcern,
    message: message
  })
  .then(() => {

  return emailjs.send("service_ul5j1zt", "template_24fa3xo", {
      to_name: customerName,
      concern: selectConcern,
      to_email: email
    });

  })
  .then(() => {
    alert("Request sent successfully 📩!");
    form.reset();
  })
  .catch((error) => {
    console.error("EmailJS ERROR:", error);
    alert("Something failed. Check console (F12).");
  });
});
