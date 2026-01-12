// app.js
// Global variables
const grid = document.getElementById("grid");
const searchInput = document.getElementById("searchInput");
const attendanceConsole = document.getElementById("attendanceConsole");
const presentCountElement = document.getElementById("presentCount");
const totalCountElement = document.getElementById("totalCount");
const consoleCountElement = document.getElementById("consoleCount");
const subjectInput = document.getElementById("subjectInput");

let presentSet = new Set();

// Initialize app
function initApp() {
    if (students.length === 0) {
        console.log('Waiting for students data...');
        return;
    }
    
    renderGrid();
    updateDateTime();
    updateCounters();
    setupEventListeners();
    loadSavedData();
    
    // Auto-save every 30 seconds
    setInterval(saveToLocalStorage, 30000);
    
    console.log('App initialized successfully');
}

// Render grid with students
function renderGrid() {
    if (!grid) {
        console.error('Grid element not found');
        return;
    }
    
    grid.innerHTML = "";
    
    students.forEach(student => {
        const div = document.createElement("div");
        div.className = "circle";
        div.textContent = student.rollNo;
        div.dataset.roll = student.rollNo;
        div.dataset.name = student.name;
        div.title = `Roll ${student.rollNo}: ${student.name}`;
        
        div.addEventListener("click", () => toggleAttendance(student.rollNo, div));
        
        if (presentSet.has(student.rollNo)) {
            div.classList.add("present");
        }
        
        grid.appendChild(div);
    });
    
    totalCountElement.textContent = students.length;
    updateCounters();
}

// Toggle attendance
function toggleAttendance(rollNo, element) {
    // Click animation
    element.style.transform = "scale(0.95)";
    setTimeout(() => {
        element.style.transform = "";
    }, 150);
    
    if (presentSet.has(rollNo)) {
        presentSet.delete(rollNo);
        element.classList.remove("present");
    } else {
        presentSet.add(rollNo);
        element.classList.add("present");
        
        // Highlight animation
        element.classList.add("highlight");
        setTimeout(() => {
            element.classList.remove("highlight");
        }, 1500);
    }
    
    updateConsole();
    updateCounters();
    saveToLocalStorage();
}

// Update counters
function updateCounters() {
    const presentCount = presentSet.size;
    presentCountElement.textContent = presentCount;
    consoleCountElement.textContent = presentCount;
}

// Update console
function updateConsole() {
    const list = [...presentSet].sort((a, b) => a - b);
    
    if (list.length === 0) {
        attendanceConsole.value = "";
        attendanceConsole.placeholder = "No attendance marked yet...";
        return;
    }
    
    attendanceConsole.value = list.join(", ");
    attendanceConsole.scrollTop = attendanceConsole.scrollHeight;
}

// Filter grid
function filterGrid() {
    const query = searchInput.value.toLowerCase().trim();
    
    document.querySelectorAll(".circle").forEach(circle => {
        const roll = circle.textContent;
        const name = circle.dataset.name.toLowerCase();
        
        const matches = roll.includes(query) || name.includes(query);
        
        if (query === "") {
            circle.style.display = "flex";
            circle.style.opacity = "1";
            circle.style.transform = "scale(1)";
        } else {
            circle.style.display = matches ? "flex" : "none";
            circle.style.opacity = matches ? "1" : "0.3";
            circle.style.transform = matches ? "scale(1)" : "scale(0.9)";
        }
    });
}

// Handle Enter key
function handleEnterKey(e) {
    if (e.key !== "Enter") return;
    
    const visible = [...document.querySelectorAll(".circle:not([style*='display: none']):not([style*='display:none'])")];
    
    if (visible.length === 0) return;
    
    const first = visible[0];
    const rollNo = parseInt(first.dataset.roll);
    toggleAttendance(rollNo, first);
    
    searchInput.value = "";
    filterGrid();
    searchInput.focus();
}

// Copy attendance
function copyAttendance() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const textToCopy = list.join(", ");
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => showToast("Copied to clipboard!", "success"))
        .catch(() => {
            // Fallback
            attendanceConsole.select();
            document.execCommand("copy");
            showToast("Copied to clipboard!", "success");
        });
}

// Copy as CSV
function copyAsCSV() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const subject = subjectInput.value || "Attendance";
    const date = new Date().toLocaleDateString('en-IN');
    const csvData = `Subject: ${subject}\nDate: ${date}\nPresent Roll Numbers:\n${list.join(",")}`;
    
    navigator.clipboard.writeText(csvData)
        .then(() => showToast("CSV copied to clipboard!", "success"))
        .catch(() => showToast("Failed to copy CSV", "error"));
}

