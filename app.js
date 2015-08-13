var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session)
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var fs = require('fs');


var app = express();


// configurations 
var configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(app, passport); // attach passport to app
require('./config/db')(app); // attach db to app
require('./config/io')(app); // set up socket.io

// all environments 
app.set('port', process.env.PORT || 8080);
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
app.use(cookieParser());
app.use('/static', express.static(__dirname + '/static'));
app.use(session({
  //key   : 'express.sid',
  secret: 'fly like a butterfly sting like a bee'
  //store : new MongoStore({mongooseConnection: mongoose.connection}),
  //cookie: {secure: true, expires: new Date(Date.now() + 3600000), maxAge: 3600000}
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());


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

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});