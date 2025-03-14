//global variables
let sortCriteria = [];
let filterCriteria = [];
let submissions = [];

document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        formContainer: document.getElementById("form-container"),
        tableContainer: document.getElementById("table-container"),
        navLinks: document.querySelectorAll(".nav-links a"),
        form: document.getElementById("ticket-form"),
        tableBody: document.getElementById("table-body"),
        refreshBtn: document.getElementById("refresh-btn"),
        pagination: document.getElementById("pagination"),
        successPopup: document.getElementById("success-popup"),
        sortPopup: document.getElementById("sort-popup"),
        filterPopup: document.getElementById("filter-popup"),
        sortBtn: document.getElementById("sort-btn"),
        filterBtn: document.getElementById("filter-btn"),
        sortFields: document.getElementById("sort-fields"),
        filterFields: document.getElementById("filter-fields"),
        addSortBtn: document.getElementById("add-sort"),
        addFilterBtn: document.getElementById("add-filter"),
        resetSortBtn: document.getElementById("reset-sort"),
        resetFilterBtn: document.getElementById("reset-filter"),
        submitSortBtn: document.getElementById("submit-sort"),
        submitFilterBtn: document.getElementById("submit-filter")
    };


    // Load submissions from localStorage
    submissions = JSON.parse(localStorage.getItem("submissions")) || [];

    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            toggleView(link.textContent);
            setActiveNav(link);
        });
    });

    // Form Submission
    elements.form.addEventListener("submit", async e => {
        e.preventDefault();
        const formData = getFormData();

        if (!validateForm(formData)) return;

        const formattedPhone = formatPhoneNumber(formData.phone);
        if (!formattedPhone) {
            alert("Invalid phone number format.");
            return;
        }

        const entry = await createEntry(formData, formattedPhone);
        submissions.push(entry);
        localStorage.setItem("submissions", JSON.stringify(submissions));
        elements.form.reset();
        showSuccessPopup();
        if (elements.tableContainer.style.display === "block") renderTable();
    });

    // change views
    function toggleView(view) {
        elements.formContainer.style.display = view === "Raise Ticket" ? "block" : "none";
        elements.tableContainer.style.display = view === "Tickets List" ? "block" : "none";
        if (view === "Tickets List") renderTable();
    }

    function setActiveNav(activeLink) {
        elements.navLinks.forEach(nav => nav.classList.remove("active"));
        activeLink.classList.add("active");
    }

    function getFormData() {
        return {
            fullName: document.getElementById("full-name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            subject: document.getElementById("subject").value,
            message: document.getElementById("message").value.trim(),
            contactMethod: document.querySelector("input[name='contact-method']:checked").value,
            attachment: document.getElementById("attachment").files[0] || null
        };
    }

    function validateForm(data) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phonePattern = /^(254|\+254)[0-9]{9}$|(07|01)[0-9]{8}$/;

        if (Object.values(data).some(val => !val && val !== null)) {
            alert("All fields are required.");
            return false;
        }
        if (!emailPattern.test(data.email)) {
            alert("Please enter a valid email address.");
            return false;
        }
        if (!phonePattern.test(data.phone)) {
            alert("Please enter a valid phone number.");
            return false;
        }
        return true;
    }

    function formatPhoneNumber(number) {
        if (/^(07|01)[0-9]{8}$/.test(number)) return "+254" + number.slice(1);
        if (/^254[0-9]{9}$/.test(number)) return "+" + number;
        if (/^\+254[0-9]{9}$/.test(number)) return number;
        return null;
    }

    async function createEntry(data, phone) {
        return {
            ticketId: submissions.length + 1,
            ...data,
            phone,
            dateCreated: new Date().toISOString().split("T")[0],
            attachment: data.attachment ? await convertFileToBase64(data.attachment) : null
        };
    }

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function showSuccessPopup() {
        elements.successPopup.style.display = "flex";
    }

    // Sort and Filter Logic
    elements.sortBtn.addEventListener("click", () => {
        elements.sortPopup.style.display = "flex";
        renderSortFields();
    });

    elements.filterBtn.addEventListener("click", () => {
        elements.filterPopup.style.display = "flex";
        renderFilterFields();
    });

    elements.addSortBtn.addEventListener("click", () => {
        sortCriteria.push({ column: "ticketId", order: "ascending" });
        renderSortFields();
    });

    elements.addFilterBtn.addEventListener("click", () => {
        filterCriteria.push({ column: "email", relation: "equals", value: "" });
        renderFilterFields();
    });

    elements.resetSortBtn.addEventListener("click", () => {
        sortCriteria = [];
        renderSortFields();
        renderTable();
    });

    elements.resetFilterBtn.addEventListener("click", () => {
        filterCriteria = [];
        renderFilterFields();
        renderTable();
    });

    elements.submitSortBtn.addEventListener("click", () => {
        renderTable();
        closePopup();
    });

    elements.submitFilterBtn.addEventListener("click", () => {
        renderTable();
        closePopup();
    });

    // Event Listeners
    elements.refreshBtn.addEventListener("click", renderTable);

    // Initial Render
    renderTable();
    toggleView("Raise Ticket");
});

