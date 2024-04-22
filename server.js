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
  db.all("SELECT * FROM funders", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });;
});

app.get('/fundManagers', (req, res) => {
  db.all("SELECT * FROM funders where status IS NULL", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });;
});

app.get('/fundManagers/:id', (req, res) => {
    const id = req.params.id;
     // Assuming the new value is passed in the request body 

    // Run the update query
    const sql = `SELECT * FROM funders WHERE email = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
      else{
            res.json(rows);
          }
        });
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
    let username;
    let { email, password } = req.body;

    // Define tables to check
    const tables = ['funders', 'applicants', 'admins'];

    // Function to perform login check for a specific table
    const checkLogin = (table) => {
        const sql = `SELECT * FROM ${table} WHERE email = ?`;
        const values = [email];

        db.get(sql, values, (err, row) => {
            if (err) {
                console.error("Error logging in:", err);
                res.status(500).json({ error: "Error logging in" });
            } else if (!row) {
                // User not found in this table
                if (table === tables[tables.length - 1]) {
                    // User not found in any table
                    res.status(401).json({ error: "Invalid username or password" });
                } else {
                    // Check next table
                    checkLogin(tables[tables.indexOf(table) + 1]);
                }
            } else {
                // User found in this table, compare passwords
                bcrypt.compare(password, row.password, (err, result) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        res.status(500).json({ error: "Error logging in" });
                    } else if (result) {
                        // Passwords match, user authenticated successfully
                        res.status(200).json({ message: "Login successful", userId: row.id, userType: table, username: row.username });
                    } else {
                        // Passwords don't match
                        res.status(401).json({ error: "Invalid username or password" });
                    }
                });
            }
        });
    };

    // Start login check with the first table
    checkLogin(tables[0]);
});

// Define a route to handle the update operation
app.put('/update/status/:id', (req, res) => {
    const id = req.params.id;
    const newValue = req.body.newValue; // Assuming the new value is passed in the request body 

    // Run the update query
    const sql = `UPDATE funders SET status = ? WHERE id = ?`;
    db.run(sql, [newValue, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "Field updated successfully",
            changes: this.changes // Number of rows affected
        });
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
