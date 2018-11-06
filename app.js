const express = require('express');
const app = express();
const port = 3001;
var pg = require('pg');
require('dotenv').config();

var connectionString = "postgres://" + process.env.PSQL_USERNAME + ":" + process.env.PSQL_PASSWORD + "@serverName/" + process.env.PSQL_IP + ":5432/ldb";
var pgClient = new pg.Client(connectionString);

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Server running on port ${port}!`));