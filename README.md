# Student's Expense Tracker 💰

A professional, responsive web application designed to help students track their daily income and expenses efficiently. This project features dynamic charts, local storage support, and print-ready report generation.

**🔗 Live Demo:** [https://vaibhavs-17.github.io/students-expense-tracker/](https://vaibhavs-17.github.io/students-expense-tracker/)

## 🚀 Key Features

### 📊 Tracking & Analytics
* **Income & Expense Tracking:** Add transactions with dynamic categories and descriptions.
* **Visual Analytics:** Interactive **Pie Charts** (Category breakdown) and **Line Graphs** (Balance over time).
* **Monthly Budget Goal:** Set a custom monthly limit and visualize spending progress with a dynamic status bar.
* **Smart Filtering:** Filter transactions by "This Month", "Last 30 Days", custom date ranges, or specific categories.

### 🎨 User Experience (UX)
* **Dark Mode:** Fully optimized dark theme that works across all cards, modals, and charts.
* **Custom Modals:** Replaced standard browser popups with sleek, themed confirmation windows for deletions and resets.
* **Interactive Empty States:** Friendly UI placeholders when no data is available, encouraging user interaction.
* **Toast Notifications:** Non-intrusive popup alerts for success and error messages.

### ⚙️ Technical & Security
* **Data Persistence:** Uses `LocalStorage` to save data instantly—your data survives browser refreshes.
* **Export Options:**
    * **PDF Report:** Generates a clean, print-friendly transaction report.
    * **CSV Export:** Downloads raw data for use in Excel/Sheets.
* **Security:** Implemented `escapeHtml` sanitization to prevent XSS (Cross-Site Scripting) attacks.
* **Mobile First:** Responsive layout that works perfectly on iPhones, Androids, and Desktops.

## 🛠️ Tech Stack

* **HTML5** - Semantic Structure
* **CSS3** - Custom Variables, Flexbox/Grid, Glassmorphism effects
* **JavaScript (ES6)** - Core Logic, DOM Manipulation, LocalStorage
* **Chart.js** - Data Visualization
* **html2pdf.js** - PDF Generation

## 📂 Project Structure

    students-expense-tracker/
    ├── index.html       # Main HTML structure
    ├── style.css        # Styling (Light/Dark mode, Print styles)
    ├── script.js        # Logic (CRUD, Charts, Modals, Security)
    └── README.md        # Documentation

## 💻 How to Run Locally

To run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/VaibhavS-17/students-expense-tracker.git](https://github.com/VaibhavS-17/students-expense-tracker.git)
    ```

2.  **Navigate to the project folder:**
    ```bash
    cd students-expense-tracker
    ```

3.  **Open `index.html`** in your browser.

## 🔮 Future Scope

* **Cloud Sync:** Moving from LocalStorage to a database (MongoDB/Firebase) for cross-device syncing.
* **User Authentication:** Implementing Login/Signup for multiple users.
* **Email Alerts:** Automated notifications when the budget limit is exceeded.
* **OCR Integration:** Scanning physical receipts to automatically add transactions.

## 👥 Project Members

**Rajiv Gandhi Institute of Technology**
*Branch: Computer Engineering*

* **Vaibhav Sable** (Roll No. 616)
* **Zaid Chouhan** (Roll No. 602)
* **Vedant Puradkar** (Roll No. 615)
* **Dnyaneshwar Sangle** (Roll No. 618)

**Submitted to:** Dr. Yogaraj S. Patil

---
*This project was built as a Mini Project for the Computer Engineering curriculum.*
