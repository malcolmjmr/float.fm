var Datastore = require('nedb');

module.exports = function(app) {
  app.db = {
    users     : new Datastore({filename: __dirname + '/dbs/users.db', autoload: true}),
    groups    : new Datastore({filename: __dirname + '/dbs/groups.db', autoload: true}),
    stations  : new Datastore({filename: __dirname + '/dbs/stations.db', autoload: true}),
    songs     : new Datastore({filename: __dirname + '/dbs/songs.db', autoload: true}),
    sessions  : new Datastore({filename: __dirname + '/dbs/sessions.db', autoload: true})
  } 
}