// Table Rendering
function renderTable() {
    const elements = {
        tableBody: document.getElementById("table-body"),
        pagination: document.getElementById("pagination")
    };
    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;

    let data = [...submissions];
    data = applyFilters(data);
    data = applySorts(data);
    const paginatedData = paginateData(data, currentPage, ITEMS_PER_PAGE);

    elements.tableBody.innerHTML = paginatedData.map((entry, index) => `
        <tr>
            <td>${entry.ticketId}</td>
            <td>${entry.fullName}<br><small>${entry.email} | ${entry.phone}</small></td>
            <td>${entry.subject}<br><small>${entry.message}</small></td>
            <td>${entry.dateCreated}</td>
            <td>
                <button class="action-btn info-btn" onclick="showInfo(${index})"><img src="images/show-info-icon.svg" alt="show info"></button>
                <button class="action-btn download-btn" onclick="downloadAttachment(${index})"><img src="images/download-icon.svg" alt="download"></button>
                ${entry.contactMethod === "phone" ? `<button class="action-btn call-btn" onclick="triggerCall('${entry.phone}')"><img src="images/phone-icon.svg" alt="call"></button>` : ""}
                ${entry.contactMethod === "email" ? `<button class="action-btn email-btn" onclick="sendEmail('${entry.email}')"><img src="images/email-icon.svg" alt="email"></button>` : ""}
                <button class="action-btn edit-btn" onclick="editEntry(${index})"><img src="images/edit-icon.svg" alt="edit"></button>
                <button class="action-btn delete-btn" onclick="deleteEntry(${index})"><img src="images/trash-can-icon.svg" alt="delete"></button>
            </td>
        </tr>
    `).join("");

    renderPagination(data.length, currentPage, ITEMS_PER_PAGE);
}

function paginateData(data, currentPage, ITEMS_PER_PAGE) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
}

function renderPagination(totalItems, currentPage, ITEMS_PER_PAGE) {
    const elements = {
        pagination: document.getElementById("pagination")
    };
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    elements.pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        button.textContent = i;
        button.addEventListener("click", () => {
            currentPage = i;
            renderTable();
        });
        elements.pagination.appendChild(button);
    }
}

// Global functions for popup handling
function closePopup() {
    document.getElementById("success-popup").style.display = "none";
    document.getElementById("sort-popup").style.display = "none";
    document.getElementById("filter-popup").style.display = "none";
}

// Global functions for sort and filter
function updateSort(index, key, value) {
    sortCriteria[index][key] = value;
    renderTable();
}

function removeSort(index) {
    sortCriteria.splice(index, 1);
    renderSortFields();
    renderTable();
}

function updateFilter(index, key, value) {
    filterCriteria[index][key] = value;
    renderTable();
}

function removeFilter(index) {
    filterCriteria.splice(index, 1);
    renderFilterFields();
    renderTable();
}

