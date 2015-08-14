var passportSocketIo = require("passport.socketio");
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose')

module.exports = function(app, sessionStore) {
  var oldAuth = app.io.get('authorization');
  app.io.set(passportSocketIo.authorize({
    cookieparser:   require('cookie-parser'),
    key:            'express.sid',
    secret:         'fly like a butterfly sting like a bee',
    store:          sessionStore,
    success:        onAuthorizeSuccess,
    fail:           onAuthorizeFail
  }));

  function onAuthorizeSuccess(data, accept){
    console.log('successful connection to socket.io');

    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);
  }

  function onAuthorizeFail(data, message, error, accept){
    if(error)
      throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
  }
};