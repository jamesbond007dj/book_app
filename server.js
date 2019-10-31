'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
require('ejs');
const methodOverride = require('method-override');

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

app.use(methodOverride((request, response) => {
  if(request.body && typeof request.body === 'object' && '_method' in request.body){
    // look in the urlencoded POST body and delete it
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}))
app.get('/', getBooks);
app.get('/searches/', newSearch);
app.post('/searches', searchForBooks);
app.get('/books/:book_id', getOneBook);
app.post('/books', createBook);

app.get('*', (request, response) => {
  response.status(404).send('this route does not exist');
})

function getBooks(request, response){
  // go to the database and get all the tasks and display them
  const sql = `SELECT * FROM books;`;
  client.query(sql)
    .then(sqlResults => {
      const arrayOfBooks = sqlResults.rows;
      response.render('pages/index', {books: arrayOfBooks});
    })
    .catch(error => errorHandler(error, response));
}

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
      response.status(200).render('pages/searches/show', { bookList: bookArray });
    })
    .catch(error => errorHandler(error, response));
}

function getOneBook(request, response){
  // go to the database, get a specific task using an id and show details of that task
  console.log(request.params.book_id);

  const sql = `SELECT * FROM books WHERE id=$1;`;
  const safeValues = [request.params.book_id];

  client.query(sql, safeValues)
    .then(sqlResults => {
      const selectedBook = sqlResults.rows[0];
      response.render('pages/books/detail', {bookInfo:selectedBook})
    })
    .catch(err => {console.error(err)});
}

function createBook(request, response) {
  console.log(request.body);
  let { title, author, description, img_url, isbn, bookshelf } = request.body;

  let SQL = 'INSERT INTO tasks(title, author, description, img_url, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
  let values = [title, author, description, img_url, isbn, bookshelf ];

  return client.query(SQL, values)
    .then(response.redirect('/'))
    .catch(err => handleError(err, response));
}



function errorHandler(error, response) {
  response.render('pages/error');
}

function Book(bookObj) {
  this.title = bookObj.title || 'title infromation not available';
  this.author = bookObj.authors || 'author information not available';
  this.description = bookObj.description || 'no description available';
  if (bookObj.imageLinks) {
    this.image_url = fixURL(bookObj.imageLinks.thumbnail)
  } else {this.url = './noimage.png'}
  this.isbn = bookinfo.industryIdentifiers[0].identifier || 'ISBN unavailable';
}

function fixURL(url) {
  return url.replace(/http:/,'https:')
}

app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
