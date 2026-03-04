// pdf.js
// PDF Generation Function

/**
 * Gets attendance data directly from the DOM
 * This is the most reliable way to get current attendance state
 */
function getAttendanceFromDOM() {
    const presentRolls = new Set();
    const allCircles = document.querySelectorAll('.circle.present');
    
    allCircles.forEach(circle => {
        const rollNo = parseInt(circle.dataset.roll, 10);
        if (!isNaN(rollNo)) {
            presentRolls.add(rollNo);
        }
    });
    
    return presentRolls;
}

/**
 * Gets students data from multiple possible sources
 */
function getStudentsData() {
    // Try window.students first (set by students.js)
    if (window.students && Array.isArray(window.students) && window.students.length > 0) {
        return window.students;
    }
    
    // Fallback: build from DOM
    const students = [];
    const allCircles = document.querySelectorAll('.circle');
    
    allCircles.forEach(circle => {
        const rollNo = parseInt(circle.dataset.roll, 10);
        const name = circle.dataset.name || `Student ${rollNo}`;
        if (!isNaN(rollNo)) {
            students.push({ rollNo, name });
        }
    });
    
    return students.sort((a, b) => a.rollNo - b.rollNo);
}

window.generatePDF = function() {
    try {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined') {
            showToast("PDF library is loading. Please wait...", "warning");
            
            // Try to load it if not available
            if (!window.jspdfLoading) {
                window.jspdfLoading = true;
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = function() {
                    window.jspdfLoading = false;
                    window.generatePDF(); // Retry
                };
                script.onerror = function() {
                    window.jspdfLoading = false;
                    showToast("Failed to load PDF library. Please check your internet connection.", "error");
                };
                document.head.appendChild(script);
            }
            return;
        }

        // Get the jsPDF constructor from window.jspdf
        const { jsPDF: JsPDF } = window.jspdf;
        
        if (!JsPDF) {
            showToast("PDF library failed to initialize.", "error");
            return;
        }

        // Get attendance data directly from DOM (most reliable)
        const presentSet = getAttendanceFromDOM();
        const students = getStudentsData();
        
        // Check if there's data to export
        if (students.length === 0) {
            showToast("No students found!", "error");
            return;
        }
        
        if (presentSet.size === 0) {
            showToast("No attendance marked to export!", "warning");
            return;
        }

        // Create PDF document
        const doc = new JsPDF();
        
        // Get subject
        const subjectInput = document.getElementById('subjectInput');
        const subject = subjectInput && subjectInput.value ? subjectInput.value.trim() : "Attendance";
        
        // Get current date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        
        const timeStr = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
        
        // Create filename (safe for file system)
        const safeTime = timeStr.replace(/[: ]/g, "-").replace(/[^a-zA-Z0-9\-]/g, "");
        const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${safeSubject}_${dateStr.replace(/[, ]/g, "_")}_${safeTime}.pdf`;
        
        // Page dimensions
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        let yPos = margin;
        
        // =========== HEADER SECTION ===========
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94); // Primary color
        doc.text(`${subject} Attendance`, pageWidth / 2, yPos, { align: "center" });
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${dateStr} | Time: ${timeStr}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 15;
        
        // =========== SUMMARY SECTION ===========
        const totalStudents = students.length;
        const presentCount = presentSet.size;
        const absentCount = totalStudents - presentCount;
        const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;
        
        // Calculate box dimensions
        const boxWidth = pageWidth - (margin * 2);
        const boxHeight = 25;
        
        doc.setDrawColor(34, 197, 94);
        doc.setFillColor(245, 255, 250);
        doc.rect(margin, yPos, boxWidth, boxHeight, 'F');
        doc.rect(margin, yPos, boxWidth, boxHeight);
        
        // Calculate responsive column positions for summary
        const summaryCol1 = margin + 5;                    // Title column
        const summaryCol2 = margin + (boxWidth * 0.35);    // 35% - Total/Present
        const summaryCol3 = margin + (boxWidth * 0.65);    // 65% - Absent/Attendance
        
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance Summary", summaryCol1, yPos + 10);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        // Summary text in responsive columns
        doc.text(`Total: ${totalStudents}`, summaryCol2, yPos + 10);
        doc.text(`Present: ${presentCount}`, summaryCol2, yPos + 17);
        doc.text(`Absent: ${absentCount}`, summaryCol3, yPos + 10);
        doc.text(`Attendance: ${attendancePercentage}%`, summaryCol3, yPos + 17);
        
        yPos += 35;
        
        // =========== PRESENT STUDENTS SECTION ===========
        doc.setFontSize(16);
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "bold");
        doc.text("Present Students:", margin, yPos);
        yPos += 10;
        
        // Get present students sorted by roll number
        const presentStudents = students
            .filter(s => presentSet.has(s.rollNo))
            .sort((a, b) => a.rollNo - b.rollNo);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        // Render in two columns
        const col1X = margin;
        const col2X = pageWidth / 2;
        let rowY = yPos;
        
        for (let i = 0; i < presentStudents.length; i += 2) {
            // Check if we need a new page
            if (rowY > pageHeight - 25) {
                doc.addPage();
                rowY = margin;
            }
            
            // First column
            const student1 = presentStudents[i];
            doc.text(`${student1.rollNo}. ${student1.name}`, col1X, rowY);
            
            // Second column (if exists)
            if (i + 1 < presentStudents.length) {
                const student2 = presentStudents[i + 1];
                doc.text(`${student2.rollNo}. ${student2.name}`, col2X, rowY);
            }
            
            rowY += 6;
        }
        
        yPos = rowY + 10;
        
        // =========== ABSENT STUDENTS SECTION ===========
        // Add page if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        const absentStudents = students
            .filter(s => !presentSet.has(s.rollNo))
            .sort((a, b) => a.rollNo - b.rollNo);
        
        if (absentStudents.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(239, 68, 68); // Error color
            doc.setFont("helvetica", "bold");
            doc.text("Absent Students:", margin, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            
            rowY = yPos;
            
            for (let i = 0; i < absentStudents.length; i += 2) {
                if (rowY > pageHeight - 25) {
                    doc.addPage();
                    rowY = margin;
                }
                
                const student1 = absentStudents[i];
                doc.text(`${student1.rollNo}. ${student1.name}`, col1X, rowY);
                
                if (i + 1 < absentStudents.length) {
                    const student2 = absentStudents[i + 1];
                    doc.text(`${student2.rollNo}. ${student2.name}`, col2X, rowY);
                }
                
                rowY += 6;
            }
        }
        
        // =========== FOOTER ===========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "italic");
            doc.text(`Generated by Attendance Tracker • Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        }
        
        // Save the PDF
        doc.save(fileName);
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast("PDF downloaded successfully!", "success");
        }
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (typeof showToast === 'function') {
            showToast("Failed to generate PDF: " + error.message, "error");
        }
    }
};