// Share attendance
function shareAttendance() {
    if (presentSet.size === 0) {
        showToast("No attendance to share!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const subject = subjectInput.value || "Class";
    const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const text = `Attendance for ${subject} - ${date}\nPresent: ${list.join(", ")}\nTotal Present: ${list.length}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${subject} Attendance`,
            text: text
        }).catch(() => fallbackShare(text));
    } else {
        fallbackShare(text);
    }
}

function fallbackShare(text) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// Print summary
function printSummary() {
    const list = [...presentSet].sort((a, b) => a - b);
    const subject = subjectInput.value || "Attendance";
    const date = new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Attendance Summary</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .meta { color: #666; margin-bottom: 20px; }
                .list { font-family: monospace; font-size: 14px; line-height: 1.6; }
                .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                @media print {
                    body { padding: 10px; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Attendance Summary</h1>
            <div class="meta">
                <strong>Subject:</strong> ${subject}<br>
                <strong>Date:</strong> ${date}<br>
                <strong>Total Students:</strong> ${students.length}
            </div>
            <div class="stats">
                <strong>Present:</strong> ${list.length} students<br>
                <strong>Absent:</strong> ${students.length - list.length} students
            </div>
            <h3>Present Roll Numbers:</h3>
            <div class="list">${list.length > 0 ? list.join(", ") : "None"}</div>
            <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px;">Print</button>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Mark all present
function markAllPresent() {
    students.forEach(student => {
        presentSet.add(student.rollNo);
    });
    
    document.querySelectorAll(".circle").forEach(circle => {
        circle.classList.add("present");
    });
    
    updateConsole();
    updateCounters();
    saveToLocalStorage();
    showToast("All students marked as present!", "success");
}

// Clear all attendance
function clearAllAttendance() {
    presentSet.clear();
    document.querySelectorAll(".present").forEach(circle => {
        circle.classList.remove("present");
    });
    
    updateConsole();
    updateCounters();
    saveToLocalStorage();
    showToast("All attendance cleared!", "info");
}

// Reset attendance
function resetAttendance() {
    if (presentSet.size > 0) {
        if (!confirm("Are you sure you want to reset all attendance? This cannot be undone.")) {
            return;
        }
    }
    
    presentSet.clear();
    document.querySelectorAll(".circle").forEach(circle => {
        circle.classList.remove("present");
    });
    
    if (subjectInput) subjectInput.value = "";
    if (searchInput) searchInput.value = "";
    
    updateConsole();
    updateCounters();
    localStorage.removeItem('attendanceData');
    showToast("Attendance reset successfully!", "info");
}

// Date time updater
function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById("dateTime");
    
    if (dateTimeElement) {
        const date = now.toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const time = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        
        dateTimeElement.textContent = `${date} • ${time}`;
    }
}

// Toast notifications
function showToast(message, type = "info") {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || 'ℹ';
}

// LocalStorage functions
function saveToLocalStorage() {
    const data = {
        present: [...presentSet],
        timestamp: new Date().toISOString(),
        subject: subjectInput ? subjectInput.value : ""
    };
    localStorage.setItem('attendanceData', JSON.stringify(data));
}

function loadSavedData() {
    try {
        const saved = localStorage.getItem('attendanceData');
        if (!saved) return;
        
        const data = JSON.parse(saved);
        if (data.present && Array.isArray(data.present)) {
            data.present.forEach(roll => presentSet.add(roll));
            
            if (data.subject && subjectInput) {
                subjectInput.value = data.subject;
            }
            
            // Re-render to show saved state
            renderGrid();
            updateConsole();
            updateCounters();
            
            showToast('Previous attendance restored', 'info');
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener("input", filterGrid);
        searchInput.addEventListener("keydown", handleEnterKey);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Number keys 1-9
        if (e.key >= 1 && e.key <= 9) {
            const rollNumber = parseInt(e.key);
            const circle = document.querySelector(`.circle[data-roll="${rollNumber}"]`);
            if (circle) {
                circle.click();
            }
        }
        
        // Ctrl shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'c':
                    if (document.activeElement !== searchInput) {
                        e.preventDefault();
                        copyAttendance();
                    }
                    break;
                case 'p':
                    e.preventDefault();
                    generatePDF();
                    break;
                case 'r':
                    e.preventDefault();
                    resetAttendance();
                    break;
                case 'f':
                    e.preventDefault();
                    if (searchInput) searchInput.focus();
                    break;
            }
        }
    });
    
    // Update time every second
    setInterval(updateDateTime, 1000);
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (students.length > 0) {
            initApp();
        }
    });
} else {
    if (students.length > 0) {
        initApp();
    }
}