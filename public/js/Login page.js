const users = [
  { username: "jb", password: "1234" },
  { username: "anna", password: "abcd" },
  { username: "mike", password: "pass" }
];

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const message = document.getElementById("message");

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const enteredUsername = document.getElementById("username").value.trim();
    const enteredPassword = document.getElementById("password").value;
    const user = users.find(account => (
      account.username === enteredUsername && account.password === enteredPassword
    ));

    if (user) {
      window.location.assign("Employee.html");
      return;
    }

    message.textContent = "That username and password don't match. Please try again.";
    document.getElementById("password").focus();
  });
});
