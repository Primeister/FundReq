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
    });
});

app.get('/fundManagers', (req, res) => {
  db.all("SELECT * FROM funders where status IS NULL", (err, rows) => {
        if (err) {
            console.error("Error retrieving profiles:", err);
            res.status(500).json({ error: "Error retrieving profiles" });
        } else {
            res.json(rows);
        }
    });
});

app.get('/fundManagers/:id', (req, res) => {
    const id = req.params.id;
    // Assuming the new value is passed in the request body 

    // Run the update query
    const sql = `SELECT * FROM funders WHERE email = ?`;
    db.get(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
      else{
            res.json(rows);
          }
        });
    });

app.post('/fundManagers/advert/post/:id', (req, res) => {
        const id = req.params.id;
        let {name, type, description, requirements} = req.body;
        const values = [name, type, description, requirements, deadline, id];
    
        // Run the update query
        const sql = `INSERT INTO FundingOpportunity (FundingName, FundingType, FundingDescription, Requirements, FundManager) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, values, function(err) {
            if (err) {
                console.error("Error posting funding opportunity:", err);
                res.status(500).json({ error: "Error posting funding opportunity" });
            } else {
                res.status(201).json({ message: "Funding opportunity posted successfully"});
            }
            });
         });



// Route to handle user registration
app.post("/register",(req, res) => {
    let { name, surname, email, userType} = req.body;
    
    const sql = `INSERT INTO ${userType} (name, surname, email) VALUES (?, ?, ?)`;
    const values = [name, surname, email];
                    
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
                    res.status(201).json({ message: "User registered successfully", userId: this.lastID, user: { name, surname, email, userType}});
                }
            });
        } else {
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
                        const index = tables.indexOf(table);
                        if (index === tables.length - 1) {
                            // User not found in any table
                            res.status(401).json({ error: "Invalid username or password" });
                        } else {
                            // Check next table
                            checkLogin(tables[index + 1]);
                        }
                    } else {
                        // User found, send success response
                        res.status(200).json({ message: "User registered successfully", user: {...row, userType: table}});
                    }
                });
            };
            
            
            // Start login check with the first table
            checkLogin(tables[0]);
                
        }
    });
});




// Route to serve the login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route to handle user login
app.post("/login", (req, res) => {
    let { email } = req.body;

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
                const index = tables.indexOf(table);
                if (index === tables.length - 1) {
                    // User not found in any table
                    res.status(401).json({ error: "Invalid username or password" });
                } else {
                    // Check next table
                    checkLogin(tables[index + 1]);
                }
            } else {
                // User found, send success response
                res.status(200).json({ message: "User logged in successfully", user: row });
            }
        });
    }
    
    
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
         message: "Field updated successfully", changes: this.changes // Number of rows affected
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

// Route to retrieve information about funding opportunities
app.get('/fundingOpportunities/:FundManager', (req, res) => {
    const fundManager= req.params.FundManager;

    // SQL query to retrieve funding opportunities associated with the specified fund manager
    const sql = `SELECT * FROM FundingOpportunity WHERE FundManager=?`;

    // Execute the SQL query
    db.all(sql, [fundManager], (err, rows) => {
        if (err) {
            console.error("Error retrieving funding opportunities for fund manager:", err);
            res.status(500).json({ error: "Error retrieving data" });
        } else {
            // If data found, send the response
            res.json(rows);
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port${PORT}`);
});

