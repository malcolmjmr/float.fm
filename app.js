var express = require('express.io');
var app = express().http().io();
var port = process.env.PORT || 8080;
app.listen(port);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var Yams = require('yams')(session);
var ios = require('express-socket.io-session')(session, {autoSave: true});
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var fs = require('fs');

// configurations 
var configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database
var MongoClient = require('mongodb').MongoClient;
var sessionStore = new Yams(function (callback) {
  //this will be called once, you must return the collection sessions.
  MongoClient.connect(configDB.url, function (err, db) {
    if (err) return callback(err);

    var sessionsCollection = db.collection('sessions')

    //use TTL in mongodb, the document will be automatically expired when the session ends.
    sessionsCollection.ensureIndex({expires:1}, {expireAfterSeconds: 0}, function(){});

    callback(null, sessionsCollection);
  });  
});


require('./config/passport')(app, passport); // attach passport to app
require('./config/db')(app); // attach db to app
require('./config/io')(app); // set up socket.io

// all environments 
app.set('port', port);
app.set('root', __dirname);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('json spaces', 2);
app.set('env', 'development');
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('fly like a butterflfy sting like a bee'));
app.use('/static', express.static(__dirname + '/static'));
app.use(session({
  key   : 'express.sid',
  secret: 'fly like a butterfly sting like a bee',
  store : sessionStore,
  saveUninitialized: false,
  resave: false,
  cookie: {maxAge: 3600000} 
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
//app.io.use(ios(session));
app.use(flash());

console.log(path.join(app.get('root'),'../'));
// routes 
require(__dirname + '/routes').createRoutes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
app.use(function(err, req, res, next) {
  if (err) console.log(JSON.stringify(err));
  res.status(err.status || 500);
  res.render('error.ejs', {
    message: err.message,
    error: err,
    stack: err.stack
  });
});


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error.ejs', {
    message: err.message,
    error: err,
    stack: err.stack
  });
});

