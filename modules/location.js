'use strict';
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;

const utils = require('./util.js')


// LOCATION CONSTRUCTOR FUNCTION
function Geolocation(search_query, formAddr, lat, lng, region) {
  this.search_query = search_query;
  this.formatted_query = formAddr;
  this.latitude = lat;
  this.longitude = lng;
  this.region = region;
}

function getGeoData(geoReq, geoRes) {
  const query = geoReq.query.data;
  try {
    const sql = 'SELECT * FROM cityLocation WHERE search_query = $1';
    utils.client.query(sql, [query]).then(sqlResponse => {
      if (sqlResponse.rowCount > 0) {
        geoRes.send(sqlResponse.rows[0]);
      } else {
        getGeoDataFromAPI(geoReq, geoRes);
      }
    })
  } catch (error) {
    utils.errorHandler(error, geoRes);
  }
}

function getGeoDataFromAPI(geoDataAPIReq, geoDataAPIRes) {
  try {
    utils.superagent.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${geoDataAPIReq.query.data}&key=${GEOCODE_API_KEY}`).then(geoResponse => {
      const location = geoResponse.body.results[0].geometry.location;
      const formAddr = geoResponse.body.results[0].formatted_address;
      const countryCode = geoResponse.body.results[0].address_components[3].short_name;
      const locationSubmitted = new Geolocation(geoDataAPIReq.query.data, formAddr, location.lat, location.lng, countryCode);
      const sqlValu = [locationSubmitted.search_query, locationSubmitted.formatted_query, locationSubmitted.latitude, locationSubmitted.longitude, locationSubmitted.region];
      const SQL = `INSERT INTO cityLocation(
        search_query, formatted_query, latitude, longitude, region
        ) VALUES (
          $1, $2, $3, $4, $5
          )`;
      utils.client.query(SQL, sqlValu);
      geoDataAPIRes.send(locationSubmitted);
    })
  } catch (error) {
    utils.errorHandler(error, geoDataAPIRes);
  }
}

module.exports = getGeoData;
