const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config/database');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const cors = require('cors');
const expressMessages = require('express-messages');
const Category = require('./models/category');
const Stock = require('./models/stock');
mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function () {
  console.log('Connected successfully');
});

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'web')));

// Express session middleware
app.set('trust proxy', 1);
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000, 
    },
}));

// Connect flash middleware
app.use(flash());

require('./config/passport')(passport); // Assuming your Passport configuration is in 'config/passport.js'

// ... other server setup code ...

app.use(passport.initialize());
app.use(passport.session());


// CORS middleware
app.use(cors());
app.use('/assets', express.static('web/assets'));

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
const users = require('./routes/user');

app.use('/user', users);

// Server start
const port = 7500;
app.listen(port, function () {
  console.log('Server is running on port ' + port);
});
