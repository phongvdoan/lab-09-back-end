'use strict';
const utils = {};
utils.superagent = require('superagent');
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
utils.client = new pg.Client(`${DATABASE_URL}`);

utils.errorHandler = function (error, response) {
  console.error(error);
  response.status(500).send('Whoops! There is a problem');
}


module.exports = utils;
