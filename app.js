// const https = require("https");
const express = require("express");
// const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;
var pg = require("pg");
require("dotenv").config();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// var sslOptions = {
// 	key: fs.readFileSync('./../key.pem'),
// 	cert: fs.readFileSync('./../certificate.pem')
// }

var connectionString = "postgresql://" + process.env.PSQL_USERNAME + ":" + process.env.PSQL_PASSWORD +
							"@" + process.env.PSQL_IP + ":" + process.env.PSQL_SOCKET + "/" + process.env.PSQL_DB;

var pgClient = new pg.Client({
  connectionString: connectionString
});
pgClient.connect();

app.post("/", (req, pres) => {
	let st = req.body.searchText;
	let sf = req.body.searchField;

	if (sf === "Title")	{
		pgClient.query("SELECT * FROM (SELECT * FROM Books WHERE Title LIKE '%" + st + "%') AS info \
						JOIN BookWordAggregates ON info.uid = BookWordAggregates.uid;", (err, res) => {
		  if (err)	{
		  	pres.send(err);
		  }
		  else	{
		  	console.log(res.rows);
		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
		});
	}

	if (sf === "Author")	{
		// reformat names into Lastname, FirstName(s)
		if (!st.includes(",") && st.split(" ").length > 1)	{
			stt = st.split(" ")[st.split(" ").length - 1] + ",";
			for (var i = 0; i < st.split(" ").length - 1; i++)	{stt += " " + st.split(" ")[i];}
			st = stt;
		}

		pgClient.query("SELECT * FROM (SELECT * FROM Writes WHERE name LIKE '%" + st + "%') AS info \
						JOIN Books ON info.uid = Books.uid;", (err, res) => {
		  if (err)	{
		  	pres.send(err);
		  }
		  else	{
		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
		});
	}

	if (sf === "Year Published")	{
		pgClient.query("SELECT * FROM Books WHERE date_published LIKE '%" + st + "%';", (err, res) => {
		  if (err)	{
		  	pres.send(err);
		  }
		  else	{
		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
		});
	}

	if (sf === "Word Count")	{
		// reformat names into Lastname, FirstName(s)
		if (!st.includes(",") && st.split(" ").length > 1)	{
			stt = st.split(" ")[st.split(" ").length - 1] + ",";
			for (var i = 0; i < st.split(" ").length - 1; i++)	{stt += " " + st.split(" ")[i];}
			st = stt;
		}

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (total_count >= " + st + " - 300 \
						AND total_count <= " + st + " + 300)) AS info JOIN Books ON info.uid = Books.uid;", (err, res) => {
		  if (err)	{
		  	pres.send(err);
		  }
		  else	{
		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
		});
	}

	if (sf === "Sentence Length")	{
		// reformat names into Lastname, FirstName(s)
		if (!st.includes(",") && st.split(" ").length > 1)	{
			stt = st.split(" ")[st.split(" ").length - 1] + ",";
			for (var i = 0; i < st.split(" ").length - 1; i++)	{stt += " " + st.split(" ")[i];}
			st = stt;
		}

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (per_sentence = " + st + ")) AS info \
						JOIN Books ON info.uid = Books.uid;", (err, res) => {
		  if (err)	{
		  	pres.send(err);
		  }
		  else	{
		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
		});
	}
});

// https.createServer(sslOptions, app).listen(port);
app.listen(port, () => console.log(`Server running on port ${port}!`));