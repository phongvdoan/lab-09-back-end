'use strict';

const YELP_API_KEY = process.env.YELP_API_KEY;
const utils = require('./util');

//YELP CONSTRUCTOR FUNCTION
function Resturants(resturant) {
  this.name = resturant.name;
  this.image_url = resturant.image_url;
  this.price = resturant.price;
  this.rating = resturant.rating;
  this.url = resturant.url;
}

function getYelpData(yelpReq, yelpRes) {
  try {
    utils.superagent.get(`https://api.yelp.com/v3/businesses/search?location=${yelpReq.query.data.search_query}&limit=20&sort_by=rating`).set('Authorization', `Bearer ${YELP_API_KEY}`).then(yelpBDRes => {
      const resturantList = JSON.parse(yelpBDRes.text);
      const resturantResults = resturantList.businesses.map(elem => new Resturants(elem));
      yelpRes.send(resturantResults);
    })
  } catch (error) {
    utils.errorHandler(error, yelpRes);
  }
}

module.exports = getYelpData;
