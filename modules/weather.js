'use strict';

const WEATHER_API_KEY = process.env.DARKSKY_API_KEY;
const utils = require('./util');

// FORECAST CONSTRUCTOR FUNCTION
function Forecast(summary, time) {
  this.forecast = summary;
  this.time = (new Date(time * 1000)).toDateString();
}

function getWeaterData(weatherReq, weatherRep) {
  try {
    const sql = 'SELECT weather.* FROM weather JOIN cityLocation ON weather.searchId = cityLocation.id WHERE cityLocation.search_query = $1';
    utils.client.query(sql, [weatherReq.query.data.search_query]).then(sqlResponse => {
      if (sqlResponse.rowCount > 0) {
        const data = sqlResponse.rows.map(daily => new Forecast(daily.summary, daily.time));
        weatherRep.send(data);
      } else {
        getWeaterDataFromAPI(weatherReq, weatherRep);
      }
    })
  } catch (error) {
    utils.errorHandler(error, weatherRep);
  }
}

function getWeaterDataFromAPI(weatherReq, weatherRep) {
  try {
    const sql = 'SELECT * FROM cityLocation WHERE search_query = $1';
    utils.client.query(sql, [weatherReq.query.data.search_query]).then(sqlResponse => {
      utils.superagent.get(`https://api.darksky.net/forecast/${WEATHER_API_KEY}/${sqlResponse.rows[0].latitude},${sqlResponse.rows[0].longitude}`).then(sqlRes => {
        const weatherArr = sqlRes.body.daily.data
        const reply = weatherArr.map(byDay => {
          const sqlValu = [sqlResponse.rows[0].id, byDay.summary, byDay.time];
          const SQL = `INSERT INTO weather(
            searchid, summary, time
            ) VALUES (
              $1, $2, $3
              )`;
          utils.client.query(SQL, sqlValu);
          return new Forecast(byDay.summary, byDay.time);
        })
        weatherRep.send(reply);
      })
    })
  } catch (error) {
    utils.errorHandler(error, weatherRep);
  }
}

module.exports = getWeaterData;
