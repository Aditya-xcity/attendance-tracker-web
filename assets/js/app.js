// app.js
// Global variables
const grid = document.getElementById("grid");
const attendanceConsoleSpace = document.getElementById("attendanceConsoleSpace");
const searchInput = document.getElementById("searchInput");
const attendanceConsole = document.getElementById("attendanceConsole");
const presentCountElement = document.getElementById("presentCount");
const totalCountElement = document.getElementById("totalCount");
const consoleCountElement = document.getElementById("consoleCount");
const subjectInput = document.getElementById("subjectInput");
const absentCountElement = document.getElementById("absentCount");
const storageStatusElement = document.getElementById("storageStatus");

let presentSet = new Set();
// Ensure students array exists
window.students = window.students || [];

// Initialize app
function initApp() {
    if (!students || students.length === 0) {
        console.log('Waiting for students data...');
        showToast('No students data loaded. Please check data.js', 'warning');
        return;
    }
    
    renderGrid();
    updateDateTime();
    updateCounters();
    setupEventListeners();
    loadSavedData();
    
    // Auto-save every 30 seconds
    setInterval(saveToLocalStorage, 30000);
    
    console.log('App initialized successfully with', students.length, 'students');
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
    
    if (totalCountElement) {
        totalCountElement.textContent = students.length;
    }
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
    const totalCount = students.length;
    const absentCount = totalCount - presentCount;
    
    if (presentCountElement) {
        presentCountElement.textContent = presentCount;
    }
    if (consoleCountElement) {
        consoleCountElement.textContent = presentCount;
    }
    if (absentCountElement) {
        absentCountElement.textContent = absentCount;
    }
    
    // Update storage status
    if (storageStatusElement) {
        storageStatusElement.textContent = `Saved (${presentCount}/${totalCount})`;
    }
}

// Update console
function updateConsole() {
    const list = [...presentSet].sort((a, b) => a - b);

    if (list.length === 0) {
        if (attendanceConsole) {
            attendanceConsole.value = "";
            attendanceConsole.placeholder = "5, 7, 8, 12";
        }
        
        if (attendanceConsoleSpace) {
            attendanceConsoleSpace.value = "";
            attendanceConsoleSpace.placeholder = "5 7 8 12";
        }
        return;
    }

    // Comma + space format → 5, 7, 8, 12
    if (attendanceConsole) {
        attendanceConsole.value = list.join(", ");
    }

    // Space-separated format → 5 7 8 12
    if (attendanceConsoleSpace) {
        attendanceConsoleSpace.value = list.join(" ");
    }
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
    
    const visible = [...document.querySelectorAll(".circle")].filter(circle => {
        const style = window.getComputedStyle(circle);
        return style.display !== "none" && style.visibility !== "hidden";
    });
    
    if (visible.length === 0) return;
    
    const first = visible[0];
    const rollNo = parseInt(first.dataset.roll);
    toggleAttendance(rollNo, first);
    
    if (searchInput) {
        searchInput.value = "";
        filterGrid();
        searchInput.focus();
    }
}

// Copy comma-separated format
function copyCommaSeparated() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const textToCopy = list.join(", ");
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => showCopyFeedback(event, "Copied!"))
        .catch(() => {
            // Fallback
            if (attendanceConsole) {
                attendanceConsole.select();
                document.execCommand("copy");
            }
            showCopyFeedback(event, "Copied!");
        });
}

// Copy space-separated format
function copySpaceSeparated() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const textToCopy = list.join(" ");
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => showCopyFeedback(event, "Copied!"))
        .catch(() => {
            // Fallback
            if (attendanceConsoleSpace) {
                attendanceConsoleSpace.select();
                document.execCommand("copy");
            }
            showCopyFeedback(event, "Copied!");
        });
}

