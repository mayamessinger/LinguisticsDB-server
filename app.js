// const https = require("https");
const express = require("express");
// const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;
var pg = require("pg");
var rp = require("request-promise");
var cheerio = require("cheerio");
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
	if (req.body.basicSearch)	{
		basicSearch(req.body.searchText, req.body.searchField, pres);
	}
	else if (req.body.advancedSearch)	{
		advancedSearch(req.body, pres);
	}
	else if (req.body.stats)	{
		statistics(pres);
	}
	else if (req.body.profile)	{
		profile(req.body.username, pres);
	}
	else if (req.body.changePW)	{
		changePassword(req.body.username, req.body.oldPW, req.body.newPW, pres);
	}
	else if (req.body.login)	{
		login(req.body.username, req.body.password, pres);
	}
	else if (req.body.makeUser)	{
		makeUser(req.body.username, req.body.email, req.body.password, pres);
	}
	else if (req.body.book)	{
		book(req.body.book_id, pres);
	}
	else if (req.body.rate)	{
		rate(req.body.username, req.body.book_id, req.body.rating, pres);
	}
	else if (req.body.rev)	{
		review(req.body.username, req.body.book_id, req.body.review, pres);
	}
});

function basicSearch(st, sf, pres)	{
	if (sf === "Title")	{
		pgClient.query("SELECT * FROM (SELECT * FROM Books WHERE Title ILIKE $1) AS info JOIN BookWordAggregates ON info.uid = BookWordAggregates.uid JOIN Writes ON info.uid = Writes.uid;", ["%" + st + "%"], (err, res) => {
				if (err)	{
					return err;
				}
				else	{
			  	pres.send(res.rows);	// .uid, .title, etc. to access columns
			  }
		});
	}

	if (sf === "Author")	{
		// reformat names into Lastname, FirstName(s)
		if (!st.includes(",") && st.split(" ").length > 1)	{
			stt = st.split(" ")[st.split(" ").length - 1] + ",";
			for (var i = 0; i < st.split(" ").length - 1; i++)	{
				stt += " " + st.split(" ")[i];
			}
			st = stt;
		}

		pgClient.query("SELECT * FROM (SELECT * FROM Writes WHERE name ILIKE $1) AS info JOIN Books ON info.uid = Books.uid;", ["%" + st + "%"], (err, res) => {
				if (err)	{
					return err;
				}
				else	{
			  	pres.send(res.rows);	// .uid, .title, etc. to access columns
			  }
		});
	}

	if (sf === "Year Released")	{
		pgClient.query("SELECT * FROM Books WHERE date_published LIKE $1;", ["%" + st + "%"], (err, res) => {
			if (err)	{
				return err;
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

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (total_count >= $1 - 300 \
			AND total_count <= $1 + 300)) AS info JOIN Books ON info.uid = Books.uid;", [st], (err, res) => {
				if (err)	{
					return err;
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

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (per_sentence = $1)) AS info \
			JOIN Books ON info.uid = Books.uid;", [st], (err, res) => {
				if (err)	{
					return err;
				}
				else	{
			  	pres.send(res.rows);	// .uid, .title, etc. to access columns
			  }
		});
	}
}

function advancedSearch(args, pres)	{
	var values = ["%" + args.titleLike + "%", "%" + args.authorLike + "%", args.bdLow, args.bdHigh, args.wpsLow, args.wpsHigh, args.wcLow, args.wcHigh, args.wlLow, args.wlHigh];

	var query = "SELECT books.uid, books.title, books.link_to_book, authors.name, bookwordaggregates.total_count, avg(userratings.rating) as rating FROM books FULL OUTER JOIN writes ON books.uid = writes.uid FULL OUTER JOIN authors ON authors.name = writes.name FULL OUTER JOIN bookwordaggregates ON books.uid = bookwordaggregates.uid FULL OUTER JOIN downloads ON books.uid = downloads.uid FULL OUTER JOIN userratings ON books.uid = userratings.book_id";

	if (args.wordsContained)	{
		query += " FULL OUTER JOIN commonwords ON books.uid=commonwords.uid";
	}

	if (args.similarTo)	{
		query += " FULL OUTER JOIN cosinesimilarity ON books.uid=cosinesimilarity.uid1";
	}

	query += " where books.title ILIKE $1 and authors.name ILIKE $2 and authors.birthdate > $3 and authors.birthdate < $4 and bookwordaggregates.per_sentence > $5 and bookwordaggregates.per_sentence < $6 and bookwordaggregates.total_count > $7 and bookwordaggregates.total_count < $8 and bookwordaggregates.avg_word_length > $9 and bookwordaggregates.avg_word_length < $10";

	if (args.freqWords)	{
		args.freqWords.split(",").forEach(word =>	{
			values.push(word.trim());

			query += " AND CommonWords.word ILIKE $" + values.length;
		});
	}

	if (args.wordsContained)	{
		args.wordsContained.split(",").forEach(word => {
			values.push(word.trim());

			query += " AND CommonWords.word ILIKE $" + values.length;
		});
	}

	if (args.similarTo)	{
		values.push(args.similarTo.trim());

		query += " AND CosineSimilarity.uid2 = $" + values.length;
	}

	query += " group by books.uid, books.title, books.link_to_book, authors.name, bookwordaggregates.total_count;";

	pgClient.query(query, values, (err, res) => {
			if (err)	{
				return err;
			}
			else	{
				res.rows.forEach(row => {
					if (row.rating !== null && (row.rating < args.rateLow || row.rating > args.rateHigh))	{
						res.rows.splice(res.rows.indexOf(row), 1);
						return;
					}
					if (row.download !== null && (row.download < args.dcLow || row.rating > args.dcHigh))	{
						res.rows.splice(res.rows.indexOf(row), 1);
						return;
					}
				});

		  	pres.send(res.rows);	// .uid, .title, etc. to access columns
		  }
	});
}

