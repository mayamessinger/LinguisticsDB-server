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
	else if (req.body.book)	{
		book(req.body.book_id, pres);
	}
});

function basicSearch(st, sf, pres)	{
	if (sf === "Title")	{
		pgClient.query("SELECT * FROM (SELECT * FROM Books WHERE Title ILIKE '%" + st + "%') AS info \
			JOIN BookWordAggregates ON info.uid = BookWordAggregates.uid;", (err, res) => {
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

		pgClient.query("SELECT * FROM (SELECT * FROM Writes WHERE name ILIKE '%" + st + "%') AS info \
			JOIN Books ON info.uid = Books.uid;", (err, res) => {
				if (err)	{
					return err;
				}
				else	{
			  	pres.send(res.rows);	// .uid, .title, etc. to access columns
			  }
		});
	}

	if (sf === "Year Published")	{
		pgClient.query("SELECT * FROM Books WHERE date_published LIKE '%" + st + "%';", (err, res) => {
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

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (total_count >= " + st + " - 300 \
			AND total_count <= " + st + " + 300)) AS info JOIN Books ON info.uid = Books.uid;", (err, res) => {
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

		pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (per_sentence = " + st + ")) AS info \
			JOIN Books ON info.uid = Books.uid;", (err, res) => {
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
	pgClient.query("SELECT * FROM (SELECT * FROM BookWordAggregates WHERE (per_sentence = " + st + ")) AS info \
		JOIN Books ON info.uid = Books.uid;", (err, res) => {
			if (err)	{
				return err;
			}
			else	{
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
	pgClient.query("select title, download from Downloads, Books where Downloads.uid=Books.uid order by Download DESC limit 10;", (err, res) => {
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

	setTimeout(function() {pres.send(statsInfo)}, 1000);
}

function profile(username, pres)	{
	var profileInfo = {
		username: username,
		email: null,
		booksRated: [],
		booksReviewed: []
	};

	// email
	pgClient.query("SELECT email FROM Users WHERE username = " + username + ";", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.email = res.rows;
		}
	});

	// 5 books rated
	pgClient.query("SELECT uid, title, rating FROM (SELECT book_id FROM UserRatings WHERE username = " + username + " LIMIT 5) AS rates JOIN Books;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.booksRated = res.rows;
		}
	});

	// 5 books commented on
	pgClient.query("SELECT uid, title FROM (SELECT book_id FROM UserReviews WHERE username = " + username + " LIMIT 5) AS rates JOIN Books;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			profileInfo.booksReviewed = res.rows;
		}
	});

	setTimeout(function() {pres.send(profileInfo)}, 200);
}

function book(book_id, pres)	{
	bookInfo = {
		book_id: book_id,
		title: null,
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
	pgClient.query("SELECT * FROM Writes WHERE uid = " + book_id + ";", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.author = res.rows[0].name;
		}
	});

	// authorbday
	pgClient.query("SELECT * FROM Authors JOIN (SELECT * FROM Writes WHERE uid = " + book_id + ") AS Book ON Authors.name = Book.name;", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.authorbday = res.rows[0].birthdate;
		}
	});

	// title and released
	pgClient.query("SELECT * FROM Books WHERE uid = " + book_id + ";", (err, res) => {
		if (err)	{
			return err;
		}
		else	{
			bookInfo.title = res.rows[0].title;
			bookInfo.released = res.rows[0].date_published;
		}
	});

	// wc, wps, awl
	pgClient.query("SELECT * FROM BookWordAggregates WHERE uid = " + book_id + ";", (err, res) => {
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

		pgClient.query("INSERT INTO Downloads VALUES (" + book_id + ", " + bookInfo.numDownloads + ") ON CONFLICT (uid) DO UPDATE SET download = " + bookInfo.numDownloads + ";", (err, res) => {
			if (err)	{
				return err;
			}
		});
	});

	// // avgRating
	// pgClient.query("SELECT AVG(rating) FROM UserRatings WHERE book_id = " + book_id + ";", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.avgRating = res.rows[0].rating;
	// 	}
	// });

	// // numRatings
	// pgClient.query("SELECT COUNT(rating) FROM UserRatings WHERE book_id = " + book_id + ";", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.numRatings = res.rows[0].rating;
	// 	}
	// });

	// // commonWords
	// pgClient.query("SELECT * FROM CommonWords WHERE uid = " + book_id + " ORDER BY frequency DESC LIMIT 5;", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.popularWords = res.rows;
	// 	}
	// });

	// // popularSequences
	// pgClient.query("SELECT * FROM Sequences WHERE uid = " + book_id + " ORDER BY times_appear DESC LIMIT 5;", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.popularSequences = res.rows;
	// 	}
	// });

	// // reviews
	// pgClient.query("SELECT * FROM UserReview WHERE book_id = " + book_id + ";", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.reviews = res.rows;
	// 	}
	// });

	// // similarBooks
	// pgClient.query("SELECT * FROM CosineSimilarity WHERE uid1 = " + book_id + " ORDER BY rank ASC LIMIT 5;", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.similarBooks = res.rows;
	// 	}
	// });

	// // similarAuthors
	// pgClient.query("SELECT * FROM AuthorSimilarity WHERE author = " + bookInfo.author + " ORDER BY rank ASC LIMIT 5;", (err, res) => {
	// 	if (err)	{
	// 		return err;
	// 	}
	// 	else	{
	// 		bookInfo.similarAuthors = res.rows;
	// 	}
	// });

	setTimeout(function() {pres.send(bookInfo)}, 500);
}

// https.createServer(sslOptions, app).listen(port);
app.listen(port, () => console.log(`Server running on port ${port}!`));