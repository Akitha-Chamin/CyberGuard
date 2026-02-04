/* public/script.js - Finalized for Node.js + MySQL (XAMPP) */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. NAVIGATION HIGHLIGHT ---
    const currentLocation = location.href;
    const menuItem = document.querySelectorAll('.nav-links a');
    for (let i = 0; i < menuItem.length; i++) {
        if (menuItem[i].href === currentLocation) {
            menuItem[i].className = "active";
        }
    }

    // --- 2. REPORT FORM SUBMISSION (Send to Database) ---
    const reportForm = document.getElementById('reportForm');
    if(reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = reportForm.querySelector('.btn');
            const originalText = btn.innerText;
            
            // Gather Form Data using the NEW IDs
            const formData = {
                type: document.getElementById('inp_type').value,
                date: document.getElementById('inp_date').value,
                time: document.getElementById('inp_time').value,
                system: document.getElementById('inp_system').value,
                description: document.getElementById('inp_desc').value
            };

            // UI Feedback
            btn.innerText = "UPLOADING...";
            btn.style.opacity = "0.7";

            try {
                // Send data to the Node.js Server
                const response = await fetch('/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();

                if(result.success) {
                    alert(`SUCCESS!\n\nReference ID: ${result.id}\nStatus: Securely logged in database.`);
                    reportForm.reset();
                } else {
                    alert("Error submitting report. Please try again.");
                }
            } catch (err) {
                console.error(err);
                alert("Connection Error. Ensure server is running.");
            }

            // Reset Button
            btn.innerText = originalText;
            btn.style.opacity = "1";
        });
    }
    
    // --- 3. DASHBOARD: FETCH REAL DATA FROM MYSQL ---
    const tableBody = document.querySelector('.incident-table tbody');
    
    if(tableBody) {
        // Function to load data
        async function loadDashboardData() {
            try {
                const res = await fetch('/api/incidents');
                const incidents = await res.json();
                
                // Clear existing content
                tableBody.innerHTML = '';

                // Loop through database results
                incidents.forEach(inc => {
                    // Create a pretty ID from the MySQL Integer ID (e.g., 1 becomes CYB-1001)
                    const shortId = "CYB-" + (1000 + inc.id);
                    
                    // Determine Color Class based on severity
                    let statusClass = 'status-low';
                    if(inc.severity === 'CRITICAL') statusClass = 'status-high';
                    if(inc.severity === 'MEDIUM') statusClass = 'status-med';

                    // Build HTML Row
                    const row = `
                        <tr>
                            <td>#${shortId}</td>
                            <td>${inc.type}</td>
                            <td>${inc.date}</td>
                            <td class="${statusClass}">${inc.severity}</td>
                            <td>${inc.status}</td>
                            <td>
                                <button class="btn view-btn" style="padding: 5px 10px; font-size: 0.7rem;"
                                    data-id="#${shortId}"
                                    data-type="${inc.type}"
                                    data-date="${inc.date} ${inc.time}"
                                    data-sev="${inc.severity}"
                                    data-status="${inc.status}"
                                    data-desc="${inc.description}">
                                    View
                                </button>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });

                // Re-attach Event Listeners for the new buttons we just created
                attachModalEvents();

            } catch (err) {
                console.log("Error loading dashboard:", err);
                tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Error loading data. Is the server running?</td></tr>";
            }
        }
        
        // Run immediately
        loadDashboardData();
    }

    // --- 4. CONTACT FORM (Simulation) ---
    const contactForm = document.getElementById('contactForm');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Message Received. Support ticket created.");
            contactForm.reset();
        });
    }

    // --- 5. MODAL LOGIC (Popups) ---

    // Function to activate "View" buttons after table loads
    function attachModalEvents() {
        const incidentModal = document.getElementById('incidentModal');
        const viewBtns = document.querySelectorAll('.view-btn');

        // Elements inside incident modal
        const mId = document.getElementById('m-id');
        const mType = document.getElementById('m-type');
        const mDate = document.getElementById('m-date');
        const mSev = document.getElementById('m-sev');
        const mStatus = document.getElementById('m-status');
        const mDesc = document.getElementById('m-desc');

        viewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Populate Modal Data
                mId.innerText = this.getAttribute('data-id');
                mType.innerText = this.getAttribute('data-type');
                mDate.innerText = this.getAttribute('data-date');
                mSev.innerText = this.getAttribute('data-sev');
                mStatus.innerText = this.getAttribute('data-status');
                mDesc.innerText = this.getAttribute('data-desc');
                
                // Colorize Severity
                const s = this.getAttribute('data-sev');
                mSev.style.color = (s === 'CRITICAL') ? '#ff2a2a' : (s === 'MEDIUM' ? 'orange' : '#00ff00');

                // Show Modal
                if(incidentModal) incidentModal.style.display = 'block';
            });
        });
    }

    // General Modal Closing Logic (For both Incident & Access Denied modals)
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close-modal, .close-access, .close-access-btn');
    const actionBtns = document.querySelectorAll('.action-btn');

    // Close on X button click
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(m => m.style.display = 'none');
        });
    });

    // Close on clicking outside the box
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Action Buttons (Escalate/Archive) inside popup
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert(`${this.innerText} action initiated.`);
            modals.forEach(m => m.style.display = 'none');
        });
    });

    // --- 6. SIDEBAR LOGIC (Access Denied) ---
    const accessModal = document.getElementById('accessModal');
    const sidebarItems = document.querySelectorAll('.sidebar ul li');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemText = this.innerText.trim();

            if (itemText === 'Live Monitor') {
                // Highlight Live Monitor
                sidebarItems.forEach(li => {
                    li.style.background = 'transparent'; 
                    li.style.color = 'inherit'; 
                    li.style.borderLeft = 'none';
                });
                this.style.background = '#1a1a1a';
                this.style.color = '#ff2a2a';
                this.style.borderLeft = '3px solid red';
            } else {
                // Show Access Denied for anything else
                if(accessModal) accessModal.style.display = 'block';
            }
        });
    });

});