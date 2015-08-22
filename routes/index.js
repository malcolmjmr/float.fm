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
  app.post('/db', getItemFromDB);
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
  app.get('/auth/facebook/callback', fbCallback(passport));
  app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
  app.get('/auth/google/callback', googleCallback(passport));
  app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
  app.get('/auth/twitter/callback', twitterCallback(passport));
  app.post('/logout', logout);
  app.get('/', isLoggedIn, mainPage);
  app.get('/sendsong', f.sendSong);
  //app.get('cover:id', f.sendCover);
  // app routes 
  app.io.route('ready', f.ready);
  app.io.route('create', f.create);
  app.io.route('update', f.update);
  app.io.route('delete', f.delete);
  app.io.route('getUser', f.getUser);
  app.io.route('get_user_data', f.getUserData);
  app.io.route('download', f.download);

  /*app.io.route('song', {
    create: f.song.create
    update: f.song.update
  });
  app.io.route('group', {
    create: f.group.create,
    update: f.group.update,
    delete: f.group.delete,
    follow: f.group.follow,
    add_item: f.station.addItem,
    remove_item: f.station.removeItem
  });
  app.io.route('station', {
    create: f.station.create,
    update: f.station.update,
    delete: f.station.delete,
    follow: f.station.follow,
    add_item: f.station.addItem,
    remove_item: f.station.removeItem
  });
  app.io.route('playlist', {
    create: f.playlist.create,
    update: f.playlist.update,
    delete: f.playlist.delete,
    follow: f.playlist.follow,
    add_item: f.playlist.addItem
    remove_item: f.playlist.removeItem
  });
  app.io.route('user', {
    create: createUser,
    update: updateUser,
    send_user: sendUser,
    send_library: sendLibrary,
    send_groups: sendGroups,
    send_stations: sendSations,
    library: {
      add_item: addToLibrary,
      remove_item: removeFromeLibrary
    }
  });
  app.io.route('vote', {
    up: upVote,
    down: downVote
  });

  */

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

function addSong(req) {
  var response = {
    data: 'added ' + req.data
  }
  console.log(req.session);
  req.io.emit('song_added', response);
}

function updateSong(song) {

}

function updateUser(user) {
  console.log(req.session);
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
  var response = {};
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { 
      throw err;
    } else if (!user) { 
      response.error = "User does not exist";
    } else {
      req.logIn(user, function(err) {
        if (err) { throw err; }
        response.data = user;
      });
    }
    res.json(response);
  })(req, res, next);
}

function localSignup(req, res, next) {
  var response = {};
  passport.authenticate('local-signup', function(err, user, info) {
    if (err) { throw err; }
    if (user) { 
      response.data = "User already exists"; 
    } else {
      response.data = "Registration complete";
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


