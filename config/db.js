var Datastroe = new('nedb');

module.exports = function(app) {
  app.db = {
    users     : new Datastroe({filename: __dirname + '/dbs/users.db', autoload: true}),
    groups    : new Datastroe({filename: __dirname + '/dbs/groups.db', autoload: true}),
    stations  : new Datastroe({filename: __dirname + '/dbs/stations.db', autoload: true}),
    songs     : new Datastroe({filename: __dirname + '/dbs/songs.db', autoload: true})
  } 
}
