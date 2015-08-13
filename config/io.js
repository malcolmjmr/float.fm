var passportSocketIo = require("passport.socketio");
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose')

module.exports = function(app) {
  app.io = require('socket.io')(app.get('port'));

  app.io.use(passportSocketIo.authorize({
    cookieparser:   require('cookie-parser'),
    key:            'express.sid',
    secret:         'fly like a butterfly sting like a bee',
    store:          new MongoStore({mongooseConnection: mongoose.connection}),
    success:        onAuthorizeSuccess,
    fail:           onAuthorizeFail
  }));

  function onAuthorizeSuccess(data, accept){
    console.log('successful connection to socket.io');

    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);

    // OR

    // If you use socket.io@1.X the callback looks different
    accept();
  }

  function onAuthorizeFail(data, message, error, accept){
    if(error)
      throw new Error(message);
    console.log('failed connection to socket.io:', message);

    // We use this callback to log all of our failed connections.
    accept(null, false);

    // OR

    // If you use socket.io@1.X the callback looks different
    // If you don't want to accept the connection
    if(error)
      accept(new Error(message));
    // this error will be sent to the user as a special error-package
    // see: http://socket.io/docs/client-api/#socket > error-object
  }
};