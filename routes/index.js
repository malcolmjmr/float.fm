var db = require('../models/dbSchema');
var passport = require('passport');
var path = require('path');
var fs = require('fs');

app = null;

exports.createRoutes = function(app_ref) {
  app = app_ref;

  // sign up and login requests
  app.get('/welcome', welcomePage) 
  app.post('/login', localLogin);
  app.post('/signup', localSignup);
  app.post('/db', getItemFromDB)
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
  app.get('/auth/facebook/callback', fbCallback(passport));
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
  app.get('/auth/google/callback', googleCallback(passport));
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
  app.get('/auth/twitter/callback', twitterCallback(passport));
  app.get('/logout', logout);
  app.get('/', isLoggedIn, sendUser);
  app.get('/sendsong', sendSong);
  // app data 
  //app.io.on('save_song', saveSong);
  //app.io.on('update_song', updateSong);
  //app.io.on('update_user', updateUser);
  //app.io.on('send_user', sendUser);
  //app.io.on('create_group', createGroup);
  //app.io.on('send_group', sendGroup);
  //app.io.on('update_group', updateGroup);
  //app.io.on('create_station', createStation);
  //app.io.on('send_station', sendStation);
  //app.io.on('update_station', updateStation);

  //app.get('/account', accountsPage);
  //app.get('/songs/:user', getSongs);
  //app.get('/premiers', premiersPage);
  //app.get('/addSong', addSong);
}
// web pages =============================

function welcomePage(req, res) {
  res.render('index.html');
}


function logout(req, res) {
  req.logout();
  res.redirect('/');
}

function isLoggedIn(req, res, next) {
  console.log(req.session);
  if (req.isAuthenticated())
    return next();
  res.redirect('/welcome');
}

function sendUser(req, res) {
  db.User.find({_id: req.id}, function(err, user) {
    if (err) throw err;
    console.log(user + err);
    res.json(JSON.stringify(user));
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

// app.io requests 
function saveSong(req, res) {
  song = new db.song;
}

// Look up database entries
function getItemFromDB(req, res) {

}
// passport authentication =================

function localLogin(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/welcome'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var response = {
        error: err,
        data: JSON.stringify(user)
      }
      return res.json(response);
    });
  })(req, res, next);
}

function localSignup(passport) {
  return passport.authenticate('local-signup', {
      successRedirect : '/', 
      failureRedirect : '/welcome', 
      failureFlash : true 
  });
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
