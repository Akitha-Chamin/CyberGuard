const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection (XAMPP MySQL) ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP user
    password: '',      // Default XAMPP password is empty
    database: 'cyberguard'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err);
    } else {
        console.log('✅ Connected to XAMPP MySQL Database');
    }
});

// --- API Routes ---

// 1. POST: Submit Report
app.post('/api/report', (req, res) => {
    const data = req.body;

    // Logic to auto-assign severity
    let severity = "LOW";
    const desc = data.description.toLowerCase();
    if(desc.includes('ransom') || desc.includes('encrypt') || desc.includes('ddos')) {
        severity = "CRITICAL";
    } else if (desc.includes('phishing') || desc.includes('fraud')) {
        severity = "MEDIUM";
    }

    const sql = `INSERT INTO incidents (type, date, time, system, description, severity) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [data.type, data.date, data.time, data.system, data.description, severity];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ success: false, message: "Database Error" });
        } else {
            // Create a fancy display ID based on the SQL ID (e.g., CYB-1001)
            const displayId = "CYB-" + (1000 + result.insertId);
            res.json({ success: true, id: displayId, message: "Report Saved" });
        }
    });
});

// 2. GET: Fetch All Incidents
app.get('/api/incidents', (req, res) => {
    const sql = "SELECT * FROM incidents ORDER BY created_at DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ message: "Error fetching data" });
        } else {
            res.json(results);
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});