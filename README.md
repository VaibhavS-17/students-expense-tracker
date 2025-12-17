# Student's Expense Tracker 💰

A professional, responsive Progressive Web App (PWA) designed to help students track their daily income and expenses efficiently. This project features dynamic charts, local storage persistence, and smart reporting tools.

**🔗 Live Demo:** [https://vaibhavs-17.github.io/students-expense-tracker/](https://vaibhavs-17.github.io/students-expense-tracker/)

## 🚀 Key Features

### 📱 Progressive Web App (PWA)
* **Installable:** Can be installed as a native app on Android, iOS, and Desktop.
* **Offline Support:** Works without internet access using Service Worker caching.
* **App-Like Experience:** Full-screen immersive UI with no browser bars.

### 📊 Smart Tracking & Analytics
* **Visual Analytics:** Interactive **Pie Charts** (Category breakdown) and **Line Graphs** (Balance over time) using Chart.js.
* **Monthly Budget Goal:** Set a custom monthly limit with a dynamic progress bar that changes color as you near the limit.
* **Context-Aware Exports:** PDF and CSV exports automatically respect your current active filters (e.g., if you filter for "Food", the report only shows Food).

### ⚡ Power User Features
* **Keyboard Shortcuts:**
    * Press **`/`** to instantly focus the search bar.
    * Press **`Ctrl + Enter`** to submit a new transaction.
    * Press **`Esc`** to clear filters or close modals.
* **Smart CSV:** Exports data with UTF-8 BOM encoding, making it 100% compatible with Microsoft Excel.

### 🎨 User Experience (UX)
* **Dark Mode:** Fully optimized dark theme that toggles instantly across all UI elements.
* **Input Sanitization:** Security protection against XSS attacks using `escapeHtml`.
* **Custom Modals & Toasts:** Replaced annoying browser alerts with sleek, custom-designed popup notifications.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism, Grid/Flexbox), JavaScript (ES6+)
* **PWA:** Web Manifest, Service Workers
* **Libraries:** Chart.js (Visualization), jsPDF (PDF Generation)
* **Storage:** Browser LocalStorage (No database required)

## 📂 Project Structure

    students-expense-tracker/
    ├── index.html         # Main App Interface
    ├── style.css          # Responsive Styling & Dark Mode
    ├── script.js          # Core Logic (CRUD, PWA, Charts, PDF)
    ├── manifest.json      # PWA Configuration
    ├── service-worker.js  # Offline Caching Logic
    └── README.md          # Documentation

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
    * *Note: For PWA features to work locally, use a live server (e.g., VS Code "Go Live").*

## 🔮 Future Scope

* **☁️ Cloud Sync & Multi-User Support:** Migrating from LocalStorage to a cloud database (Firebase/MongoDB) to allow users to access their data across multiple devices and support group accounts.
* **🤝 Group Expense Splitting:** Implementing a "Split Bill" feature for students to manage shared costs (canteens, projects, trips) and track debts.
* **🤖 AI-Powered Insights:** Using Machine Learning to predict next month's budget based on historical spending patterns and suggesting areas to save money.
* **🗣️ Voice Commands:** Integrating the Web Speech API to allow users to add transactions via voice (e.g., *"Spent 100 on Travel"*).
* **📄 Automated Receipt Scanning:** Integration of OCR (Optical Character Recognition) to scan physical bills and automatically extract the date, amount, and category.

## 👥 Project Members

**Rajiv Gandhi Institute of Technology**
*Branch: Computer Engineering*

* **Vaibhav Sable** (Roll No. 616)
* **Zaid Chouhan** (Roll No. 602)
* **Vedant Puradkar** (Roll No. 615)
* **Dnyaneshwar Sangle** (Roll No. 618)

**Submitted to:** Dr. Yogaraj S. Patil

---
*Built with ❤️ for the Computer Engineering Mini Project.*
