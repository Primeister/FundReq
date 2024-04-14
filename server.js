const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let cars = ["cars"];

app.get('/', (req, res) => {
  db.all("SELECT * FROM applicants", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });;
});

// Route to handle user registration
app.post("/register", (req, res) => {
    const { username, name, surname, email, password, userType } = req.body;
    const sql = `INSERT INTO ${userType} (name, surname, email, username, password) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, surname, email, username, password];

    console.log(values);

    db.run(sql, values, function(err) {
        if (err) {
            console.error("Error registering user:", err);
            res.status(500).json({ error: "Error registering user" });
        } else {
            res.status(201).json({ message: "User registered successfully", userId: this.lastID });
        }
    });
});

// Route to retrieve profiles
app.get("/profiles", (req, res) => {
    db.all("SELECT * FROM profiles", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });
});
// Route to serve the login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route to handle user login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Check if the email and password match a user in the database
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    const values = [email, password];

    db.get(sql, values, (err, row) => {
        if (err) {
            console.error("Error logging in:", err);
            res.status(500).json({ error: "Error logging in" });
        } else if (!row) {
            // No user found with the provided email and password
            res.status(401).json({ error: "Invalid email or password" });
        } else {
            // User authenticated successfully
            res.status(200).json({ message: "Login successful", userId: row.id });
        }
    });
});

// Route to retrieve profiles
app.get("/profiles", (req, res) => {
    db.all("SELECT * FROM profiles", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port${PORT}`);
});
