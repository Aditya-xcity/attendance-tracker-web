// pdf.js
function generatePDF() {
    try {
        // Check if jsPDF is loaded - use window.jspdf, not jsPDF
        if (typeof window.jspdf === 'undefined') {
            showToast("PDF library is loading. Please wait...", "warning");
            
            // Try to load it if not available
            if (!window.jspdfLoading) {
                window.jspdfLoading = true;
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = function() {
                    window.jspdfLoading = false;
                    generatePDF(); // Retry
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
        const { jsPDF: JsPDF } = window.jspdf; // Rename to avoid conflict
        
        if (!JsPDF) {
            showToast("PDF library failed to initialize.", "error");
            return;
        }

        // Check if there's attendance to export
        if (presentSet.size === 0 && students.length > 0) {
            showToast("No attendance marked to export!", "warning");
            return;
        }

        // Create PDF document
        const doc = new JsPDF();
        
        // Get subject
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
        
        doc.setDrawColor(34, 197, 94);
        doc.setFillColor(245, 255, 250);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 25, 'F');
        doc.rect(margin, yPos, pageWidth - (margin * 2), 25);
        
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.setFont("helvetica", "bold");
        doc.text("Attendance Summary", margin + 5, yPos + 10);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        // Summary text
        doc.text(`Total Students: ${totalStudents}`, margin + 100, yPos + 10);
        doc.text(`Present: ${presentCount}`, margin + 100, yPos + 17);
        doc.text(`Absent: ${absentCount}`, margin + 180, yPos + 10);
        doc.text(`Attendance: ${attendancePercentage}%`, margin + 180, yPos + 17);
        
        yPos += 35;
        
        // =========== PRESENT STUDENTS SECTION ===========
        if (presentSet.size > 0) {
            doc.setFontSize(16);
            doc.setTextColor(34, 197, 94);
            doc.setFont("helvetica", "bold");
            doc.text("Present Students:", margin, yPos);
            yPos += 10;
            
            // Sort present roll numbers
            const presentList = [...presentSet].sort((a, b) => a - b);
            
            // Get student details
            const presentStudents = students
                .filter(s => presentList.includes(s.rollNo))
                .sort((a, b) => a.rollNo - b.rollNo);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            
            // Create two columns
            let col1X = margin;
            let col2X = pageWidth / 2;
            let currentCol = 1;
            let colY = yPos;
            
            presentStudents.forEach((student, index) => {
                // Check if we need a new page
                if (colY > pageHeight - 20) {
                    doc.addPage();
                    col1X = margin;
                    col2X = pageWidth / 2;
                    colY = margin;
                }
                
                const line = `${student.rollNo}. ${student.name}`;
                
                // Alternate between columns
                if (index % 2 === 0) {
                    doc.text(line, col1X, colY);
                    if (index < presentStudents.length - 1 && index % 2 === 0) {
                        colY += 6;
                    }
                } else {
                    doc.text(line, col2X, colY - 6); // Same row as previous
                }
            });
            
            yPos = colY + 10;
        } else {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "italic");
            doc.text("No students marked as present", margin, yPos);
            yPos += 15;
        }
        
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
            
            let col1X = margin;
            let col2X = pageWidth / 2;
            let colY = yPos;
            
            absentStudents.forEach((student, index) => {
                if (colY > pageHeight - 20) {
                    doc.addPage();
                    col1X = margin;
                    col2X = pageWidth / 2;
                    colY = margin;
                }
                
                const line = `${student.rollNo}. ${student.name}`;
                
                if (index % 2 === 0) {
                    doc.text(line, col1X, colY);
                    if (index < absentStudents.length - 1 && index % 2 === 0) {
                        colY += 6;
                    }
                } else {
                    doc.text(line, col2X, colY - 6);
                }
            });
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
        
        showToast("PDF downloaded successfully!", "success");
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        showToast("Failed to generate PDF: " + error.message, "error");
    }
}