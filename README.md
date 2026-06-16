# BigQuery Release Pulse 🚀

[![Flask](https://img.shields.io/badge/Flask-3.1.2-green.svg)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.10-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#license)

**BigQuery Release Pulse** is a premium, high-fidelity developer utility that fetches, parses, and segments the official Google Cloud BigQuery release notes XML feed. Built using a **Python Flask backend** and **plain vanilla HTML, CSS, and JavaScript** on the frontend, it turns daily release blocks into modular, interactive, and shareable updates.

👉 **GitHub Repository**: [harsh313-B/The_Hall_for_event_talks-app](https://github.com/harsh313-B/The_Hall_for_event_talks-app)

---

## 🌟 Key Features

*   **Granular Release Breakdown**: Parses daily release notes and splits them into distinct cards based on category (Features, Issues, Changes, Deprecations).
*   **Modern Glassmorphic UI**: Beautiful dark-mode dashboard styled with custom CSS gradients, floating neon glow blobs, and high-fidelity micro-interactions.
*   **Instant Real-Time Filtering**: Zero-reload search matching and category chips (Features, Issues, Changes, Deprecations).
*   **Dynamic Tweet Composer**:
    *   Interactive modal overlay with live character validation.
    *   Simulates X/Twitter's native counting engine (mapping all URLs to exactly 23 characters).
    *   Circular SVG progress ring indicator showing space remaining.
    *   Direct integration with X/Twitter Web Intents.
*   **One-Click Copy Utility**: Easily copy plain text versions of release notes with animated slide-in toast notifications.
*   **Fault-Tolerant Cache**: Backend fallback keeps serving cached logs if Google Cloud's RSS server suffers an outage.

---

## 📁 Project Directory Structure

```text
bigquery-release-notes/
│
├── app.py                      # Flask Application Server & Feed Parser
├── test_parser.py              # Local XML Parser Verification Script
├── bigquery-release-notes.xml  # Downloaded Feed XML Sample
├── .gitignore                  # Git Ignore configuration
├── README.md                   # Project Documentation
│
├── templates/
│   └── index.html              # Main HTML5 Layout Template
│
└── static/
    ├── css/
    │   └── styles.css          # Styling System & Keyframe Animations
    └── js/
        └── app.js              # State Controller, Filter Engine, & Tweet Composer
```

---

## 🚀 Setup & Installation

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have Python 3.10+ installed on your system.

### 2. Install Dependencies
You will need `Flask`, `requests`, and `beautifulsoup4`. Install them using pip:
```bash
pip install Flask requests beautifulsoup4
```

### 3. Run the Server
Launch the Flask development server:
```bash
python3 app.py
```
By default, the application runs on port `5000`.

### 4. Access the Dashboard
Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛠️ Usage Guide

1.  **Sync Feed**: Click **"Refresh Release Notes"** in the hero section or the sync icon in the top header to retrieve the latest notes from Google Cloud.
2.  **Filter Cards**: Use the category chips (`Features`, `Issues`, `Changes`, `Deprecations`) to filter cards instantly.
3.  **Search updates**: Type keywords into the search box to find specific releases. Click the cross icon to clear the search query.
4.  **Copy Text**: Click **"Copy"** on any card. The text is copied to your clipboard, and a green success notification slide-in toast appears.
5.  **Share to X/Twitter**: 
    *   Click **"Tweet"** on any card to open the Composer modal.
    *   Review, edit, or customize your message.
    *   Observe the progress indicator ring (which turns yellow/red if the 280-character limit is breached).
    *   Click **"Post to X/Twitter"** to open X's share editor in a new window.

---

## ⚖️ License
This project is open-source and licensed under the MIT License.
