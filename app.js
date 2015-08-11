var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');


var app = express();

// configurations 
// var configDB = require('./config/database.js');
// mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(app, passport); // attach passport to app
require('./config/db')(app) // attach db to app

// all environments 
app.set('port', process.env.PORT || 8080);
app.set('root', __dirname);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('json spaces', 2);
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'fly like a butterfly sting like a bee'}));
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
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});