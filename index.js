const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const path = require('path');
const app = express();


app.use(cors());
app.use(express.json());

let cars = ["cars"];

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(cars);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
