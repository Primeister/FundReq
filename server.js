const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);


app.use(cors());
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
app.post("/register",(req, res) => {
    let { username, name, surname, email, password, userType } = req.body;
    
    // Hash the password for security reasons
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.error("Error generating salt:", err);
            res.status(500).json({ error: "Error registering user" });
        } else {
            bcrypt.hash(password, salt, (err, hash) => {
                if(err){
                    console.error("Error hashing password:", err);
                    res.status(500).json({ error: "Error registering user" });
                }
                else {
                    password = hash;
                    const sql = `INSERT INTO ${userType} (name, surname, email, username, password) VALUES (?, ?, ?, ?, ?)`;
                    const values = [name, surname, email, username, password];
                    
                    // Checking if email has already been used
                    const sqlCheck = `SELECT * FROM ${userType} WHERE email = ?`;

                    db.get(sqlCheck, [email], (err, row) => {
                        if (err) {
                            console.error("Error checking email:", err);
                            res.status(500).json({ error: "Error registering user" });
                        } else if (!row) {
                            // No user found with the provided email
                            db.run(sql, values, function(err) {
                                if (err) {
                                    console.error("Error registering user:", err);
                                    res.status(500).json({ error: "Error registering user" });
                                } else {
                                    res.status(201).json({ message: "User registered successfully", userId: this.lastID });
                                }
                            });
                        } else {
                            console.error("Email already used, try signing in.");
                            res.status(500).json({ error: "Email already used, try signing in." });
                        }
                    });
                }
            });
        }
    });
});



// Route to serve the login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route to handle user login
app.post("/login", (req, res) => {
    let { username, password, userType } = req.body;

    //hashing the password for security reasons
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            if(err){
                console.log(err);
            }
            else{
                password = hash;
                console.log(password);
            }
        });
    });

    // Check if the email and password match a user in the database
    const sql = `SELECT * FROM ${userType} WHERE username = ? AND password = ?`;
    const values = [username, password];

    db.get(sql, values, (err, row) => {
        if (err) {
            console.error("Error logging in:", err);
            res.status(500).json({ error: "Error logging in" });
        } else if (!row) {
            // No user found with the provided email and password
            res.status(401).json({ error: "Invalid username or password" });
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