// filter rendering function with conditional input types
function renderFilterFields() {
    const elements = {
        filterFields: document.getElementById("filter-fields")
    };

    elements.filterFields.innerHTML = filterCriteria.map((filter, index) => {
        // Determine input type based on column
        let inputField;

        if (filter.column === "ticketId") {
            inputField = `<input type="number" value="${filter.value}" oninput="updateFilter(${index}, 'value', this.value)">`;
        } else if (filter.column === "dateCreated") {
            inputField = `<input type="date" value="${filter.value}" onchange="updateFilter(${index}, 'value', this.value)">`;
        } else if (filter.column === "subject") {
            inputField = `
                <select onchange="updateFilter(${index}, 'value', this.value)">
                    <option value="" ${filter.value === "" ? "selected" : ""}>Select Subject</option>
                    <option value="technical" ${filter.value === "technical" ? "selected" : ""}>Technical Issue</option>
                    <option value="billing" ${filter.value === "billing" ? "selected" : ""}>Billing</option>
                    <option value="general" ${filter.value === "general" ? "selected" : ""}>General Inquiry</option>
                </select>
            `;
        } else {
            inputField = `<input type="text" value="${filter.value}" oninput="updateFilter(${index}, 'value', this.value)">`;
        }

        return `
            <div class="filter-field">
                <select onchange="updateFilter(${index}, 'column', this.value)">
                    <option value="ticketId" ${filter.column === "ticketId" ? "selected" : ""}>Ticket ID</option>
                    <option value="fullName" ${filter.column === "fullName" ? "selected" : ""}>Raised by</option>
                    <option value="email" ${filter.column === "email" ? "selected" : ""}>Email</option>
                    <option value="phone" ${filter.column === "phone" ? "selected" : ""}>Phone</option>
                    <option value="subject" ${filter.column === "subject" ? "selected" : ""}>Ticket Details</option>
                    <option value="dateCreated" ${filter.column === "dateCreated" ? "selected" : ""}>Date Created</option>
                </select>
                <select onchange="updateFilter(${index}, 'relation', this.value)">
                    <option value="equals" ${filter.relation === "equals" ? "selected" : ""}>Equals</option>
                    <option value="greater" ${filter.relation === "greater" ? "selected" : ""}>Greater Than</option>
                    <option value="less" ${filter.relation === "less" ? "selected" : ""}>Less Than</option>
                </select>
                ${inputField}
                <button class="remove-btn" onclick="removeFilter(${index})"><img src="images/trash-can-icon.svg" alt="delete"></button>
            </div>
        `;
    }).join("");
}

//sort rendering
function renderSortFields() {
    const elements = {
        sortFields: document.getElementById("sort-fields")
    };

    elements.sortFields.innerHTML = sortCriteria.map((sort, index) => `
        <div class="sort-field">
            <select onchange="updateSort(${index}, 'column', this.value)">
                <option value="ticketId" ${sort.column === "ticketId" ? "selected" : ""}>Ticket ID</option>
                <option value="fullName" ${sort.column === "fullName" ? "selected" : ""}>Raised by</option>
                <option value="subject" ${sort.column === "subject" ? "selected" : ""}>Ticket Details</option>
                <option value="dateCreated" ${sort.column === "dateCreated" ? "selected" : ""}>Date Created</option>
            </select>
            <select onchange="updateSort(${index}, 'order', this.value)">
                <option value="ascending" ${sort.order === "ascending" ? "selected" : ""}>Ascending</option>
                <option value="descending" ${sort.order === "descending" ? "selected" : ""}>Descending</option>
            </select>
            <button class="remove-btn" onclick="removeSort(${index})"><img src="images/trash-can-icon.svg" alt="delete"></button>
        </div>
    `).join("");
}

// sort and filter logic
function applySorts(data) {
    return [...data].sort((a, b) => {
        for (let sort of sortCriteria) {
            const valueA = a[sort.column];
            const valueB = b[sort.column];

            if (valueA !== valueB) {
                if (sort.column === "ticketId") {
                    // Numeric comparison
                    return sort.order === "ascending" ?
                        (parseInt(valueA) - parseInt(valueB)) :
                        (parseInt(valueB) - parseInt(valueA));
                } else if (sort.column === "dateCreated") {
                    // Date comparison
                    const dateA = new Date(valueA);
                    const dateB = new Date(valueB);
                    return sort.order === "ascending" ?
                        (dateA - dateB) :
                        (dateB - dateA);
                } else {
                    // String comparison
                    return sort.order === "ascending" ?
                        (valueA.toString().localeCompare(valueB.toString())) :
                        (valueB.toString().localeCompare(valueA.toString()));
                }
            }
        }
        return 0;
    });
}

