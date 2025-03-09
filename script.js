    document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("form-container");
    const tableContainer = document.getElementById("table-container");
    const navLinks = document.querySelectorAll(".nav-links a");

    // Default to showing the form page
    formContainer.style.display = "block";
    tableContainer.style.display = "none";

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
    link.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent page reload

    if (this.textContent === "Raise Ticket") {
    formContainer.style.display = "block";
    tableContainer.style.display = "none";
} else if (this.textContent === "Tickets List") {
    formContainer.style.display = "none";
    tableContainer.style.display = "block";
}

    // Remove active class from all links and add to the clicked one
    navLinks.forEach(nav => nav.classList.remove("active"));
    this.classList.add("active");
});
});
});

