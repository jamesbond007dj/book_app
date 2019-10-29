'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
require('ejs');

// const handleLocation = require('./location');
// const client = require('./pages/index');

const app = express();

const PORT = process.env.PORT || 3002;
// const pg = require('pg');
// const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', err => { throw err; });


app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', newSearch);
// app.post('/searches', searchForBooks);

function newSearch(request, response){
  response.render('pages/index');
}


app.get('*', (request, response)=> {
  response.status(404).send('this route does not exist');
})

app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
  