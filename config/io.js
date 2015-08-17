var db = require('./../models/dbSchema.js');

module.exports = function(app) {

  app.io.use(function (socket, next) {
    var cookie = socket.headers.cookie;
    var sidPrefix = 'express.sid=s%3A';
    var sidPosition =  cookie.indexOf(sidPrefix);
    var sidRaw = cookie.substr(sidPosition + sidPrefix.length, cookie.length);
    var sidEnd = sidRaw.indexOf('.');
    var sid = sidRaw.substr(0, sidEnd);

    db.session.findOne({_id: sid}, function (err, doc) {
      if (!err) {
        var session = JSON.parse(doc.session);
        if (session.passport.user) {
          socket.secure = true;
          if (socket.session === undefined) {
            socket.session = doc;
          }
          next();
        }
      }    
    })

  });

};