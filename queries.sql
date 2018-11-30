 ---------------------------------------------------
 -- 				 QUERIES					  --
 ---------------------------------------------------
 -- this section is intended for the search and advanced search
 -- features of the website

 --- ADVANCED SEARCH QUERY

SELECT books.title, books.link_to_book, 
authors.name, bookwordaggregates.total_count
FROM books
FULL OUTER JOIN writes ON books.uid = writes.uid
FULL OUTER JOIN authors ON authors.name = writes.name
FULL OUTER JOIN authorsimilarity ON authors.name=authorsimilarity.author1
FULL OUTER JOIN bookwordaggregates ON books.uid = bookwordaggregates.uid
FULL OUTER JOIN commonwords ON books.uid=commonwords.uid
FULL OUTER JOIN cosinesimilarity ON books.uid=cosinesimilarity.uid1
FULL OUTER JOIN downloads ON books.uid = downloads.uid
FULL OUTER JOIN userratings ON books.uid = userratings.book_id
where books.title='Pride and Prejudice';


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
