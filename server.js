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
        let {name, type, description, requirements, deadline, amount} = req.body;
        const values = [name, type, description, requirements, deadline, id, amount];
    
        // Run the update query
        const sql = `INSERT INTO FundingOpportunity (FundingName, FundingType, FundingDescription, Requirements, Deadline, FundManager, Amount) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, values, function(err) {
            if (err) {
                console.error("Error posting funding opportunity:", err);
                res.status(500).json({ error: "Error posting funding opportunity" });
            } else {
                res.status(201).json({ message: "Funding opportunity posted successfully"});
            }
            });
         });


//Route to handle aplication form        
 app.post('/application/post', (req, res) => {
     const id = req.params.id;
     const status = "processing";
   
     const f_name = "none"
    /*
     const surname = "v ";
     const firstname = "m";
     const mobile = "011";
     const email ="@g";
     const id_number = "0000"
     const dob= "2000";
     const citizenship = "SA" ;*/
     let { surname, firstname, mobile, email, id_number, dob, citizenship, funding_name } = req.body;
     const values = [surname, firstname, mobile, email, id_number, dob, citizenship, status , funding_name ];

     // Run the update query
     const sql = `INSERT INTO form (surname , firstName, mobile, email, id_number, dob, citizenship , status , funding_name) VALUES (?, ?, ?, ?, ?, ?, ? ,? , ?)`;
     db.run(sql, values, function(err) {
         if (err) {
             console.error("Error inserting data into database:", err);
             res.status(500).json({ error: "Error inserting data into database" });
         } else {
             res.status(201).json({ message: `Data inserted successfully ${values.firstname}` });
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
                res.status(200).json({ message: "User logged in successfully", user: row, userType: table});
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

app.put('/update/total/amount/:id', (req, res) => {
     const id = req.params.id;
      const newValue = req.body.amount; // Assuming the new value is passed in the request body 

    // Run the update query
 const sql = `UPDATE funders SET Funds = ? WHERE email = ?`;
    db.run(sql, [newValue, id], function(err) {
     if (err) {
        return res.status(500).json({ error: err.message });
     }
     res.json({
         message: "Field updated successfully", changes: this.changes // Number of rows affected
     });
     });
});

app.put('/update/amount/:FundingName', (req, res) => {
     const fundingName = req.params.FundingName;
      const newValue = req.body.amount; // Assuming the new value is passed in the request body 

    // Run the update query
 const sql = `UPDATE FundingOpportunity SET Amount = ? WHERE FundingName = ?`;
    db.run(sql, [newValue, fundingName], function(err) {
     if (err) {
        return res.status(500).json({ error: err.message });
     }
     res.json({
         message: "Field updated successfully", changes: this.changes // Number of rows affected
     });
     });
});

// Route to retrieve funder information by email
app.get('/funder/:email', (req, res) => {
    const email = req.params.email;
    const sql = `SELECT * FROM funders WHERE email = ?`;
    
    db.get(sql, [email], (err, row) => {
        if (err) {
            console.error("Error retrieving funder information:", err);
            res.status(500).json({ error: "Error retrieving funder information" });
        } else if (!row) {
            res.status(404).json({ error: "Funder not found" });
        } else {
            res.json(row);
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

//endpoint to retrieve a fund manager's information using the funding opportunity they manage
app.get('/fundManager/:fundingOppName', (req, res) =>{
    const fundingOppName = req.params.fundingOppName;

    const sql = `SELECT FundManager FROM FundingOpportunity WHERE FundingName = ?`;
    //execute the sql query
    db.all(sql, [fundingOppName], (err, rows)=>{
        if(err){
            console.error("Error retrieving fund manager information");
            res.status(500).json({error:"Error retrieving data"});
        }else{
            //if data found, send the response
            res.json(rows);
        }
    });
});

// Route to retrieve information about applications
app.get('/applications/:funding_name', (req,res)=>{
    const fundingOppName = req.params.funding_name;

    const sql = `SELECT * FROM form WHERE funding_name=?`;
    //execute the sql query
    db.all(sql, [fundingOppName], (err, rows)=>{
        if(err){
            console.error("Error retrieving applications for funding opportunity");
            res.status(500).json({error:"Error retrieving data"});
        }else{
            //if data found, send the response
            res.json(rows);
        }
    });
});

app.get('/applications/:funding_name/:applicant_email/accept', (req,res)=>{
    const fundingOppName = req.params.funding_name;
    const applicantEmail = req.params.applicant_email;


    const sql = `UPDATE form SET status="Approved" WHERE funding_name=? AND email=?`;
    //execute the sql query
    db.all(sql, [fundingOppName, applicantEmail], (err, rows)=>{
        if(err){
            console.error("Error retrieving applications for funding opportunity");
            res.status(500).json({error:"Error retrieving data"});
        }else{
            //if data found, send the response
            res.json(rows);
            console.log("accepted");
        }
    });
});

app.get('/applications/:funding_name/:applicant_email/reject', (req,res)=>{
    const fundingOppName = req.params.funding_name;
    const applicantEmail = req.params.applicant_email;


    const sql = `UPDATE form SET status="Rejected" WHERE funding_name=? AND email=?`;
    //execute the sql query
    db.all(sql, [fundingOppName, applicantEmail], (err, rows)=>{
        if(err){
            console.error("Error retrieving applications for funding opportunity");
            res.status(500).json({error:"Error retrieving data"});
        }else{
            //if data found, send the response
            res.json(rows);
            console.log("rejected");
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port${PORT}`);
});

