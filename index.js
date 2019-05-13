var path = require('path');
var express = require('express');
var session = require('express-session'); // Session middleware
var MongoStore = require('connect-mongo')(session); // Store session in mongodb, combined with express - session
var flash = require('connect-flash'); // Middleware for page notification prompts, based on session implementation
var config = require('config-lite')(__dirname);// read the configuration file
var routes = require('./routes'); // routing
var pkg = require('./package');
var winston = require('winston');// logging
var expressWinston = require('express-winston');// logging

var app = express();

//Set the template directory
app.set('views', path.join(__dirname, 'views'));
// Set the template engine to ejs
app.set('view engine', 'ejs');

//Set the static file directory
app.use(express.static(path.join(__dirname, 'public')));

// session middleware
app.use(session({
    name: config.session.key, // Set the field name of the session id in the cookie
    secret: config.session.secret, //  Calculate the hash value by setting the secret and put it in the cookie to make the generated signedCookie tamper - resistant
    resave: true,// Force update session
    saveUninitialized: false, //set to false to force a session to be created even if the user is not logged in 
    cookie: {
        maxAge: config.session.maxAge //Expiration time, the session id in the cookie is automatically deleted after expiration 
    },
    store: new MongoStore({ //store the session to mongodb
        url: config.mongodb// mongodb address
    })
}));
//flash middleware to display notifications
app.use(flash());
//Processing middleware for form and file upload
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),// Upload file directory
    keepExtensions: true// keep the suffix
}));

//Set template global constants, usually load constant information (such as blog name, description, author information) on app.locals, usually load variable information on res.locals 
app.locals.blog = {
    title: 'Hargreeves',
    description: 'Welcome to Hargreeves a library infomation system from Group01!'
};

//Add the three variables required for the template
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});

// The middleware that records the normal request log is placed before the routes(app), and the middleware that records the error request log is placed after the routes(app)
// Normal request log
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));

// routing
routes(app);

// Log of the wrong request
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}));


// error page render
app.use(function (err, req, res, next) {
    res.render('error', {
        error: err
    });
});

//listen port, start the program 
app.listen(config.port, function () {
    console.log(`${pkg.name} listening on port ${config.port}`);
});