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


var functions = {
  ready: function(req) {
    console.log(req);

  },
  create: function(req) { 
    if (isValidRequest(req)) {
      // initialize variables 
      var collection = req.data.item.type;
      var newEntry = new db[collection](req.data.item);
      // save new entry 
      newEntry.save(function(err, entry) {
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
    var queries = {};
    collectionNames.forEach(function(collectionName) {
      response[collectionName] = [];
      queries[collectionName] = {
        notFound: [],
        completed: 0,
        total: null
      };
    });
    // get user 
    db.user.findOne({_id: req.data.userId}, function(err, user) {
      for (var col = 0; col < collectionNames.length; col++) {
        var collectionName = collectionNames[col];
        var collection = user[collectionName];
        var query = {
          collectionName: collectionName,
          notFound: collection,
          total: collection.length
        }; 
        // log query 
        dataManager.emit('collection_query', query); 
        // find each item in a given user collection
        console.log(collectionName);
        console.log(collection.length);
        for (var itemIndex = 0; itemIndex < collection.length; itemIndex++) {
          queries[collectionName].completed++;
          db[collectionName.substr(0, collectionName.length - 1)].findOne({_id: collection[itemIndex]}, function(err, item) {
            if (!err) {
              if (item) {
              // send entry to response if it exist in the db
                dataManager.emit('new_data', item);
              }
            }
          });
        }
      }
    });
    dataManager.on('collection_query', function(query) {
      queries[query.collectionName].notFound = query.notFound;
      queries[query.collectionName].total = query.total;
    });

    //  record completed queries in respsonse and query log
    dataManager.on('new_data', function(item) {
      // remove the item from the 
      // queries.notFound list if item exists
      if (item) {
        var itemType = item.type + 's';
        response[itemType].push(item);
        var itemIndex = queries[itemType].notFound.indexOf(item._id);
        queries[itemType].notFound.splice(itemIndex, 1);
        if (queries[itemType].completed == queries[itemType].total) {
          dataManager.emit('processed_entire_collection', itemType);
        }
      }

    }); 
    // check if all collections have 
    // been processed after each is processed
    dataManager.on('processed_entire_collection', function(collectionName) {
      console.log('processed entire collection: '+collectionName);
      var collectionsProcessed = 0;
      collectionNames.forEach(function(collectionName) {
        if (queries[collectionName].completed === queries[collectionName].total) {
          collectionsProcessed++;
        }
      })
      if (collectionsProcessed === collectionNames.length) {
        console.log('received_all_data');
        dataManager.emit('received_all_data');
      }

    });
    // send responce if all data is received
    dataManager.on('received_all_data', function() {
      req.io.emit('user_data_sent', response);
    });
  },
  download: function(req) {
    var item = req.data.item;
    console.log('downloading file');
    if (isValidRequest(req)) {
      console.log('req is valid');
      switch (req.data.item.from) {
        case 'youtube': break;
        case 'soundcloud': 
          console.log('file is from soundcloud');
          var crawler = new soundcrawler();
          var download = true;
          var url = item.location.hosted;
          crawler.download(url, download, function(err) {
            if (err) throw err;
            else {
              console.log(crawler);
              scres.resolve(url, function(err, tracks) {
                var songInfo = tracks[0];
                var song = new db.song(item);
                song.title = songInfo.title;
                song.markModified('title');
                song.duration = songInfo.duration/1000;
                song.genre = songInfo.genre;
                song.description = songInfo.description;
                song.coverLocation.hosted = songInfo.artwork_url;
                song.artist = songInfo.user.username;
                var locationFormat = song.artist+'/'+song.album+'/';
                mkdirp.sync(path.join(__dirname, '../','tracks/'+locationFormat));
                mkdirp.sync(path.join(__dirname, '../','covers/'+locationFormat))
                song.location.local = 'tracks/'+locationFormat+song.title+'.mp3';
                song.coverLocation.local = 'covers/'+locationFormat+song.title+'.jpeg';
                song.save(function(err, entry) {
                  if (err) throw err;
                  console.log(entry);
                });
                request( crawler.downloadURL, function(error, response, body) {
                  if (error) throw err;

                  if (!response || response.headers['content-length'] == 1) {
                    fs.unlink(crawler.downloadUrl);
                  }
                  var largeCoverUrl = songInfo.artwork_url.replace('large.jpg','t500x500.jpg');
                  request(songInfo.artwork_url, function(error, response, body) {
                    if (error) throw err;

                    fs.exists(path.join(__dirname, '../', song.coverLocation.local), function(exists) {
                      if (!exists) {

                        fs.writeFile(path.join(__dirname, '../', song.coverLocation.local), body, function(err) {
                          if (err) throw err;
                        });
                      }
                    });
                  });
                }).pipe(fs.createWriteStream(path.join(__dirname, '../', song.location.local)));
              })
            }
          });
          break;
        default: 
      }
      if (!req.data.item._id) {
        functions.create(req);
      }
    }
    // 

  },


  // add entry to database 
  addItem: function(collection, item) {
    var entry = new db[collection](item);
    entry.save(function(err) {
      if (err) { throw err; }
    });
  },

  // get entry from database
  getItem: function(collection, item) {
    db[collection].findOne({_id: item._id}, function(err, entry) {
      console.log(entry);
    });
  },

  // update entry in database
  updateItem: function(collection, item) {
    db[collection].update({_id: item._id}, item, function(err) {
      if (err) { throw err; }
    })
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

