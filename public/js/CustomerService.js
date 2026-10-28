document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("serviceMessage");
  const submitButton = form.querySelector('[type="submit"]');
  const emailJsPublicKey = "t6MDpS7dkfS8CHno3";
  const emailJsServiceId = "service_ul5j1zt";

  if (typeof emailjs !== "undefined") {
    emailjs.init(emailJsPublicKey);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("is-error");
    if (typeof emailjs === "undefined") {
      message.textContent = "Customer service is temporarily unavailable. Please try again later.";
      message.classList.add("is-error");
      return;
    }

    const values = {
      customer_name: form.elements.namedItem("customerName").value.trim(),
      user_email: form.elements.namedItem("email").value.trim(),
      concern_type: form.elements.namedItem("selectConcern").value,
      message: form.elements.namedItem("message").value.trim()
    };
    const customerName = values.customer_name;
    const email = values.user_email;

    submitButton.disabled = true;
    submitButton.textContent = "Sending request…";
    try {
      await emailjs.send(emailJsServiceId, "template_mvk3297", values);
      try {
        await emailjs.send(emailJsServiceId, "template_24fa3xo", {
          to_name: customerName,
          concern: values.concern_type,
          to_email: email
        });
        message.textContent = "Your request has been sent. A confirmation is on its way.";
      } catch (error) {
        console.error("Customer confirmation email failed:", error);
        message.textContent = "Your request was received, but we could not send the confirmation email.";
      }
      form.reset();
    } catch (error) {
      console.error("Customer service request failed:", error);
      message.textContent = "We couldn't send your request. Please check your connection and try again.";
      message.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit request";
    }
  });
});
