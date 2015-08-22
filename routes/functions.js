var db = require('../models/dbSchema');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var soundcrawler = require('soundcrawler');
var SoundcloudResolver = require('soundcloud-resolver');
var scres = new SoundcloudResolver(require('../config/auth').soundcloudAuth.clientID);
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var md5 = require('md5');
var root = path.join(__dirname, '../');


var functions = {
  ready: function(req) {
    console.log(req);
  },
  sendUser: function(req) {
    var session = JSON.parse(req.session.session);
    if(session.passport.user === req.data.userId) {
      db.user.findOne({_id: req.data.userId}, function(err, user) {
        if (!err) {
          req.io.emit('user_sent', user);
        }
      })
    }
  },
  create: function(req) { 
    if (isValidRequest(req)) {
      // initialize variables 
      var collection = req.data.item.type;
      var newEntry = new db[collection](req.data.item);
      // save new entry 
      newEntry.save(function(err, entry) {
        console.log('saved entry: '+entry._id);
        req.io.emit('created_'+ collection, entry);
        // update users txn record
        db.user.findOne({_id: req.data.userId},  function(err, user) {
          user[collection+'s'].push(entry._id);
          var txn = {
            operation: 'create',
            collection: collection,
            itemId: entry._id,
            createdOn: new Date(Date.now()),
          };
          user.txnHistory.push(txn);
          user.save(function(err, update) {
            if (!err) {
              req.io.emit('updated_user_'+collection+'s', update);
            }
          });
        });
      });
    } 
  },
  update: function(req) {
    if (isValidRequest(req)) {
      var collection = req.data.item.type;

      // get item from collection 
      db[collection].findOne({_id: req.data.item._id}, function (err, entry) {
        if (err) throw err;
        console.log('updated'+entry._id);
        // update item
        for (element in req.data.item) {
          entry[element] = req.data.item[element];
        }
        // save item 
        entry.save(function(err) {
          req.io.emit('updated_'+ collection, entry);
          db.user.findOne({_id: req.data.userId},  function(err, user) {
            
            var txn = {
              operation: 'update',
              collection: collection,
              itemId: entry._id,
              createdOn: new Date(Date.now()),
            };
            user.txnHistory.push(txn);
            user.save(function(err, update) {
              if (!err) {
                req.io.emit('updated_user_'+collection+'s', update);
              }
            });
          });
        })
      })

    }
  },
  delete: function(req) {
    if(isValidRequest(req)) {

    }
  },
  getUserData: function(req) {
    // initiat variebles
    var response = {};
    var dataManager = new EventEmitter();
    var collectionNames = ['songs','groups','stations'];
    // get user 
    db.user.findOne({_id: req.data.userId}, function(err, user) {
      for (var col = 0; col < collectionNames.length; col++) {
        var collectionName = collectionNames[col];
        var collection = user[collectionName];
        for (var itemIndex = 0; itemIndex < collection.length; itemIndex++) {
          db[collectionName.substr(0, collectionName.length - 1)].findOne({_id: collection[itemIndex]}, function(err, item) {
            if (!err) {
              if (item) {
              // send entry to response if it exist in the db
                req.io.emit('new_item_details', item);
              }
            }
          });
        }
      }
    });
  },
  download: function(req) {
    var item = req.data.item;
    console.log('downloading file: '+item.location.hosted);
    if (isValidRequest(req)) {
      console.log('req is valid');
      switch (req.data.item.from) {
        case 'youtube': break;
        case 'soundcloud': 
          console.log('file is from soundcloud');
          var crawler = new soundcrawler();
          var download = false;
          var url = item.location.hosted;
          crawler.download(url, download, function(err) {
            if (err) throw err;
            else {
              scres.resolve(url, function(err, tracks) {
                var songInfo = tracks[0];
                req.data.item.title = songInfo.title;
                req.data.item.duration = songInfo.duration/1000;
                req.data.item.genre = songInfo.genre;
                req.data.item.description = songInfo.description;
                req.data.item.coverLocation.hosted = songInfo.artwork_url;
                req.data.item.artist = songInfo.user.username;
                var locationFormat = req.data.item.artist+'/'+req.data.item.album+'/';
                mkdirp.sync(path.join(__dirname, '../','tracks/'+locationFormat));
                mkdirp.sync(path.join(__dirname, '../','covers/'+locationFormat))
                req.data.item.location.local = 'tracks/'+locationFormat+req.data.item.title+'.mp3';
                req.data.item.coverLocation.local = 'covers/'+locationFormat+req.data.item.title+'.jpeg';
                
                request( crawler.downloadURL, function(error, response, body) {
                  if (error) throw err;

                  if (!response || response.headers['content-length'] == 1) {
                    fs.unlink(crawler.downloadUrl);
                  }
                  var largeCoverUrl = songInfo.artwork_url.replace('large.jpg','t500x500.jpg');
                  request(songInfo.artwork_url, function(error, response, body) {
                    if (error) throw err;

                    fs.exists(path.join(__dirname, '../', req.data.item.coverLocation.local), function(exists) {
                      if (!exists) {

                        fs.writeFile(path.join(__dirname, '../', req.data.item.coverLocation.local), body, function(err) {
                          if (err) throw err;
                          var operation = 'create';
                          if (req.data.item._id) {
                            operation = 'update';
                          }
                          req.data.item = item;
                          functions[operation](req);
                        });
                      }
                    });
                  });
                }).pipe(fs.createWriteStream(path.join(__dirname, '../', req.data.item.location.local)));
              })
            }
          });
          break;
        default: 
      }
    }
  },

  sendSong: function(req, res, callback) {
    console.log(req.query.id);
    db.song.findOne({_id: req.query.id}, function(err, song){
      if(err || !song){
        res.status(404).send();
      } else {     
        console.log(song); 
        res.sendfile(path.join(root, encodeURIComponent(song.location.local)));
      }
    });
  }
};