function applyFilters(data) {
    return data.filter(entry => {
        return filterCriteria.every(filter => {
            const value = entry[filter.column];
            const filterValue = filter.value;

            if (filterValue === "") return true; // Skip empty filters

            switch (filter.column) {
                case "ticketId":
                    // Numeric comparison
                    const numVal = parseInt(value);
                    const numFilterVal = parseInt(filterValue);

                    switch (filter.relation) {
                        case "equals": return numVal === numFilterVal;
                        case "greater": return numVal > numFilterVal;
                        case "less": return numVal < numFilterVal;
                    }
                    break;

                case "dateCreated":
                    // Date comparison
                    const dateVal = new Date(value);
                    const dateFilterVal = new Date(filterValue);

                    switch (filter.relation) {
                        case "equals": return dateVal.toDateString() === dateFilterVal.toDateString();
                        case "greater": return dateVal > dateFilterVal;
                        case "less": return dateVal < dateFilterVal;
                    }
                    break;

                default:
                    // String comparison
                    switch (filter.relation) {
                        case "equals":
                            return value.toString().toLowerCase() === filterValue.toLowerCase();
                        case "greater":
                            return value.toString().toLowerCase() > filterValue.toLowerCase();
                        case "less":
                            return value.toString().toLowerCase() < filterValue.toLowerCase();
                    }
            }

            return false;
        });
    });
}

// Action Handlers
function showInfo(index) {
    const entry = submissions[index];
    const attachmentPreview = entry.attachment ?
        (entry.attachment.includes("pdf") ?
            `<embed src="${entry.attachment}" width="100%" height="400px" type="application/pdf">` :
            `<img src="${entry.attachment}" alt="Attachment" style="max-width: 100%; height: auto;">`) :
        "<p>No attachment uploaded.</p>";

    const modal = document.createElement("div");
    modal.classList.add("modal-container");
    modal.innerHTML = `
        <div class="modal">
            <h2>Ticket #${entry.ticketId}</h2>
            <p><strong>Name:</strong> ${entry.fullName}</p>
            <p><strong>Email:</strong> ${entry.email}</p>
            <p><strong>Phone:</strong> ${entry.phone}</p>
            <p><strong>Subject:</strong> ${entry.subject}</p>
            <p><strong>Message:</strong> ${entry.message}</p>
            <p><strong>Attachment:</strong></p>
            ${attachmentPreview}
            <button onclick="closeModal()">Close</button>
        </div>`;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector(".modal-container");
    if (modal) modal.remove();
}

function downloadAttachment(index) {
    const entry = submissions[index];
    if (entry.attachment) {
        const a = document.createElement("a");
        a.href = entry.attachment;
        a.download = `Ticket-${entry.ticketId}-attachment`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert("No attachment available.");
    }
}

function triggerCall(phone) {
    window.location.href = `tel:${phone}`;
}

function sendEmail(email) {
    window.location.href = `mailto:${email}`;
}

function editEntry(index) {
    const entry = submissions[index];
    const updated = promptForUpdates(entry);
    if (updated) {
        submissions[index] = { ...entry, ...updated };
        saveAndRenderTable();
    }
}

function deleteEntry(index) {
    if (confirm("Are you sure you want to delete this ticket?")) {
        submissions.splice(index, 1);
        saveAndRenderTable();
    }
}

function promptForUpdates(entry) {
    const fields = [
        { key: "fullName", label: "Full Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" }
    ];

    const updated = {};
    for (const { key, label } of fields) {
        const value = prompt(`Edit ${label}:`, entry[key]);
        if (value === null) return null; // User cancelled
        updated[key] = value;
    }
    return updated;
}

function saveAndRenderTable() {
    localStorage.setItem("submissions", JSON.stringify(submissions));
    renderTable();
}