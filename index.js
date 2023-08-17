const express = require('express');
const morgan = require('morgan');

const app = express();
const port = 8080;

// Middleware
app.use(express.json()); // For parsing JSON data
app.use(morgan('dev'));  // Using Morgan for request logging
app.use(express.static('public')); // Serve static files

app.get('/movies', (req, res) => {
  const topMovies = [
    {
        title: ' The Shawshank Redemption',
        rating: 9.3,
    },
    {
        title: ' The Green Mile',
        rating: 8.6,
    },
     {
        title: ' Forrest Gump',
        rating: 8.8,
    }, 
    {
        title: ' The Departed',
        rating: 8.5,
    },
     {
        title: ' Law Abiding Citizen',
        rating: 7.4,
    },
    {
        title: ' Inception',
        rating: 8.8,
    },
    {
        title: 'Black Swan',
        rating: 8.0,
    },
    {
        title: ' The Truman Show',
        rating: 8.2,
    },
    {
        title: ' Shutter Island',
        rating: 8.2,
    },
    {
        title: ' Interstellar',
        rating: 8.7,
    },
  ];
  res.json(topMovies);
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
