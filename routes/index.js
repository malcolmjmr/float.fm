var db = require('../models/dbSchema');
var path = require('path');
var fs = require('fs');

exports.createRoutes = function(app_ref) {
  app = app_ref;
  var passport = app.passport;
  
  // sign up and login 
  app.get('/login', loginPage);
  app.post('/login', localLogin(passport));
  app.get('/signup', signupPage);
  app.post('/signup', localSignup(passport));
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
  app.get('/auth/facebook/callback', fbCallback(passport));
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
  app.get('/auth/google/callback', googleCallback(passport));
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
  app.get('/auth/twitter/callback', twitterCallback(passport));
  app.get('/logout', logout);
  app.get('/', isLoggedIn, sendUser);
  app.get('/sendsong', sendSong);
  //app.get('/account', accountsPage);
  //app.get('/songs/:user', getSongs);
  //app.get('/premiers', premiersPage);
  //app.get('/addSong', addSong);
}
// web pages =============================


function loginPage(req, res) {
  res.render('pages/login.ejs', { message: req.flash('loginMessage') });
}

function signupPage(req, res) {
  res.render('pages/signup.ejs', { message: req.flash('loginMessage') });
}


function logout(req, res) {
  req.logout();
  res.redirect('/');
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/welcome');
}

function sendUser(req, res) {
  var id = req.params.id
  db.user.find({_id: id}, function(err, user) {
    if (err) throw err;

    user 
    res.json(user)
  })
  
}
// functions for getting songs
function sendSong(req, res){
  db.Song.findOne({title: req.query.title}, function(err, song){
    if(err || !song){
      res.status(404).send();
    } else {
      console.log(song.location);
      var root = __dirname.substring(0, __dirname.indexOf('route'));
      
      res.sendfile(path.join(root, encodeURIComponent(song.location)))
  }
  });
}
// passport authentication =================

function localLogin(passport) {
  return passport.authenticate('local-login', {
      successRedirect : '/', 
      failureRedirect : '/login', 
      failureFlash : true 
  });
}

function localSignup(passport) {
  return passport.authenticate('local-signup', {
      successRedirect : '/', 
      failureRedirect : '/signup', 
      failureFlash : true 
  });
}

function fbCallback(passport) {
  return passport.authenticate('facebook', {
      successRedirect : '/', 
      failureRedirect : '/signup', 
      failureFlash : true 
  });
}

function googleCallback(passport) {
  return passport.authenticate('google', {
      successRedirect : '/', 
      failureRedirect : '/signup', 
      failureFlash : true 
  });
}

function twitterCallback(passport) {
  return passport.authenticate('twitter', {
      successRedirect : '/', 
      failureRedirect : '/signup', 
      failureFlash : true 
  });
}