function statistics(pres)	{
	var statsInfo = {
		// booksInfo: null,
		// authorsInfo: null,
		// wpsInfo: null,
		// avgWordLength: null,
		// wordCountInfo: null,
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

	/**
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
		**/

	// most common words
	pgClient.query("select word, sum(frequency) as frequency from CommonWords WHERE word NOT LIKE 'gutenberg' group by word order by sum(frequency) desc limit 10;", (err, res) => {
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
	pgClient.query("SELECT * FROM (select b1.title as book1, b2.title as book2, cos_similarity from CosineSimilarity, Books as b1, Books as b2 where cosinesimilarity.uid1 = b1.uid and cosinesimilarity.uid2 = b2.uid order by cos_similarity desc LIMIT 20) AS np WHERE book1 <> book2 LIMIT 10;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.cosineBooksInfo = res.rows;
		}
	});

	// most downloaded books
	pgClient.query("select title, download from Downloads, Books where Downloads.uid=Books.uid order by Download DESC limit 10;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.downloadInfo = res.rows;
		}
	});

	// most popular sequences
	pgClient.query("select word, next_word, sum(times_appear) as times_appear from Sequences group by word, next_word order by times_appear desc limit 10;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.sequencesInfo = res.rows;
		}
	});

	// best rated books
	pgClient.query("select title, CAST(avg(rating) AS DECIMAL(10, 2)) as rating FROM UserRatings, Books where UserRatings.book_id=Books.uid group by uid order by rating desc limit 10;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.bestRatingInfo = res.rows;
		}
	});

	// books with most ratings
	pgClient.query("select title, count(*) from Books, UserRatings where Books.uid=UserRatings.book_id group by uid order by count(*) desc limit 10;", (err, res) => {
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
			statsInfo.totalRatingInfo = res.rows[0].count;
		}
	});

	// total reviews
	pgClient.query("select count(*) from UserReview;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.totalReviewInfo = res.rows[0].count;
		}
	});

	// total users
	pgClient.query("select count(*) from Users;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			statsInfo.totalUserInfo = res.rows[0].count;
		}
	});

	setTimeout(function() {pres.send(statsInfo)}, 60000);
}

function profile(username, pres)	{
	var profileInfo = {
		username: username,
		email: null,
		booksRated: [],
		booksReviewed: []
	};

	// email
	pgClient.query("SELECT email FROM Users WHERE username LIKE $1;", [username], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.email = res.rows[0].email;
		}
	});

	// 5 books rated
	pgClient.query("SELECT uid, title, rating FROM (SELECT book_id, rating FROM UserRatings WHERE username LIKE $1 LIMIT 5) AS rates JOIN Books ON rates.book_id = Books.uid;", [username], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.booksRated = res.rows;
		}
	});

	// 5 books commented on
	pgClient.query("SELECT uid, title FROM (SELECT book_id FROM UserReview WHERE username LIKE $1 LIMIT 5) AS rates JOIN Books ON rates.book_id = Books.uid;", [username], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.booksReviewed = res.rows;
		}
	});

	setTimeout(function() {pres.send(profileInfo)}, 1000);
}

function changePassword(un, oldPW, newPW, pres)	{
	var success = false;

	pgClient.query("UPDATE Users SET password = $3 WHERE username LIKE $1 AND password LIKE $2;", [un, oldPW, newPW], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			success = true;
		}
	});

	setTimeout(function() {pres.send(success)}, 1000);
}

function login(un, pw, pres)	{
	var success = false;

	pgClient.query("SELECT * FROM Users WHERE username LIKE $1 AND password LIKE $2;", [un, pw], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			if (res.rows.length > 0)	{
				success = true;
			}
		}
	});

	setTimeout(function() {pres.send(success)}, 1000);
}

