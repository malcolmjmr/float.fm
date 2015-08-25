var db = require('../models/dbSchema');
var passport = require('passport');
var path = require('path');
var f = require('./functions');

app = null;

exports.createRoutes = function(app_ref) {
  app = app_ref;

  // sign up and login requests
  app.get('/welcome', welcomePage) 
  app.post('/login', localLogin);
  app.post('/signup', localSignup);
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
  app.get('/auth/facebook/callback', fbCallback(passport));
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
  app.get('/auth/google/callback', googleCallback(passport));
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
  app.get('/auth/twitter/callback', twitterCallback(passport));
  app.post('/logout', logout);
  app.get('/', isLoggedIn, mainPage);
  app.get('/sendsong', f.sendSong);
  //app.get('cover', f.sendCover);
  // app routes 
  app.io.route('ready', f.ready);
  app.io.route('create', f.create);
  app.io.route('update', f.update);
  app.io.route('delete', f.delete);
  app.io.route('get_user_data', f.getUserData);
  app.io.route('get_item', f.getItem);
  app.io.route('get_collection', f.getCollection);
  app.io.route('subscribe', f.subscribe);
  app.io.route('unsubscribe', f.unsubscribe);
  app.io.route('broadcast', f.broadcast);
  app.io.route('download', f.download);
}
// web pages =============================


function welcomePage(req, res) {
  req.session.loginDate = new Date().toString();
  res.render('index.html');
}

function mainPage(req, res) {
  res.render('index.html');
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/welcome');
}

function logout(req, res) {
  req.logout();
  res.redirect('/welcome');
}


// passport authentication =================

function localLogin(req, res, next) {
  var response = {};
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { 
      throw err;
    } else if (!user) { 
      response.error = "User does not exist";
    } else {
      req.logIn(user, function(err) {
        if (err) { 
          console.log(err); 
          response.error = err;
        } else {
          response.isLoggedIn = user;
        }
      });
    }
    res.json(response);
  })(req, res, next);
}

function localSignup(req, res, next) {
  var response = {};
  passport.authenticate('local-signup', function(err, user, info) {
    console.log(info);
    if (err) { 
      consoel.log(err);
      response.error = err;
    } else if (user) { 
      response.error = "User already exists"; 
    } else {
      response.isLoggedIn = true;
    }
    res.json(response);
  })(req, res, next);
}

function fbCallback(passport) {
  return passport.authenticate('facebook', {
      successRedirect : '/', 
      failureRedirect : '/welcome', 
      failureFlash : true 
  });
}

function googleCallback(passport) {
  return passport.authenticate('google', {
      successRedirect : '/', 
      failureRedirect : '/welcome', 
      failureFlash : true 
  });
}

function twitterCallback(passport) {
  return passport.authenticate('twitter', {
      successRedirect : '/', 
      failureRedirect : '/welcome', 
      failureFlash : true 
  });
}


