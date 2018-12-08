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
	if (req.body.searchText)	{
		pres.send(basicSearch(req.body.searchText, req.body.searchField));
	}
	else if (req.body.stats)	{
		pres.send(statistics());
	}
});

function basicSearch(st, sf)	{
	if (sf === "Title")	{
		pgClient.query("SELECT * FROM (SELECT * FROM Books WHERE Title ILIKE '%" + st + "%') AS info \
						JOIN BookWordAggregates ON info.uid = BookWordAggregates.uid;", (err, res) => {
		  if (err)	{
		  	return err;
		  }
		  else	{
		  	return res.rows;	// .uid, .title, etc. to access columns
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

		pgClient.query("SELECT * FROM (SELECT * FROM Writes WHERE name ILIKE '%" + st + "%') AS info \
						JOIN Books ON info.uid = Books.uid;", (err, res) => {
		  if (err)	{
		  	return err;
		  }
		  else	{
		  	return res.rows;	// .uid, .title, etc. to access columns
		  }
		});
	}

	if (sf === "Year Published")	{
		pgClient.query("SELECT * FROM Books WHERE date_published LIKE '%" + st + "%';", (err, res) => {
		  if (err)	{
		  	return err;
		  }
		  else	{
		  	return res.rows;	// .uid, .title, etc. to access columns
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
		  	return err;
		  }
		  else	{
		  	return res.rows;	// .uid, .title, etc. to access columns
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
		  	return err;
		  }
		  else	{
		  	return res.rows;	// .uid, .title, etc. to access columns
		  }
		});
	}
}

function statistics()	{
	var statsInfo = {
		booksInfo: null,
		authorsInfo: null,
		wpsInfo: null,
		avgWordLength: null,
		wordCountInfo: null,
		commonWordsInfo: null,
		cosineAuthorsInfo: null,
		cosineBooksInfo: null,
		downloadInfo: null,
		sequencesInfo: null,
		bestRatingInfo: null,
		mostRatingInfo: null,
		totalRatingInfo: null,
		totalReviewInfo: null,
		totalUsersInfo: null
	};

	// all books info
	pgClient.query("select count(*), min(date_published), max(date_published) from Books;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.booksInfo = res.rows;
	  }
	});

	// all authors info
	pgClient.query("select count(*), min(birthdate), percentile_cont(0.05) within group (order by birthdate asc) as percentile_05, percentile_cont(0.25) within group (order by birthdate asc) as percentile_25, percentile_cont(0.50) within group (order by birthdate asc) as median, avg(birthdate),  percentile_cont(0.75) within group (order by birthdate asc) as percentile_75, percentile_cont(0.95) within group (order by birthdate asc) as percentile_95, max(birthdate) from Authors;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.authorsInfo = res.rows;
	  }
	});

	// wps
	pgClient.query("select count(*), min(per_sentence), percentile_cont(0.05) within group (order by per_sentence asc) as percentile_05, percentile_cont(0.25) within group (order by per_sentence asc) as percentile_25, percentile_cont(0.50) within group (order by per_sentence asc) as median, avg(per_sentence), percentile_cont(0.75) within group (order by per_sentence asc) as percentile_75,percentile_cont(0.95) within group (order by per_sentence asc) as percentile_95, max(per_sentence) from BookWordAggregates;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.wpsInfo = res.rows;
	  }
	});

	// avg word length
	pgClient.query("select count(*), min(avg_word_length), percentile_cont(0.05) within group (order by avg_word_length asc) as percentile_05, percentile_cont(0.25) within group (order by avg_word_length asc) as percentile_25, percentile_cont(0.50) within group (order by avg_word_length asc) as median, avg(avg_word_length), percentile_cont(0.75) within group (order by avg_word_length asc) as percentile_75, percentile_cont(0.95) within group (order by avg_word_length asc) as percentile_95, max(avg_word_length) from BookWordAggregates;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.avgWordLength = res.rows;
	  }
	});

	// total word count
	pgClient.query("select count(*), min(total_count), percentile_cont(0.05) within group (order by total_count asc) as percentile_05, percentile_cont(0.25) within group (order by total_count asc) as percentile_25, percentile_cont(0.50) within group (order by total_count asc) as median, avg(total_count), percentile_cont(0.75) within group (order by total_count asc) as percentile_75, percentile_cont(0.95) within group (order by total_count asc) as percentile_95, max(total_count) from BookWordAggregates limit;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.wordCountInfo = res.rows;
	  }
	});

	// most common words
	pgClient.query("select word, sum(frequency) from CommonWords group by word order by sum(frequency) desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.commonWordsInfo = res.rows;
	  }
	});

	// most similar authors by cosine
	pgClient.query("select author1, author2, cos_similarity from AuthorSimilarity order by cos_similarity desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.cosineAuthorsInfo = res.rows;
	  }
	});
	// most similar books by cosine
	pgClient.query("select b1.title, b2.title, cos_similarity from CosineSimilarity, Books as b1, Books as b2 where cosinesimilarity.uid1 = b1.uid and cosinesimilarity.uid2 = b2.uid order by cos_similarity desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.cosineBooksInfo = res.rows;
	  }
	});

	// most downloaded books
	pgClient.query("select title, download from Downloads, Books where Downloads.uid=Books.uid order by Download.desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.downloadInfo = res.rows;
	  }
	});

	// most popular sequences
	pgClient.query("select word, next_word, sum(times_appear) from Sequences group by word, next_word order by sum(times_appear) desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.sequencesInfo = res.rows;
	  }
	});

	// best rated books
	pgClient.query("select title, avg(rating) from userratings, books where userratings.book_id=books.uid group by uid order by avg(rating) desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.bestRatingInfo = res.rows;
	  }
	});

	// books with most ratings
	pgClient.query("select title, count(*) from Books, UserReview where Books.uid=UserReview.book_id group by uid order by count(*) desc limit 10;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.mostRatingInfo = res.rows;
	  }
	});

	// total ratings
	pgClient.query("select count(*) from UserRatings;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.totalRatingInfo = res.rows;
	  }
	});

	// total ratings
	pgClient.query("select count(*) from UserReviews", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.totalReviewInfo = res.rows;
	  }
	});

	// total users
	pgClient.query("select count(*) from Users;", (err, res) => {
	  if (err)	{
	  	return err;
	  }
	  else	{
	  	statsInfo.totalUserInfo = res.rows;
	  }
	});

	return statsInfo;
}

// https.createServer(sslOptions, app).listen(port);
app.listen(port, () => console.log(`Server running on port ${port}!`));