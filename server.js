'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
require('ejs');

// const handleLocation = require('./location');
// const client = require('./pages/index');

const app = express();

const PORT = process.env.PORT || 3002;
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });
client.connect();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/searches', newSearch);
app.post('/searches', searchForBooks);
app.get('/', getBooks);
// app.post('/pages', getBooks);

app.get('*', (request, response) => {
  response.status(404).send('this route does not exist');
})

function getBooks(request, response){
  // go to the database and get all the tasks and display them
  
  const sql = `SELECT * FROM books;`;

  client.query(sql)
    .then(sqlResults => {
      
      const arrayOfBooks = sqlResults.rows;
      console.log(arrayOfBooks);
      response.render('pages/index', {books: arrayOfBooks});
    })
    .catch(error => errorHandler(error, response));
}

// function getOneTask(request, response){
//   // go to the database, get a specific task using an id and show details of that task
//   console.log(request.params.book_id);

//   const sql = `SELECT * FROM books WHERE id=$1;`;
//   const safeValues = [request.params.book_id];

//   client.query(sql, safeValues)
//     .then(sqlResults => {
//       const selectedBook = sqlResults.rows[0];
//       response.render('pages/details', {taskInfo:selectedBook})
//     })
//     .catch(err => {console.error(err)});
// }


function newSearch(request, response) {
  response.render('pages/searches/new');
}


function searchForBooks(request, response) {
  console.log(request.body.search);

  const thingUserSearchedFor = request.body.search[0];
  const typeOfSearch = request.body.search[1];

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (typeOfSearch === 'title') {
    url += `+intitle:${thingUserSearchedFor}`;
  }

  if (typeOfSearch === 'author') {
    url += `+inauthor:${thingUserSearchedFor}`;
  }

  superagent.get(url)
    .then(results => {
      const bookArray = results.body.items.map(book => {
        console.log(book.volumeInfo);
        return new Book(book.volumeInfo);
      })
      // console.log(bookArray);

      response.status(200).render('pages/searches/show', { bookList: bookArray });
    })
    .catch(error => errorHandler(error, response));
}

function errorHandler(error, response) {
  response.render('pages/error');
}

function Book(bookObj) {
  this.title = bookObj.title || 'title infromation not available';
  this.author = bookObj.authors || 'author information not available';
  this.description = bookObj.description || 'no description available';
  if (bookObj.imageLinks) {
    this.url = fixURL(bookObj.imageLinks.thumbnail)
  } else {this.url = './noimage.png'}
}

function fixURL(url) {
  return url.replace(/http:/,'https:')
}

app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
