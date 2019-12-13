'use strict';
//DEPENDENCIES
const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const app = express();
app.use(cors());

// GLOBAL VARIABLES
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTFUL_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
let query;
let locationSubmitted;

const client = new pg.Client(`${DATABASE_URL}`);
client.on('error', error => console.log(error));
client.connect();


// LOCATION CONSTRUCTOR FUNCTION
function Geolocation(searchquery, formAddr, lat, lng, region) {
  this.searchquery = searchquery;
  this.formatted_query = formAddr;
  this.latitude = lat;
  this.longitude = lng;
  this.region = region;
}

// Event CONSTRUCTOR FUNCTION
function Event(link, name, event_date, summary = 'none') {
  this.link = link,
  this.name = name,
  this.event_date = event_date,
  this.summary = summary
}

// FORECAST CONSTRUCTOR FUNCTION
function Forecast(summary, time) {
  this.forecast = summary;
  this.time = (new Date(time * 1000)).toDateString();
}

//MOVIES CONSTRUCTOR FUNCTION
function Movies(movie) {
  this.title = movie.title,
  this.overview = movie.overview,
  this.average_votes = movie.vote_average,
  this.total_votes = movie.vote_count,
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
  this.popularity = movie.popularity,
  this.released_on = movie.released_date
}

function getWeaterData(request, response) {
  try {
    const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
    client.query(sql, [query]).then(sqlResponse => {
      superagent.get(`https://api.darksky.net/forecast/${WEATHER_API_KEY}/${sqlResponse.rows[0].latitude},${sqlResponse.rows[0].longitude}`).then(res => {
        const weatherArr = res.body.daily.data
        const reply = weatherArr.map(byDay => {
          return new Forecast(byDay.summary, byDay.time);
        })
        response.send(reply);
      })
    })
  } catch (error) {
    errorHandler(error, response);
  }
}


function getEventData(request, response) {
  try {
    superagent.get(`http://api.eventful.com/json/events/search?location=${query}&within=25&app_key=${EVENTBRITE_API_KEY}`).then(res => {
      let events = JSON.parse(res.text);
      let moreEvents = events.events.event
      let eventData = moreEvents.map(event => {
        return new Event(event.url, event.title, event.start_time, event.description)
      })
      response.send(eventData);
    }).catch(function (error) {
      console.error(error);
      return null;
    })
  } catch (error) {
    errorHandler(error, response);
  }
}


function getGeoData(request, response) {
  query = request.query.data;
  try {
    const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
    client.query(sql, [query]).then(sqlResponse => {
      if (sqlResponse.rowCount > 0) {
        response.send(sqlResponse.rows[0]);
      } else {
        createDataFromAPI(request, response, query);
      }
    })
  } catch (error) {
    errorHandler(error, response);
  }
}

function createDataFromAPI(request, response, query) {
  try {
    superagent.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API_KEY}`).then(geoResponse => {
      const location = geoResponse.body.results[0].geometry.location;
      const formAddr = geoResponse.body.results[0].formatted_address;
      const countryCode = geoResponse.body.results[0].address_components[3].short_name;
      locationSubmitted = new Geolocation(query, formAddr, location.lat, location.lng, countryCode);
      const sqlValu = [locationSubmitted.searchquery, locationSubmitted.formatted_query, locationSubmitted.latitude, locationSubmitted.longitude, locationSubmitted.region];
      const SQL = `INSERT INTO cityLocation(
        searchQuery, formatted_query, latitude, longitude, region
        ) VALUES (
          $1, $2, $3, $4, $5
          )`;
      client.query(SQL, sqlValu);
      response.send(locationSubmitted);
    })
  } catch (error) {
    errorHandler(error, response);
  }
}

function getMovieData(movieReq, movieRes) {
  try {
    const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
    client.query(sql, [query]).then(sqlResponse => {
      superagent.get(`https://api.themoviedb.org/3/movie/top_rated?api_key=${MOVIE_API_KEY}&region=${sqlResponse.rows[0].region}`).then(movieDBRes => {
        const movieList = JSON.parse(movieDBRes.text);
        const movieArr = movieList.results.map(elem => new Movies(elem));
        movieRes.send(movieArr);
      })
    })
  } catch (error) {
    errorHandler(error, movieRes);
  }
}

function errorHandler(error, response) {
  console.error(error);
  response.status(500).send('Whoops! There is a problem');
}

// LOCATION PATH
app.get('/location', getGeoData);

// WEATHER PATH
app.get('/weather', getWeaterData);

// EVENT PATH
app.get('/events', getEventData);

// MOVIES PATH
app.get('/movies', getMovieData);

app.listen(PORT, () => {
  console.log(`App is on PORT: ${PORT}`);
});
