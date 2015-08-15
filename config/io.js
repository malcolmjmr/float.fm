var path = require('path');
var root = path.join(__dirname, '..');
var db = require('./../models/dbSchema.js');

module.exports = function(app) {

  app.io.use(function (socket, next) {
    var cookie = socket.headers.cookie;
    var sidPrefix = 'express.sid=s%3A';
    var sidPosition =  cookie.indexOf(sidPrefix);
    var sidRaw = cookie.substr(sidPosition + sidPrefix.length, cookie.length);
    var sidEnd = sidRaw.indexOf('.');
    var sid = sidRaw.substr(0, sidEnd);

    db.Session.findOne({_id: sid}, function (err, doc) {
      var session = JSON.parse(doc.session);
      if (session.passport.user) {
        next();
      }
    })
    next(new Error('not authorized'));
  });

};