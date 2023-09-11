const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Director, Genre, Movie, User } = require('./models');
const passport = require('passport');

const app = express();
const port = process.env.PORT || 8080;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
const auth = require('./auth')(app);

mongoose.connect(process.env.CONNECTION_URI, {
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

require('./passport');

app.post('/users',
    [
        check('username', 'Username is required').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('password', 'Password is required').not().isEmpty(),
        check('email', 'Email does not appear to be valid').isEmail()
    ],
    (req, res) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const { email, username, password } = req.body;
        let hashedPassword = User.hashPassword(req.body.password);
        if (email && username && password) {
            User.findOne({ username })
                .then(existingUser => {
                    if (existingUser) {
                        res.status(400).send('This email already exists');
                    } else {
                        User
                            .create({
                                email,
                                username,
                                password: hashedPassword,
                                favorite: [],
                            })
                            .then(() => {
                                res.status(201).send('User created!');
                                return;
                            })
                            .catch((error) => {
                                console.error(error);
                                res.status(500).send('Error: ' + error);
                            });
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


app.put('/users/:email',
    [
        check('username', 'Username is required').isLength({ min: 5 }),
        check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('password', 'Password is required').not().isEmpty(),
        check('email', 'Email does not appear to be valid').isEmail(),
    ], passport.authenticate('jwt', { session: false }), (req, res) => {
        const email = req.params.email;
        const authenticatedUserEmail = req.user.email;
        const username = req.body.username;

        if (email !== authenticatedUserEmail) {
            return res.status(401).send('Unauthorized: You can only update your own data.');
        }
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

app.post('/users/:email/:movieName', passport.authenticate('jwt', { session: false }), (req, res) => {
    const email = req.params.email;
    const authenticatedUserEmail = req.user.email;
    const movieName = req.params.movieName;

    if (email !== authenticatedUserEmail) {
        return res.status(401).send('Unauthorized: You can only favorite movies for your own account.');
    }
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

app.delete('/users/:email/:movieName', passport.authenticate('jwt', { session: false }), (req, res) => {
    const email = req.params.email;
    const authenticatedUserEmail = req.user.email;
    const movieName = req.params.movieName;

    if (email !== authenticatedUserEmail) {
        return res.status(401).send('Unauthorized: You can only delete your own account.');
    }
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

app.delete('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    const email = req.body.email;
    const authenticatedUserEmail = req.user.email;

    if (email !== authenticatedUserEmail) {
        return res.status(401).send('Unauthorized: You can only delete your own account.');
    }
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


app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movie.find()
        .populate('genre')
        .populate('director')
        .then(movies => {
            res.json(movies);
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            res.status(500).send('Internal server error');
        });
});

app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    const title = req.params.title;
    Movie.findOne({ title })
        .populate('genre')
        .populate('director')
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

app.get('/movies/genre/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
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

app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
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

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