module.exports = functions;

var isValidRequest = function(req) {
  var session = JSON.parse(req.session.session)
  console.log(session);
    var isUser = false;
    var correctData = false;
    if (req.data.userId && req.data.item) {
      isUser = (session.passport.user === req.data.userId);
      for (collection in db) {
        if (collection === req.data.item.type) { correctData = true; }
      }
    }
    return (isUser && correctData);
};

/*
var correctUser = function(userId, callback) {
  var collectionNames = ['songs','groups','stations'];
  var queries = {};
  collectionNames.forEach(function(collectionName) {
    queries[collectionName] = {
      notFound: [],
      completed: 0,
      total: null
    };
  });
  db.user.findOne({_id: userId}, function(err, user) {
    var dataManager = new EventEmitter();
    collectionNames.forEach(function(collectionName){
      queries[collectionName].total = user[collectionName].length();
      user[collectionName].forEach(function(itemId) {
        queries[collectionName].notFound.push(itemId);
        db[collectionName.substr(0,collectionName.length - 1)].findOne({_id: itemId}, function(err, item) {
          queries[collectionName].completed++;
          dataManager.emit('query', item);
        });
      })
    })
    dataManager.on('query', function(item){
      console.log(queireis);
      if (item) {
        queries[item.type+'s'].notFound.splice(queries[item.type+'s'].notFound.indexOf(item._id), 1);
      }
      var collectionsComplete = 0;
      for (collectionName in queries) {
        var finished = queries[collectionName].completed == queries[collectionName].total;
        if (finished) {
          collectionsComplete++;
          if (queries[collectionName].notFound.length > 0)
            queries[collectionName].notFound.forEach(function(item) {
              db.user.findOne({_id:userId}, function(err, user) {
                user[collectionName].splice(user[collectionName].indexOf(user[collectionName][item], 1));
                user.save(function(err){
                  dataManager.emit('finished_collection')
                })
              })
            })
          } else {
            dataManager.emit('finished_collection')
          }
        }
      }
      if (collectionsComplete === collectionNames.length) {
        dataManager.emit()
      }
    });
  })
}
*/
var editUserData = function(req, entry) {

}

