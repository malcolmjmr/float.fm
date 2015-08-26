var db = require('../models/dbSchema');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var soundcrawler = require('soundcrawler');
var SoundcloudResolver = require('soundcloud-resolver');
var scID = require('../config/auth').soundcloudAuth.clientID
var scres = new SoundcloudResolver(scID);
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var md5 = require('md5');
var root = path.join(__dirname, '../');
var musicDir = path.join(root, '/tracks/');
var coverDir = path.join(root, '/covers/');
var ffmpeg = require('fluent-ffmpeg');
var ytdl = require('ytdl-core');
var async = require('async');


var routes = {
  ready: function(req) {
    sessionUser = JSON.parse(req.session.session).passport.user
    db.user.findOne({_id: sessionUser}, function (err, user) {
      if (err) {
        console.log(err);
        req.io.emit('error', {
          type: 'db',
          message: err 
        });
      } else {
        req.io.emit('db_item_details', user);
      }
    })
  },
  getItem: function(req) {
    if (isValidRequest(req)) {
      var sessionUser = JSON.parse(req.session.session).passport.user;
      var collection = req.data.item.type;
      var viewableItem = {
        _id: req.data.item._id,
        type: req.data.item.type
      };
      db[collection].findOne({_id: req.data.item._id}, function (err, item) {
        if (err) {
          console.log(err);
          req.io.emit('error', {
            type: 'db',
            message: err
          });
        } else {
          switch(item.type) {
            case 'user': 
              // check if requested user is session user
              if (item._id == sessionUser) {
                req.io.emit('db_item_details', item);
              
              // check if requested user is a friend
              } else if (item.settings.viewableByFriends.length > 0) {
                item.friends.forEach(function (friendIndex) { 
                  
                  // if user is a friend 
                  if (item.friends[friendIndex] === item._id) {
                    var viewableItems = item.settings.viewableByFriends;
                    for (var i = 0; i < viewableItems.length; i++) {
                      viewableItem[viewableItems[i]] = item[viewableItems[i]];
                    }
                    req.io.emit('db_item_details', viewableItem);
                  }
                });
              // check if requested user has public data
              } else if (item.settings.viewableByPublic.length > 0) {
                var viewableItems = item.settings.viewableByPublic;
                for (var i = 0; i < viewableItems.length; i++) {
                  viewableItem[viewableItems[i]] = item[viewableItems[i]];
                }
                req.io.emit('db_item_details', viewableItem);

              } else {
                var error = {
                  type: 'db_access',
                  message: 'access denied'
                };
                req.io.emit('error', error);
              }

              break;
            case 'goup': 
              // check if user is active member of group
              var isMember = false;
              item.members.forEach(function (member) {
                if (sessionUser === member) {
                  isMember = true;
                }
              })
              if (isMember) {
                req.io.emit('db_item_details', item);
              // check if group has public data
              } else if (item.settings.viewableByPublic.length > 0) {
                var viewableItems = item.settings.viewableByPublic
                for (var i = 0 ; i < viewableItems.length; i++) {
                  viewableItem[viewableItems[i]] = item[viewableItems[i]];
                }
              } else {
                var error = {
                  type: 'db_access',
                  message: 'access denied'
                };
                req.io.emit('error', error);
              }
              break;
            default:
              req.io.emit('db_item_details', item);
          }
          
        }
      });
    }
  },
  getCollection: function(req) {
    if (isValidRequest(req)) {
      db[req.data.item.type].find({}, function (err, collection){
        if (err) {
          req.io.emit('error', {
            type: 'db',
            message: err
          });
        } else {
          var data = {
            name: req.data.item.type,
            items: collection
          }
          req.io.emit('db_collection', data);
        }
      });
    }
  },
  create: function(req) { 
    if (isValidRequest(req)) {
      // initialize variables 
      var collection = req.data.item.type;
      var newEntry = new db[collection](req.data.item);
      // save new entry 
      newEntry.save(function (err, item) {
        if (err) {
          req.io.emit('error', {
            type: 'db',
            message: err
          });
        } else {
          console.log('saved '+collection+' entry: '+item._id);
          req.io.emit('db_item_details', item);
          // update users txn record
          db.user.findOne({_id: req.data.userId},  function (err, user) {
            user[collection+'s'].push(item._id);
            var txn = {
              operation: 'create',
              collection: collection,
              itemId: item._id,
              createdOn: new Date(Date.now()),
              createdBy: req.data.userId
            };
            user.txnHistory.push(txn);
            user.save(function (err, updateUser) {
              if (!err) {
                req.io.emit('db_item_details', updatedUser);
              }
            });
          });
        }
      });
    } 
  },
  update: function(req) {
    if (isValidRequest(req)) {
      var collection = req.data.item.type;

      // get item from collection 
      db[collection].findOne({_id: req.data.item._id}, function (err, item) {
        if (err) throw err;
        console.log('updated '+collection+' entry:'+item._id);
        // update item
        for (element in req.data.item) {
          item[element] = req.data.item[element];
        }
        // save item 
        item.save(function(err) {
          req.io.room(item.type+item._id).broadcast('db_item_details', item);
          req.io.emit('db_item_details', item);
        })
      })

    }
  },
  delete: function(req) {
    if(isValidRequest(req)) {

    }
  },
  getUserData: function(req) {
    var collectionNames = ['songs','hashtags','groups'];
    // get user 
    db.user.findOne({_id: req.data.userId}, function(err, user) {
      if (err) {
        console.log(err);
        req.io.emit('error', {
          type: 'db',
          message: err
        });
      } else {
        for (var col = 0; col < collectionNames.length; col++) {
          var collectionName = collectionNames[col];
          var collection = user[collectionName];
          for (var itemIndex = 0; itemIndex < collection.length; itemIndex++) {
            db[collectionName.substr(0, collectionName.length - 1)].findOne({_id: collection[itemIndex]}, function(err, item) {
              if (err) {
                console.log(err);
                req.io.emit('error', {
                  type: 'db',
                  message: err
                })
              } else {
                if (item) {
                // send entry to response if it exist in the db
                  req.io.emit('db_item_details', item);
                }
              }
            });
          }
        } 
      }
    });
  },
  download: function(req) {
    if (isValidRequest(req)) {
      var item = req.data.item;
      var url = req.data.item.location.origin;
      switch (req.data.item.from) {
        case 'youtube': 
        var downloadLocation = null;
          mkdirp(musicDir, function(){
            async.waterfall([
              function(callback) {
                ytdl.getInfo(url, function(err, currentTrack) {
                  if(!err) {
                    var dashpos = currentTrack.title.indexOf('-');
                    var title = currentTrack.title;
                    var artist = currentTrack.title;

                    // if there is a dash, set them in the assumed format [title] - [artist]
                    if(dashpos != -1){
                      title = currentTrack.title.substr(dashpos + 1);
                      if (title[0] === " ") {
                        title = title.substr(1)
                      }
                      artist = currentTrack.title.substr(0, dashpos);
                      if (artist[artist.length - 1] === " ") {
                        artist = artist.substr(0, artist.length - 1);
                      }
                    }
                    
                    req.data.item.title = title;
                    req.data.item.duration = currentTrack.length_seconds;
                    req.data.item.genre = currentTrack.genre || 'Unkown';
                    //req.data.item.description = currentTrack.description;
                    req.data.item.coverLocation.origin = currentTrack.iurl;
                    req.data.item.artist = artist;
                    currentTrack.keywords.forEach(function(keyword) {
                      req.data.item.hashtags.push(keyword);
                    })
                    var locationFormat = req.data.item.artist+'/'+req.data.item.album+'/';
                    mkdirp.sync(path.join(musicDir+locationFormat));
                    mkdirp.sync(path.join(coverDir+locationFormat));
                    req.data.item.location.local = 'tracks/'+locationFormat+req.data.item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()+'.mp3';
                    req.data.item.coverLocation.local = 'covers/'+locationFormat+req.data.item.title+'.jpeg';
                    downloadLocation = path.join(root, req.data.item.location.local);
                    fs.exists(downloadLocation, function(exists) {
                      if(!exists) {
                        callback();
                      } else {
                        callback(true, {
                          message: "Youtube track already exists."
                        });
                      }
                    });
                  } else {
                    callback(true, {
                      message: "Error fetching info: " + err
                    });
                  }
                });
              },
              function(callback) {
                ffmpeg(ytdl(url, {
                    quality: "highest",
                    filter: function(format) { return format.resolution === null; }
                  }))
                  .noVideo()
                  .audioCodec('libmp3lame')
                  .on('start', function() {
                    console.log("Started converting Youtube movie to mp3");
                  })
                  .on('end', function() {
                    callback(false);
                  })
                  .on('error', function(err) {
                    callback(err, {message: err});
                  })
                  .save(downloadLocation);
              }
            ], function(error, errorMessage) {
              if(!error) {
                var operation = 'create';
                if (req.data.item._id) {
                  operation = 'update';
                }
                routes[operation](req);
              } else {
                console.log("Error: " + errorMessage.message);
              }
            });
          });
          break;
        case 'soundcloud': 
          scres.resolve(url, function(err, tracks) {
            if (err) {
              console.log(err);
            } else {
              var not_streamable = 0;
              for(var x = 0; x < tracks.length; x++){
                if(!tracks[x].streamable){
                  // remove it and modify the index
                  tracks.splice(x, 1);
                  x--;
                  // increment not streamable
                  not_streamable++;
                }
              }
              async.until(function(){ return tracks.length === 0; }, function(callback) {
                var currentTrack = tracks.pop();
                var dashpos = currentTrack.title.indexOf('-');
                var title = currentTrack.title;
                var artist = currentTrack.user.username;

                // if there is a dash, set them in the assumed format [title] - [artist]
                if(dashpos != -1){
                  title = currentTrack.title.substr(dashpos + 1);
                  if (title[0] === " ") {
                    title = title.substr(1)
                  }
                  artist = currentTrack.title.substr(0, dashpos);
                  if (artist[artist.length - 1] === " ") {
                    artist = artist.substr(0, artist.length - 1);
                  }
                }
                // get hashtags
                var tags = currentTrack.tag_list.split('');
                var tagStarted = false;
                var hashtag = '';
                while (tags.length > 0) {
                  var character = tags.shift();
                  switch (character) {
                    case '"': 
                      if (tagStarted) {
                        tagStarted = false;
                        req.data.item.hashtags.push(hashtag.toLowerCase());
                        hashtag = '';
                      } else {
                        tagStarted = true;
                      }
                      break;
                    case ' ': break;
                    default: 
                      if (tagStarted) {
                        hashtag += character;
                      }
                  }
                } 
                req.data.item.title = title;
                req.data.item.duration = currentTrack.duration/1000;
                req.data.item.genre = currentTrack.genre;
                req.data.item.description = currentTrack.description;
                req.data.item.coverLocation.origin = currentTrack.artwork_url;
                req.data.item.artist = artist;
                var locationFormat = req.data.item.artist+'/'+req.data.item.album+'/';
                mkdirp.sync(path.join(musicDir+locationFormat));
                req.data.item.location.hosted = 'tracks/'+locationFormat+req.data.item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()+'.mp3';
                
                var location = path.join(root, req.data.item.location.hosted);
                var finished = false;
                fs.exists(location, function(exists) {
                  if (!exists) {
                    request(currentTrack.stream_url+"?client_id="+scID, function(err, res, body) {
                      if (res.headers['content-length'] == 1) {
                        fs.unlink(location);
                      } else if (currentTrack.artwork_url) {
                        var coverUrl = currentTrack.artwork_url.replace('large.jpg', 't500x500.jpg');
                        request({url: coverUrl, encoding: null}, function (err, res, body) {
                          req.data.item.coverLocation.hosted = 'covers/'+md5(body)+'.jpeg';
                          var fileName = path.join(root, req.data.item.coverLocation.hosted);
                          fs.exists(fileName, function (exists) {
                            if (!exists) {
                              fs.writeFile(fileName, body, function (err) {
                                if (err) throw err;
                                routes.create(req);
                              })
                            } else {
                              req.data.item.coverLocation.hosted = null;
                              routes.create(req);
                            }
                          });
                        });
                      }
                    }).pipe(fs.createWriteStream(location));
                  }
                });
              });
            }
          });
          break;
        default: 
      }
    }
  },

  sendSong: function(req, res, callback) {
    db.song.findOne({_id: req.query.id}, function(err, song){
      if(err || !song){
        res.status(404).send();
      } else {     
        res.sendfile(path.join(root, encodeURIComponent(song.location.hosted)));
      }
    });
  },
  subscribe: function(req) {
    var sessionUser = JSON.parse(req.session.session).passport.user;
    req.io.join(req.data);
    console.log(sessionUser+' joined '+req.data);
  },
  unsubscribe: function(req) {
    var sessionUser = JSON.parse(req.session.session).passport.user;
    req.io.leave(req.data);
    console.log(sessionUser+' left '+req.data);
  },
  broadcast: function(req) {
    var sessionUser = JSON.parse(req.session.session).passport.user;
    req.data.from = sessionUser;
    req.io.room(req.data.room).broadcast(req.data.event, req.data);
  },
  message: function(req) {
    console.log('got message');
    console.log(req.data);
  }
};

module.exports = routes;

var isValidRequest = function(req) {
  var session = JSON.parse(req.session.session)
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