function makeUser(un, email, pw, pres)	{
	var success = false;

	pgClient.query("INSERT INTO Users VALUES ($1, $2, $3);", [un, email, pw], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			success = true;
		}
	});

	setTimeout(function() {pres.send(success)}, 1000);
}

function book(book_id, pres)	{
	bookInfo = {
		book_id: book_id,
		title: null,
		link_to_book: null,
		author: null,
		authorbday: null,
		released: null,
		wc: null,
		wps: null,
		awl: null,
		numDownloads: null,
		avgRating: null,
		numRatings: null,
		userRating: null,
		commonWords: [],
		popularSequences: [],
		reviews: [],
		similarBooks: [],
		similarAuthors: []
	}


	// author
	pgClient.query("SELECT * FROM Writes WHERE uid = $1;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.author = res.rows[0].name;
		}
	});

	// authorbday
	pgClient.query("SELECT * FROM Authors JOIN (SELECT * FROM Writes WHERE uid = $1) AS Book ON Authors.name = Book.name;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.authorbday = res.rows[0].birthdate;
		}
	});

	// title and released
	pgClient.query("SELECT * FROM Books WHERE uid = $1;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.title = res.rows[0].title;
			bookInfo.link_to_book = res.rows[0].link_to_book;
			bookInfo.released = res.rows[0].date_published;
		}
	});

	// wc, wps, awl
	pgClient.query("SELECT * FROM BookWordAggregates WHERE uid = $1;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.wc = res.rows[0].total_count;
			bookInfo.wps = res.rows[0].per_sentence;
			bookInfo.awl = res.rows[0].avg_word_length;
		}
	});

	// numDownloads
	let options = {
		url: "https://www.gutenberg.org/ebooks/" + book_id,
		transform: function (body) {
			return cheerio.load(body);
		}
	}

	rp(options)
	.then(resp => {
		bookInfo.numDownloads = resp("*[itemprop = 'interactionCount']").text().split(" ")[0];

		pgClient.query("INSERT INTO Downloads VALUES ($1, $2) ON CONFLICT (uid) DO UPDATE SET download = $2;", [book_id, bookInfo.numDownloads], (err, res) => {
			if (err)	{
				return err;
			}
		});
	});

	// avgRating
	pgClient.query("SELECT CAST(AVG(rating) AS DECIMAL(10, 2)) AS rating FROM UserRatings WHERE book_id = $1;", [book_id],(err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.avgRating = res.rows[0].rating;
		}
	});

	// numRatings
	pgClient.query("SELECT COUNT(rating) AS rating FROM UserRatings WHERE book_id = $1;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.numRatings = res.rows[0].rating;
		}
	});

	// commonWords
	pgClient.query("SELECT * FROM CommonWords WHERE uid = $1 AND word NOT LIKE 'gutenberg' ORDER BY frequency DESC LIMIT 5;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.popularWords = res.rows;
		}
	});

	// popularSequences
	pgClient.query("SELECT * FROM Sequences WHERE uid = $1 ORDER BY times_appear DESC LIMIT 5;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.popularSequences = res.rows;
		}
	});

	// reviews
	pgClient.query("SELECT * FROM UserReview WHERE book_id = $1;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.reviews = res.rows;
		}
	});

	// similarBooks
	pgClient.query("SELECT * FROM (SELECT uid2 FROM CosineSimilarity WHERE uid1 = $1 ORDER BY rank ASC LIMIT 5) AS sim JOIN Books on Books.uid = sim.uid2;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.similarBooks = res.rows;
		}
	});

	// similarAuthors
	pgClient.query("SELECT * FROM (SELECT name FROM WRITES WHERE uid = $1) AS w JOIN AuthorSimilarity ON w.name = AuthorSimilarity.author1 ORDER BY cos_similarity DESC LIMIT 5;", [book_id], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.similarAuthors = res.rows;
		}
	});

	setTimeout(function() {pres.send(bookInfo)}, 1000);
}

function rate(un, uid, rating, pres)	{
	var success = false;

	pgClient.query("INSERT INTO UserRatings VALUES ($1, $2, $3, NOW()) ON CONFLICT (username, book_id) DO UPDATE SET rating = $3, timestamp = NOW();", [un, uid, rating], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			success = true;
		}
	});

	setTimeout(function() {pres.send(success)}, 1000);
}

function review(un, uid, review, pres)	{
	var success = false;

	pgClient.query("INSERT INTO UserReview VALUES ($1, $2, $3, NOW()) ON CONFLICT (username, book_id) DO UPDATE SET review = $3, timestamp = NOW();", [un, uid, review], (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			success = true;
		}
	});

	setTimeout(function() {pres.send(success)}, 1000);
}

// https.createServer(sslOptions, app).listen(port);
app.listen(port, () => console.log(`Server running on port ${port}!`));