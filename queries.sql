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
 -- 				 CLEANING THE DB			  --
 ---------------------------------------------------
--  TO DO:
-- code to remove books that are anomalies by words per sentence




 ---------------------------------------------------
 -- 				 STATISTICS					  --
 ---------------------------------------------------

-- AUTHOR
select count(*), avg(birthdate), min(birthdate), max(birthdate)
from authors;

-- BOOKS
select count(*), min(date_published), max(date_published)
from books;

-- BOOKWORDAGGREGATES 
/*
There are some weird books in the dataset, such as the following:
-- remove books 4656 and 48768 because they are not really readable and as a result have too many words per sentence (greek characters etc)
-- remove 44663, 44662, 44661, 44799 because they are illustrations (per_sentence is one or two)
*/
-- per_sentence
select count(*), avg(per_sentence), min(per_sentence), max(per_sentence)
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
select 
from sequences

-- TO DO:
-- userratings
-- books with the best ratings

-- number of ratings (count)

-- userreview
-- books with the most user reviews

-- number of user reviews (count)

-- users
-- number of users (count)

-- writes
-- books per author (min, max, avg)

 ---------------------------------------------------
 -- 				 QUERIES					  --
 ---------------------------------------------------

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
