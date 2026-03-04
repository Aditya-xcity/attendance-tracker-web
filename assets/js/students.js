// students.js
let students = [];

// Fetch students from JSON file
fetch("data/students.json")
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load students data');
        }
        return response.json();
    })
    .then(data => {
        students = data;
        // Initialize app after loading students
        if (typeof initApp === 'function') {
            initApp();
        }
    })
    .catch(error => {
        console.error('Error loading students:', error);
        // Fallback data if JSON fails to load
        students = Array.from({length: 61}, (_, i) => ({
            rollNo: i + 1,
            name: `Student ${i + 1}`
        }));
        if (typeof initApp === 'function') {
            initApp();
        }
    });