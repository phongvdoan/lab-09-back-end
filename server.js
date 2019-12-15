'use strict';
//DEPENDENCIES
const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
const utils = require('./modules/util')
const geoData = require('./modules/location')
const weatherData = require('./modules/weather')
const eventData = require('./modules/events')
const movieData = require('./modules/movies')
const yelpData = require('./modules/yelp')

utils.client.on('error', error => console.log(error));
utils.client.connect();

// LOCATION PATH
app.get('/location', geoData);

// WEATHER PATH
app.get('/weather', weatherData);

// EVENT PATH
app.get('/events', eventData);

// MOVIES PATH
app.get('/movies', movieData);

// YELP PATH
app.get('/yelp', yelpData);

app.listen(PORT, () => {
  console.log(`App is on PORT: ${PORT}`);
});
