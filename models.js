const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  name: String,
  description: String,
});

const directorSchema = new mongoose.Schema({
  name: String,
  bio: String,
  birthyear: Date,
  deathyear: Date,
});

const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageurl: String,
  featured: Boolean,
  genre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre',
  },
  director: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Director',
  },
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  birth_date: Date,
  movies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
    },
  ],
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
  };
  
  userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

const Genre = mongoose.model('Genre', genreSchema);
const Director = mongoose.model('Director', directorSchema);
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

module.exports.Genre = Genre;
module.exports.Director = Director;
module.exports.Movie = Movie;
module.exports.User = User;
