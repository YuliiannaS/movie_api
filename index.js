const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { Director, Genre, Movie, User } = require('./models');

const app = express();
const port = 8080;

mongoose.connect('mongodb://127.0.0.1:27017/moviedb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(morgan('dev'));  // Using Morgan for request logging
app.use(express.static('public')); // Serve static files

app.post('/users', (req, res) => {
    const { email, username, password } = req.body;
    if (email && username && password) {
        User.findOne({ email })
            .then(existingUser => {
                if (existingUser) {
                    res.status(400).send('This email already exists');
                } else {
                    const newUser = new User({
                        email,
                        username,
                        password,
                        favorite: [],
                    });
                    return newUser.save()
                        .then(() => {
                            res.status(200).send('User created!');
                            return;
                        })
                }
            })
            .catch(error => {
                console.error('Error creating user:', error);
                res.status(500).send('Internal server error');
                return;
            });
    } else {
        res.status(400).send('Missing data');
    }
});


app.put('/users/:email', (req, res) => {
    const email = req.params.email;
    const username = req.body.username;
    if (username) {
        User.findOne({ email })
            .then(user => {
                if (!user) {
                    res.status(400).send('This email does not exist');
                } else {
                    user.username = username;
                    return user.save()
                        .then(() => {
                            res.status(200).send('User updated!');
                        })
                }
            })
            .catch(error => {
                console.error('Error updating user:', error);
                res.status(500).send('Internal server error');
            });
    } else {
        res.status(400).send('Missing data');
    }
});

app.post('/users/:email/:movieName', (req, res) => {
    const email = req.params.email;
    const movieName = req.params.movieName;
    if (email && movieName) {
        Promise.all([
            User.findOne({ email }),
            Movie.findOne({ title: movieName })
        ])
            .then(([user, movie]) => {
                if (!user || !movie) {
                    res.status(400).send('This email or movie does not exist');
                } else {
                    user.movies.push(movie._id);
                    return user.save()
                        .then(() => {
                            res.status(200).send(`Movie "${movieName}" favorited!`);
                        });
                }
            })
            .catch(error => {
                console.error('Error favoriting movie:', error);
                res.status(500).send('Internal server error');
            });
    } else {
        res.status(400).send('Missing data');
    }
});

app.delete('/users/:email/:movieName', (req, res) => {
    const email = req.params.email;
    const movieName = req.params.movieName;
    if (email && movieName) {
        Promise.all([
            User.findOne({ email }),
            Movie.findOne({ title: movieName })
        ])
            .then(([user, movie]) => {
                if (!user || !movie) {
                    res.status(400).send('This email or movie does not exist');
                } else {
                    user.favorite = user.movies.filter(id => id !== movie._id);
                    return user.save()
                        .then(() => {
                            res.status(200).send(`Movie "${movieName}" removed from favorites!`);
                        })
                }
            })
            .catch(error => {
                console.error('Error removing movie from favorites:', error);
                res.status(500).send('Internal server error');
            });
    } else {
        res.status(400).send('Missing data');
    }
});

app.delete('/users', (req, res) => {
    const email = req.body.email;
    if (email) {
        User.findOneAndDelete({ email })
            .then(deletedUser => {
                if (!deletedUser) {
                    res.status(400).send('This email was not found');
                    return;
                }
                res.status(200).send('User removed!');
            })
            .catch(error => {
                console.error('Error removing user:', error);
                res.status(500).send('Internal server error');
            });
    } else {
        res.status(400).send('Missing data');
    }
});


app.get('/movies', (req, res) => {
    Movie.find()
        .then(movies => {
            res.json(movies);
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/movies/:title', (req, res) => {
    const title = req.params.title;
    Movie.findOne({ title })
        .then(movie => {
            if (movie) {
                res.json(movie);
            } else {
                res.status(404).send(`Movie with the title "${title}" was not found.`);
            }
        })
        .catch(error => {
            console.error('Error fetching movie:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/movies/genre/:name', (req, res) => {
    const genreName = req.params.name;
    Genre.findOne({ name: genreName })
        .then(genre => {
            if (!genre) {
                res.status(404).send(`Genre "${genreName}" was not found.`);
                return;
            }
            return Movie.find({ 'genre': genre._id });
        })
        .then(movies => {
            if (movies) {
                res.json(movies);
            }
        })
        .catch(error => {
            console.error('Error fetching movies by genre:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/movies/directors/:name', (req, res) => {
    const directorName = req.params.name;
    Director.findOne({ name: directorName })
        .then(director => {
            if (!director) {
                res.status(404).send(`Director "${directorName}" was not found.`);
                return;
            }
            return Movie.find({ 'director': director._id });
        })
        .then(movies => {
            if (movies) {
                res.json(movies);
            }
        })
        .catch(error => {
            console.error('Error fetching movies by director:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/', (req, res) => {
    res.send('Welcome to movie DB!');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
