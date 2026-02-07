let users = [
        { username: "jb", password: "1234" },
        { username: "anna", password: "abcd" },
        { username: "mike", password: "pass" }
        ];


  const loginForm = document.getElementById("loginForm");
  const message = document.getElementById("message");

  loginForm.addEventListener("click", function(e) {
  e.preventDefault();

  const enteredUsername = document.getElementById("username").value;
  const enteredPassword = document.getElementById("password").value;

  const user = users.find(
    u => u.username === enteredUsername && u.password === enteredPassword
  );

  if (user) {
    window.location.href = "Employee.html";


  } else {
    message.textContent = "Invalid username or password";
    message.style.color = "red";
  }
});

const closeBtn = document.querySelector(".jsCloseBtn");
closeBtn.addEventListener("click", function() {
     window.location.href = "Customer-page.html";
}); 