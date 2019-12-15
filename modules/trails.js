'use strict';

const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const utils = require('./util');

//YELP CONSTRUCTOR FUNCTION
function Trails(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(11);
}

function getTrailData(trailReq, trailRes) {
  try {
    utils.superagent.get(`https://www.hikingproject.com/data/get-trails?lat=${trailReq.query.data.latitude}&lon=${trailReq.query.data.longitude}&maxDistance=10&key=${TRAIL_API_KEY}`).then(trailDBRes => {
      const trailList = JSON.parse(trailDBRes.text);
      const trailResults = trailList.trails.map(trail => new Trails(trail));
      trailRes.send(trailResults);
    })
  } catch (error) {
    utils.errorHandler(error, trailRes);
  }
}

module.exports = getTrailData;
