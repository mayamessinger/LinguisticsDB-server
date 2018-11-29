 ---------------------------------------------------
 -- 				 QUERIES					  --
 ---------------------------------------------------
 -- this section is intended for the search and advanced search
 -- features of the website

 --- ADVANCED SEARCH QUERY

SELECT *
FROM books
FULL OUTER JOIN writes ON books.uid = writes.uid
FULL OUTER JOIN authors ON authors.name = writes.name
FULL OUTER JOIN authorsimilarity ON authors.name=authorsimilarity.author1
FULL OUTER JOIN bookwordaggregates ON books.uid = bookwordaggregates.uid
FULL OUTER JOIN commonwords ON books.uid=commonwords.uid
FULL OUTER JOIN cosinesimilarity ON books.uid=cosinesimilarity.uid1
FULL OUTER JOIN downloads ON books.uid = downloads.uid
FULL OUTER JOIN sequences ON books.uid = sequences.uid
FULL OUTER JOIN userratings ON books.uid = userratings.book_id
FULL OUTER JOIN userreview ON books.uid = userreview.book_id
FULL OUTER JOIN users ON users.username = userreview.username 
and userreview.username = userratings.username
where books.uid= 33409;

  uid  |                          title                          | date_published |             link_to_book              |  uid  |         name         |         name         | birthdate | author1 | author2 | lda_score | cos_similarity |  uid  | per_sentence | total_count | avg_word_length | uid | word | frequency | uid1 | uid2 | cos_similarity | uid | download | uid | word | next_word | times_appear | username | book_id | rating | timestamp | username | book_id | review | timestamp | username | email | password 
-------+---------------------------------------------------------+----------------+---------------------------------------+-------+----------------------+----------------------+-----------+---------+---------+-----------+----------------+-------+--------------+-------------+-----------------+-----+------+-----------+------+------+----------------+-----+----------+-----+------+-----------+--------------+----------+---------+--------+-----------+----------+---------+--------+-----------+----------+-------+----------
 33409 | The Ranch Girls at Rainbow Lodge The Ranch Girls Series | 2010-08-11     | http://www.gutenberg.org/ebooks/33409 | 33409 | Vandercook, Margaret | Vandercook, Margaret |      1876 |         |         |           |                | 33409 |      14.3207 |       58527 |          4.4062 |     |      |           |      |      |                |     |          |     |      |           |              |          |         |        |           |          |         |        |           |          |       | 
(1 row)


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
