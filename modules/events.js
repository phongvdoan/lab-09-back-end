'use strict';

const EVENTFUL_API_KEY = process.env.EVENTFUL_API_KEY;
const utils = require('./util');

// Event CONSTRUCTOR FUNCTION
function Event(link, name, event_date, summary = 'none') {
  this.link = link;
  this.name = name;
  this.event_date = event_date.toDateString().split('T')[0];
  this.summary = summary;
}


function getEventData(eventReq, eventRes) {
  try {
    const sql = 'SELECT events.* FROM events JOIN cityLocation ON events.searchId = cityLocation.id WHERE cityLocation.search_query = $1';
    utils.client.query(sql, [eventReq.query.data.search_query]).then(sqlResponse => {
      if (sqlResponse.rowCount > 0) {
        const data = sqlResponse.rows.map(event => new Event(event.url, event.title, event.start_time, event.description));
        eventRes.send(data);
      } else {
        getEventDataFromAPI(eventReq, eventRes);
      }
    })
  } catch (error) {
    utils.errorHandler(error, eventRes);
  }
}


function getEventDataFromAPI(eventReq, eventRes) {
  try {
    const sql = 'SELECT * FROM cityLocation WHERE search_query = $1';
    utils.client.query(sql, [eventReq.query.data.search_query]).then(sqlResponse => {
      utils.superagent.get(`http://api.eventful.com/json/events/search?location=${eventReq.query.data.search_query}&within=25&app_key=${EVENTFUL_API_KEY}`).then(res => {
        let events = JSON.parse(res.text);
        let moreEvents = events.events.event
        let eventData = moreEvents.map(event => {
          const sqlValu = [sqlResponse.rows[0].id, event.url, event.title, event.start_time, event.description];
          const SQL = `INSERT INTO events(
            searchid, url, title, start_time, description
            ) VALUES (
              $1, $2, $3, $4, $5
              )`;
          utils.client.query(SQL, sqlValu);
          return new Event(event.url, event.title, event.start_time, event.description)
        })
        eventRes.send(eventData);
      }).catch(function (error) {
        console.error(error);
        return null;
      })
    })
  } catch (error) {
    utils.errorHandler(error, eventRes);
  }
}

module.exports = getEventData;
