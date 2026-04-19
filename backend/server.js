const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'available',
            price REAL NOT NULL,
            booked_until TEXT,
            customer_name TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                // Initialize with some dummy data if empty
                db.get("SELECT COUNT(*) AS count FROM rooms", (err, row) => {
                    if (row && row.count === 0) {
                        const insert = 'INSERT INTO rooms (name, type, status, price) VALUES (?, ?, ?, ?)';
                        const insertBooked = 'INSERT INTO rooms (name, type, status, price, booked_until, customer_name) VALUES (?, ?, ?, ?, ?, ?)';
                        db.run(insert, ['Room 101', 'Single', 'available', 50]);
                        db.run(insert, ['Room 102', 'Double', 'available', 80]);
                        db.run(insert, ['Room 201', 'Suite', 'available', 150]);
                        db.run(insertBooked, ['Room 202', 'Double', 'booked', 80, '2026-04-25', 'John Doe']);
                    }
                });
            }
        });
    }
});

// API Endpoints

// Get all rooms
app.get('/api/rooms', (req, res) => {
    const sql = "SELECT * FROM rooms";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Add a new room
app.post('/api/rooms', (req, res) => {
    const { name, type, price } = req.body;
    if (!name || !type || !price) {
        return res.status(400).json({"error": "Please provide name, type, and price"});
    }
    const sql = 'INSERT INTO rooms (name, type, status, price) VALUES (?, ?, ?, ?)';
    const params = [name, type, 'available', price];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, name, type, status: 'available', price }
        });
    });
});

// Book a room
app.put('/api/rooms/:id/book', (req, res) => {
    const { customer_name, booked_until } = req.body;
    if (!customer_name || !booked_until) {
         return res.status(400).json({"error": "Please provide customer_name and booked_until"});
    }
    const sql = `UPDATE rooms SET status = 'booked', customer_name = ?, booked_until = ? WHERE id = ?`;
    const params = [customer_name, booked_until, req.params.id];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error": res.message});
            return;
        }
        res.json({
            message: "success",
            data: { id: req.params.id, status: 'booked', customer_name, booked_until }
        });
    });
});

// Checkout a room
app.put('/api/rooms/:id/checkout', (req, res) => {
    const sql = `UPDATE rooms SET status = 'available', customer_name = NULL, booked_until = NULL WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({"error": res.message});
            return;
        }
        res.json({
            message: "success",
            data: { id: req.params.id, status: 'available' }
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
