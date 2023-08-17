const express = require('express');
const morgan = require('morgan');

const app = express();
const port = 8080;

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(morgan('dev'));  // Using Morgan for request logging
app.use(express.static('public')); // Serve static files

let users = [
    {
        email: 'test@google.com',
        username: 'testuser',
        password: '123',
        favorite: [],
    },
];

const movies = [
    {
        title: 'The Shawshank Redemption',
        description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
        genre: {
            name: 'Drama',
            description: 'a type of story acted out before an audience',
        },
        director: {
            name: 'Frank Darabont',
            bio: 'Three-time Oscar nominee Frank Darabont was born in a refugee camp in 1959 in Montbeliard, France, the son of Hungarian parents who had fled Budapest during the failed 1956 Hungarian revolution.',
            birthYear: '1959',
        },
        imageUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1200_.jpg',
        featured: true,
    },
    {
        title: 'Requiem for a Dream',
        description: 'The drug-induced utopias of four Coney Island people are shattered when their addictions run deep.',
        genre: {
            name: 'Drama',
            description: 'a type of story acted out before an audience',
        },
        director: {
            name: 'Darren Aronofsky',
            bio: 'Darren Aronofsky was born February 12, 1969, in Brooklyn, New York. Growing up, Darren was always artistic: he loved classic movies and, as a teenager, he even spent time doing graffiti art.',
            birthYear: '1969',
        },
        imageUrl: 'https://m.media-amazon.com/images/M/MV5BOTdiNzJlOWUtNWMwNS00NmFlLWI0YTEtZmI3YjIzZWUyY2Y3XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UY1920_.jpg',
        featured: true,
    },
    {
        title: ' Eternal Sunshine of the Spotless Mind',
        description: 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories for ever.',
        genre: {
            name: 'Drama',
            description: 'a type of story acted out before an audience',
        },
        director: {
            name: 'Michel Gondry',
            bio: 'He grew up in Versailles with a family who was very influenced by pop music. When he was young, Gondry wanted to be a painter or an inventor. In the 80s he entered in an art school in Paris where he could develop his graphic skills and where he also met friends with whom he created a pop-rock band called Oui-Oui.',
            birthYear: '1963',
        },
        imageUrl: 'https://m.media-amazon.com/images/M/MV5BMTY4NzcwODg3Nl5BMl5BanBnXkFtZTcwNTEwOTMyMw@@._V1_FMjpg_UY2048_.jpg',
        featured: true,
    },

];

app.post('/users', (req, res) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    if (email && username && password) {
        const existingUser = users.find((user) => user.email === email);
        if (existingUser) {
            res.status(400).send('This email already exist');
        } else {
            users.push({
                email,
                username,
                password,
                favorite: [],
            });
            res.status(200).send('User created!');
        }
    } else {
        res.status(500).send('Wrong data');
    }
});

app.put('/users/:email', (req, res) => {
    const email = req.params.email;
    const username = req.body.username;
    if (username) {
        const user = users.find((user) => user.email === email);
        if (!user) {
            res.status(400).send('This email does not exist');
        } else {
            user.username = username;
            res.status(200).send('User updated!');
        }
    } else {
        res.status(500).send('Wrong data');
    }
});

app.post('/users/:email/:movieName', (req, res) => {
    const email = req.params.email;
    const movieName = req.params.movieName;
    if (email && movieName) {
        const user = users.find((user) => user.email === email);
        const movie = movies.find((m) => m.title === movieName);
        if (!user || !movie) {
            res.status(400).send('This email or movie does not exist');
        } else {
            user.favorite.push(movieName);
            res.status(200).send('Movie "' + movieName + '" favorited!');
        }
    } else {
        res.status(500).send('Wrong data');
    }
});

app.delete('/users/:email/:movieName', (req, res) => {
    const email = req.params.email;
    const movieName = req.params.movieName;
    if (email && movieName) {
        const user = users.find((user) => user.email === email);
        const movie = movies.find((m) => m.title === movieName);
        if (!user || !movie) {
            res.status(400).send('This email or movie does not exist');
        } else {
            user.favorite = user.favorite.filter(name => name !== movieName);
            res.status(200).send('Movie "' + movieName + '" removed from favorite!');
        }
    } else {
        res.status(500).send('Wrong data');
    }
});

app.delete('/users', (req, res) => {
    const email = req.body.email;
    if (email) {
        const existingUser = users.find((user) => user.email === email);
        if (!existingUser) {
            res.status(400).send('This email was not found');
        } else {
            users = users.filter(user => user !== existingUser);
            res.status(200).send('User removed!');
        }
    } else {
        res.status(500).send('Wrong data');
    }
});

app.get('/movies', (req, res) => {
    res.json(movies);
});

app.get('/movies/:name', (req, res) => {
    const movie = movies.find(movie => movie.title === req.params.name);
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).send('Movie with the title "' + req.params.name + '" was not found.');
    }
});

app.get('/movies/genre/:name', (req, res) => {
    const genreMovies = movies.filter(movie => movie.genre.name === req.params.name);
    res.json(genreMovies);
});

app.get('/movies/directors/:name', (req, res) => {
    const directorMovies = movies.filter(movie => movie.director.name === req.params.name);
    res.json(directorMovies);
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
