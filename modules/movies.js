'use strict';

const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const utils = require('./util');

//MOVIES CONSTRUCTOR FUNCTION
function Movies(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.released_date;
}


function getMovieData(movieReq, movieRes) {
  try {
    const sql = 'SELECT * FROM cityLocation WHERE search_query = $1';
    utils.client.query(sql, [movieReq.query.data.search_query]).then(sqlResponse => {
      utils.superagent.get(`https://api.themoviedb.org/3/movie/top_rated?api_key=${MOVIE_API_KEY}&region=${sqlResponse.rows[0].region}`).then(movieDBRes => {
        const movieList = JSON.parse(movieDBRes.text);
        const movieArr = movieList.results.map(elem => new Movies(elem));
        movieRes.send(movieArr);
      })
    })
  } catch (error) {
    utils.errorHandler(error, movieRes);
  }
}

module.exports = getMovieData;
