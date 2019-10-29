'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();

const handleLocation = require('./location');
const client = require('./client');

const app = express();

const PORT = process.env.PORT || 3002;
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });



client.connect()
  .then(() => {
    console.log('connected to db');
    app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
  })
  .catch(err => {
    throw `PG Startup Error: ${err.message}`;
  })