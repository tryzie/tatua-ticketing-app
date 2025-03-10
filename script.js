document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("form-container");
    const tableContainer = document.getElementById("table-container");
    const navLinks = document.querySelectorAll(".nav-links a");
    const form = document.getElementById("ticket-form");
    const tableBody = document.getElementById("table-body");
    const refreshBtn = document.getElementById("refresh-btn");

    let submissions = [];

    // Navigation Handling
    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            if (this.textContent.trim() === "Raise Ticket") {
                formContainer.style.display = "block";
                tableContainer.style.display = "none";
            } else if (this.textContent.trim() === "Tickets List") {
                formContainer.style.display = "none";
                tableContainer.style.display = "block";
                renderTable();
            }

            // Update active class
            navLinks.forEach(nav => nav.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Handle Form Submission
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const fullName = document.getElementById("full-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();
        const contactMethod = document.querySelector("input[name='contact-method']:checked")?.value;
        const dateCreated = new Date().toISOString().split("T")[0];
        const ticketId = submissions.length + 1;
        const attachment = document.getElementById("attachment").files[0] || null;

        if (!fullName || !email || !phone || !subject || !message || !contactMethod) {
            alert("All fields are required.");
            return;
        }

        const entry = { ticketId, fullName, email, phone, subject, message, contactMethod, dateCreated, attachment };
        submissions.push(entry);
        renderTable();
        form.reset();
    });

    // Render Table Function
    function renderTable() {
        tableBody.innerHTML = "";
        if (submissions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">No tickets available.</td></tr>`;
            return;
        }

        submissions.forEach((entry, index) => {
            const row = `<tr>
            <td>${entry.ticketId}</td>
            <td>${entry.fullName}<br><small>${entry.email} | ${entry.phone}</small></td>
            <td>${entry.subject}<br><small>${entry.message}</small></td>
            <td>${entry.dateCreated}</td>
            <td>
                <button onclick="showInfo(${index})">ℹ</button>
                <button onclick="downloadAttachment(${index})">📥</button>
                ${entry.contactMethod === "phone" ? `<button onclick="triggerCall('${entry.phone}')">📞</button>` : ""}
                ${entry.contactMethod === "email" ? `<button onclick="sendEmail('${entry.email}')">✉</button>` : ""}
                <button onclick="editEntry(${index})">✎</button>
                <button onclick="deleteEntry(${index})">🗑</button>
            </td>
        </tr>`;
            tableBody.innerHTML += row;
        });
    }

    // Refresh Button
    refreshBtn.addEventListener("click", function () {
        renderTable();
    });

    // Show More Info
    window.showInfo = function (index) {
        const entry = submissions[index];
        alert(`Ticket ID: ${entry.ticketId}\nName: ${entry.fullName}\nEmail: ${entry.email}\nPhone: ${entry.phone}\nSubject: ${entry.subject}\nMessage: ${entry.message}`);
    };

    // Download Attachment
    window.downloadAttachment = function (index) {
        const entry = submissions[index];
        if (entry.attachment) {
            const url = URL.createObjectURL(entry.attachment);
            const a = document.createElement("a");
            a.href = url;
            a.download = entry.attachment.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert("No attachment available.");
        }
    };

    // Trigger Call
    window.triggerCall = function (phone) {
        window.location.href = `tel:${phone}`;
    };

    // Send Email
    window.sendEmail = function (email) {
        window.location.href = `mailto:${email}`;
    };

    // Edit Entry in a Popup
    window.editEntry = function (index) {
        const entry = submissions[index];
        const newName = prompt("Edit Full Name:", entry.fullName);
        const newEmail = prompt("Edit Email:", entry.email);
        const newPhone = prompt("Edit Phone:", entry.phone);
        const newSubject = prompt("Edit Subject:", entry.subject);
        const newMessage = prompt("Edit Message:", entry.message);

        if (newName && newEmail && newPhone && newSubject && newMessage) {
            submissions[index] = { ...entry, fullName: newName, email: newEmail, phone: newPhone, subject: newSubject, message: newMessage };
            renderTable();
        } else {
            alert("Editing canceled.");
        }
    };

    // Delete Entry
    window.deleteEntry = function (index) {
        if (confirm("Are you sure you want to delete this entry?")) {
            submissions.splice(index, 1);
            renderTable();
        }
    };
});




document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("ticket-form");

    // Load saved form data from sessionStorage
    function loadFormData() {
        const savedData = sessionStorage.getItem("ticketFormData");
        if (savedData) {
            const formData = JSON.parse(savedData);
            Object.keys(formData).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = formData[key];
                }
            });
        }
    }

    // Save form data to sessionStorage
    function saveFormData() {
        const formData = {
            "full-name": document.getElementById("full-name").value,
            "email": document.getElementById("email").value,
            "phone": document.getElementById("phone").value,
            "subject": document.getElementById("subject").value,
            "message": document.getElementById("message").value
        };
        sessionStorage.setItem("ticketFormData", JSON.stringify(formData));
    }

    // Attach event listeners to save data on input changes
    form.querySelectorAll("input, textarea, select").forEach(input => {
        input.addEventListener("input", saveFormData);
    });

    // Clear sessionStorage on successful form submission
    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent actual form submission
        sessionStorage.removeItem("ticketFormData");
        form.reset();
        alert("Form submitted successfully!");
    });

    loadFormData(); // Load data when page loads
});