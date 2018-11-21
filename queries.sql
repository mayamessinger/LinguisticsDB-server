/* List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | authors            | table | postgres
 public | authorsimilarity   | table | postgres
 public | books              | table | postgres
 public | bookwordaggregates | table | postgres
 public | commonwords        | table | postgres
 public | cosinesimilarity   | table | postgres
 public | downloads          | table | postgres
 public | sequences          | table | postgres
 public | userratings        | table | postgres
 public | userreview         | table | postgres
 public | users              | table | postgres
 public | writes             | table | postgres
(12 rows)

 */

 ---------------------------------------------------
 -- 				 STATISTICS					  --
 ---------------------------------------------------
-- this section is intended for the "Statistics" page of the website

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

-- BOOKS
select count(*), min(date_published), max(date_published),
from books;

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

-- avg_word_length
select count(*), avg(avg_word_length), min(avg_word_length), max(avg_word_length)
from bookwordaggregates;

-- total_count
select count(*), avg(total_count), min(total_count), max(total_count)
from bookwordaggregates;

-- COMMONWORDS
-- wordcount is in new version of schema
-- to show the most popular words in our database
select word, sum(wordcount)
from commonwords
group by word
order by sum(wordcount) desc;

-- AUTHORSSIMILIARITY
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

/*
remove:
Various
unknown
Anonymous
*/


 ---------------------------------------------------
 -- 				 QUERIES					  --
 ---------------------------------------------------
 -- this section is intended for the search and advanced search
 -- features of the website

-- Dispay the list of authors' names, ordered by last name
select name 
from authors 
order by name;

-- Dispay the list of authors' names, ordered by last name, with birthdate between 1914 and 1918
select name 
from authors 
where birthdate>=1914 and birthdate<=1918 
order by name;

-- Dispay the title of the books written by Jane Austen, ordered alphabetically,
-- with release date between 2000 and 2015
select title 
from authors, writes, books 
where authors.name=writes.name
and writes.uid=books.uid
and authors.name='Austen, Jane'
and date_published > '2000' and date_published < '2015'
order by title;

-- Dispay the title of the books written by Jane Austen, ordered by downloads,
-- with release date between 2000 and 2015
-- QUERY ONLY WORKS IF THERE IF A VALUE - SHOULD WE MAKE DEFAULT 0 FOR DOWNLOAD COUNT?
select title 
from authors, writes, books, downloads 
where authors.name=writes.name
and writes.uid=books.uid
and downloads.uid=books.uid
and authors.name='Austen, Jane'
and date_published > '2000' and date_published < '2015'
order by download desc;

-- to show the most popular words in Pride and Prejudice
select word, frequency
from commonwords
where uid='42671'
order by frequency desc;