app.get('/getOpportunity/:type', (req, res) => {
    const type = req.params.type;
    const query = 'SELECT * FROM FundingOpportunity WHERE FundingType = ?';

    db.all(query, [type], (err, rows) => {
        if (err) {
            console.error("Error retrieving funding opportunities:", err);
            res.status(500).json({ error: "Error retrieving funding opportunities" });
        } else {
            res.json(rows);
        }
    });
});

// Route to delete a funding opportunity
app.delete('/deletefundOpp/:id', (req, res) => {
    const id = req.params.id;

    // Delete the funding opportunity from the FundingOpportunity table
    const deleteFundingOpportunityQuery = 'DELETE FROM FundingOpportunity WHERE id = ?';

    db.run(deleteFundingOpportunityQuery, [id], function(err) {
        if (err) {
            console.error("Error deleting funding opportunity:", err);
            res.status(500).json({ error: "Error deleting funding opportunity" });
            return;
        }

        // Delete associated applications from the form table based on the funding opportunity id
        const deleteApplicationsQuery = 'DELETE FROM form WHERE funding_name = ?';

        db.run(deleteApplicationsQuery, [id], function(err) {
            if (err) {
                console.error("Error deleting associated applications:", err);
                res.status(500).json({ error: "Error deleting associated applications" });
                return;
            }

            // Success message if deletion operations are successful
            res.json({ message: "Funding opportunity and associated applicants deleted successfully" });
        });
    });
});

// Route to modify a funding opportunity
app.put('/modifyFundOpp/:name', (req, res) => {
    const fundingOppName = req.params.name;
    const { aspect, newValue } = req.body; // Assuming the aspect and new value are passed in the request body

    // Run the update query based on the specified aspect
    let sql;
    switch (aspect) {
        case 'name':
            sql = `UPDATE FundingOpportunity SET FundingName = ? WHERE FundingName = ?`;
            break;
        case 'description':
            sql = `UPDATE FundingOpportunity SET FundingDescription = ? WHERE FundingName = ?`;
            break;
        case 'requirements':
            sql = `UPDATE FundingOpportunity SET Requirements = ? WHERE FundingName = ?`;
            break;
        case 'deadline':
            sql = `UPDATE FundingOpportunity SET Deadline = ? WHERE FundingName = ?`;
            break;
        default:
            return res.status(400).json({ error: 'Invalid aspect provided' });
    }

    db.run(sql, [newValue, fundingOppName], function(err) {
        if (err) {
            console.error("Error modifying funding opportunity:", err);
            res.status(500).json({ error: "Error modifying funding opportunity" });
        } else {
            res.json({ message: "Funding opportunity modified successfully" });
        }
    });
});

// Endpoint to fetch notifications for a specific fund manager
app.get('/notifications/:fundManagerEmail', (req, res) => {
    const fundManagerEmail = req.params.fundManagerEmail;

    // Log the received email
    console.log(`Retrieving notifications for: ${fundManagerEmail}`);

    const sql = `SELECT * FROM Notifications WHERE fundManagerEmail = ? ORDER BY timestamp DESC`;
    db.all(sql, [fundManagerEmail], (err, rows) => {
        if (err) {
            console.error("Error retrieving notifications:", err);
            res.status(500).json({ error: "Error retrieving notifications" });
        } else {
            // Log the retrieved rows
            console.log(`Notifications retrieved: ${JSON.stringify(rows)}`);
            res.json(rows);
        }
    });
});


// Endpoint to add a new notification
app.post('/notifications/add', (req, res) => {
    const { fundManagerEmail, fundOppName, applicantName } = req.body;

    const notificationValues = [fundManagerEmail, fundOppName, applicantName];

    const sqlNotification = `INSERT INTO Notifications (fundManagerEmail, fundOppName, applicantName) VALUES (?, ?, ?)`;
    db.run(sqlNotification, notificationValues, function(err) {
        if (err) {
            console.error("Error inserting notification into database:", err);
            res.status(500).json({ error: "Error inserting notification into database" });
        } else {
            res.status(201).json({ message: "Notification added successfully" });
        }
    });
});
