 ---------------------------------------------------
 -- 				 STATISTICS					  --
 ---------------------------------------------------
this section is intended for the "Statistics" page of the website

-- AUTHOR
select count(*),
min(birthdate), 
percentile_cont(0.05) within group (order by birthdate asc) as percentile_05,
percentile_cont(0.25) within group (order by birthdate asc) as percentile_25,
percentile_cont(0.50) within group (order by birthdate asc) as median,
avg(birthdate), 
percentile_cont(0.75) within group (order by birthdate asc) as percentile_75,
percentile_cont(0.95) within group (order by birthdate asc) as percentile_95,
max(birthdate)
from authors;

count | min  | percentile_05 | percentile_25 | median |          avg          | percentile_75 | percentile_95 | max  
-------+------+---------------+---------------+--------+-----------------------+---------------+---------------+------
 12419 | -750 |          1738 |          1827 |   1855 | 1831.7359200343938091 |          1872 |          1896 | 1981
(1 row)


-- BOOKS
select count(*), min(date_published), max(date_published)
from books;

 count |    min     |    max     
-------+------------+------------
 36886 | 1972-12-01 | 2018-10-30
(1 row)

-- BOOKWORDAGGREGATES 
-- per_sentence
select count(*), 
min(per_sentence), 
percentile_cont(0.05) within group (order by per_sentence asc) as percentile_05,
percentile_cont(0.25) within group (order by per_sentence asc) as percentile_25,
percentile_cont(0.50) within group (order by per_sentence asc) as median,
avg(per_sentence), 
percentile_cont(0.75) within group (order by per_sentence asc) as percentile_75,
percentile_cont(0.95) within group (order by per_sentence asc) as percentile_95,
max(per_sentence)
from bookwordaggregates;

count |  min   |  percentile_05   |  percentile_25   |      median      |       avg       | percentile_75  |  percentile_95   |   max   
-------+--------+------------------+------------------+------------------+-----------------+----------------+------------------+---------
 36441 | 5.0132 | 9.81184196472168 | 13.4799270629883 | 16.7084255218506 | 17.185936187161 | 20.45849609375 | 26.3194618225098 | 34.9722
(1 row)

-- avg_word_length
select count(*), 
min(avg_word_length), 
percentile_cont(0.05) within group (order by avg_word_length asc) as percentile_05,
percentile_cont(0.25) within group (order by avg_word_length asc) as percentile_25,
percentile_cont(0.50) within group (order by avg_word_length asc) as median,
avg(avg_word_length), 
percentile_cont(0.75) within group (order by avg_word_length asc) as percentile_75,
percentile_cont(0.95) within group (order by avg_word_length asc) as percentile_95,
max(avg_word_length)
from bookwordaggregates;

 count |   min   |  percentile_05   |  percentile_25   |      median      |       avg        |  percentile_75   |  percentile_95  |   max   
-------+---------+------------------+------------------+------------------+------------------+------------------+-----------------+---------
 36441 | 4.01416 | 4.38001108169556 | 4.55192184448242 | 4.70097494125366 | 4.72010024552196 | 4.86889886856079 | 5.1147780418396 | 6.81534
(1 row)

-- total_count
select count(*), 
min(total_count), 
percentile_cont(0.05) within group (order by total_count asc) as percentile_05,
percentile_cont(0.25) within group (order by total_count asc) as percentile_25,
percentile_cont(0.50) within group (order by total_count asc) as median,
avg(total_count), 
percentile_cont(0.75) within group (order by total_count asc) as percentile_75,
percentile_cont(0.95) within group (order by total_count asc) as percentile_95,
max(total_count)
from bookwordaggregates;

 count | min | percentile_05 | percentile_25 | median |       avg       | percentile_75 | percentile_95 |     max     
-------+-----+---------------+---------------+--------+-----------------+---------------+---------------+-------------
 36441 | 280 |          5738 |         20246 |  49841 | 63972.776323372 |         85803 |        169387 | 2.79082e+06
(1 row)

-- COMMONWORDS
-- to show the most popular words in our database
select word, sum(frequency)
from commonwords
group by word
order by sum(frequency) desc;

-- AUTHORSSIMILARITY
-- authors that are the most similiar by lda_score
select author1, author2, lda_score
from authorsimilarity
order by lda_score desc;

-- authors that are the most similiar by cosine similarity
select author1, author2, cos_similarity
from authorsimilarity
order by cos_similarity desc;

-- COSINESIMILARITY
-- books that are the most similar
select b1.title, b2.title, cos_similarity
from cosinesimilarity, books as b1, books as b2
where cosinesimilarity.uid1 = b1.uid
and cosinesimilarity.uid2 = b2.uid
order by cos_similarity desc;

-- DOWNLOADS
-- most popular books by downloads
select title, download
from downloads, books
where downloads.uid=books.uid
order by download.desc;

-- SEQUENCES
-- most popular sequences
select word, next_word, sum(times_appear)
from sequences
group by word, next_word
order by sum(times_appear) desc;

-- USERRATINGS
-- books with the best average ratings
select title, avg(rating)
from userratings, books
where userratings.book_id=books.uid
group by uid
order by avg(rating) desc;

-- books with the most ratings
select title, count(*)
from userratings, books
where userratings.book_id=books.uid
group by uid
order by count(*) desc;

-- number of ratings on website (count)
select count(*)
from userratings;

-- USERREVIEW
-- books with the most user reviews
select title, count(*)
from books, userreview
where books.uid=userreview.book_id
group by uid
order by count(*) desc;

-- number of user reviews (count)
select count(*)
from userreview;

-- USERS
-- number of users on website (count)
select count(*)
from users;

-- WRITES
-- TODO: books per author (min, max, avg)
select min(count), max(count), avg(count)
from (select name, count(uid)
		from writes
		group by name) as f1;

select *
from (select name, count(uid)
		from writes
		group by name) as f1
where count>100;

