# 📊 Attendance Tracker (Web)

A clean, mobile‑first web application to quickly mark student attendance, generate PDFs, and share attendance instantly.

Built using **HTML, CSS, and Vanilla JavaScript**.

---

## 👤 Author

**Aditya Bhardwaj**
B.Tech – Computer Science & Engineering
Section: D2
Roll No: 07

---

## ✨ Features

### 🎯 Core Features

* Interactive roll‑number based attendance marking
* Tap/click circles to mark students **present**
* Green = Present, Default = Absent
* Mobile‑friendly UI

### 🔍 Search & Productivity

* Search by **roll number only**
* Press **Enter** to mark the first matched roll number present
* Fast keyboard + mobile workflow

### ⏰ Smart Utilities

* Live **date & time** display
* Optional **subject input**
* Subject + date + time automatically added to PDF filename

### 📄 Export & Sharing

* Generate **multi‑page PDF attendance reports**
* Automatic page breaks (no missing students)
* Live attendance console showing present roll numbers

  Example:

  ```
  7,36,44,46
  ```
* One‑click **Copy to Clipboard** for quick sharing

---

## 🚀 How to Run (Important)

This project uses `fetch()` to load student data, so it must be run via a local server.

### ✅ Recommended (VS Code – Live Server)

1. Open the project folder in **VS Code**
2. Install the **Live Server** extension
3. Right‑click `index.html` → **Open with Live Server**
4. Open on mobile using the same Wi‑Fi network

### ❌ Do Not

Opening `index.html` directly by double‑clicking may break JSON loading.

---

## 📁 Project Structure

```
attendance-app/
│
├── index.html              # Main UI
├── README.md               # Documentation
│
├── assets/
│   ├── css/
│   │   └── style.css       # Modern dark UI styles
│   └── js/
│       ├── students.js    # Data loading
│       ├── app.js         # Attendance logic
│       └── pdf.js         # PDF generation
│
└── data/
    └── students.json      # Student list
```

---

## 🎮 How to Use

1. Open the app
2. Tap roll numbers to mark students **present**
3. Use the search bar to quickly find roll numbers
4. Press **Enter** to mark attendance instantly
5. Copy attendance from the console OR
6. Download a professional **PDF report**

---

## ⌨️ Keyboard Shortcuts

| Action             | Shortcut     |
| ------------------ | ------------ |
| Search roll number | Type number  |
| Mark first result  | Enter        |
| Copy attendance    | Copy button  |
| Reset attendance   | Reset button |

---

## 🛠️ Built With

* HTML5
* CSS3 (Grid + Flexbox)
* JavaScript (ES6)
* jsPDF (for PDF generation)

No frameworks. No backend. No database.

---

## 🔒 Privacy

* 100% client‑side
* No server required
* No tracking or analytics
* Data never leaves your device

---

## 🚧 Current Limitations

* No backend storage
* No login system
* No cloud sync
* No CSV export (yet)

---

## 🌱 Future Improvements

* Attendance percentage
* Date‑wise history
* CSV export
* PWA (installable app)
* Name‑based search

---

## 📜 License

This project is licensed under the **MIT License**.

---

## ⭐ Final Note

This project was built as a **practical, real‑world attendance tool** and demonstrates:

* Clean UI design
* Strong JavaScript fundamentals
* Real problem‑solving (PDF pagination, UX shortcuts)

**Made with focus and consistency by Aditya Bhardwaj**
*Simple tools. Real utility.*