// Copy both formats
function copyBothFormats() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const commaFormat = list.join(", ");
    const spaceFormat = list.join(" ");
    const bothFormats = `Comma-separated: ${commaFormat}\nSpace-separated: ${spaceFormat}`;
    
    navigator.clipboard.writeText(bothFormats)
        .then(() => showToast("Both formats copied!", "success"))
        .catch(() => {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = bothFormats;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast("Both formats copied!", "success");
        });
}

// Show feedback next to copy button
function showCopyFeedback(event, message) {
    const btn = event.currentTarget || event.target;
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.textContent = message;
    
    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(feedback);
    
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 1500);
}

// Copy as CSV
function copyAsCSV() {
    if (presentSet.size === 0) {
        showToast("No attendance to copy!", "warning");
        return;
    }
    
    const list = [...presentSet].sort((a, b) => a - b);
    const subject = subjectInput ? subjectInput.value : "Attendance";
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
    const subject = subjectInput ? subjectInput.value : "Class";
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
    const subject = subjectInput ? subjectInput.value : "Attendance";
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
    if (!confirm("Mark all students as present?")) {
        return;
    }
    
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
    if (presentSet.size === 0) {
        showToast("No attendance to clear!", "info");
        return;
    }
    
    if (!confirm("Clear all attendance?")) {
        return;
    }
    
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
    if (!confirm("Are you sure you want to reset all attendance? This will clear subject and attendance data.")) {
        return;
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
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
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

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
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
        
        // Check if data is not too old (optional: e.g., 24 hours)
        const savedTime = new Date(data.timestamp);
        const currentTime = new Date();
        const hoursDiff = (currentTime - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            if (confirm("Found saved attendance from more than 24 hours ago. Load it?")) {
                loadData(data);
            }
        } else {
            loadData(data);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function loadData(data) {
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
}

// Setup event listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener("input", filterGrid);
        searchInput.addEventListener("keydown", handleEnterKey);
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Number keys 1-9 for quick marking
        if (e.key >= 1 && e.key <= 9) {
            const rollNumber = parseInt(e.key);
            const circle = document.querySelector(`.circle[data-roll="${rollNumber}"]`);
            if (circle) {
                circle.click();
            }
        }
        
        // Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    copyCommaSeparated();
                    break;
                case 'p':
                    e.preventDefault();
                    printSummary();
                    break;
                case 'r':
                    e.preventDefault();
                    resetAttendance();
                    break;
                case 'f':
                    e.preventDefault();
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                    break;
                case 'a':
                    e.preventDefault();
                    markAllPresent();
                    break;
                case 'd':
                    e.preventDefault();
                    clearAllAttendance();
                    break;
            }
        }
        
        // Escape key to clear search
        if (e.key === 'Escape' && searchInput) {
            searchInput.value = '';
            filterGrid();
        }
    });
    
    // Update time every second
    setInterval(updateDateTime, 1000);
}

// Make functions available globally
window.initApp = initApp;
window.copyCommaSeparated = copyCommaSeparated;
window.copySpaceSeparated = copySpaceSeparated;
window.copyBothFormats = copyBothFormats;
window.copyAttendance = copyCommaSeparated; // Alias for backward compatibility
window.copyAsCSV = copyAsCSV;
window.shareAttendance = shareAttendance;
window.printSummary = printSummary;
window.markAllPresent = markAllPresent;
window.clearAllAttendance = clearAllAttendance;
window.resetAttendance = resetAttendance;
window.generatePDF = function() {
    // Call the PDF function from pdf.js
    if (typeof window.generatePDF === 'function') {
        window.generatePDF();
    } else {
        showToast("PDF functionality loading...", "info");
        setTimeout(() => {
            if (typeof window.generatePDF === 'function') {
                window.generatePDF();
            } else {
                showToast("PDF generation not available. Please reload the page.", "error");
            }
        }, 1000);
    }
};
window.showToast = showToast;

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for students data to load if it's in a separate file
    setTimeout(() => {
        initApp();
    }, 100);
});

// Alternative: Listen for students data loaded event
window.addEventListener('studentsLoaded', () => {
    initApp();
});