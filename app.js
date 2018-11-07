const express = require('express');
const app = express();
const port = 3001;
var pg = require('pg');
require('dotenv').config();

var connectionString = 'postgresql://' + process.env.PSQL_USERNAME + ':' + process.env.PSQL_PASSWORD +
							'@' + process.env.PSQL_IP + ':' + process.env.PSQL_SOCKET + '/' + process.env.PSQL_DB;

var pgClient = new pg.Client({
  connectionString: connectionString
});
pgClient.connect();

pgClient.query('SELECT * FROM ' + 'Books' + ' LIMIT(100);', (err, res) => {
  if (err)	{
  	console.log(err.stack);
  }
  else	{
  	console.log(res.rows[0]);	// .uid, .title, etc. to access columns
  }
});

app.get('/', (req, res) => {
	// handle get requests
	// if tree to see what the query is asking for
});

app.listen(port, () => console.log(`Server running on port ${port}!`));