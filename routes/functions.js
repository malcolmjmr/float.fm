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
    var sessionUser = JSON.parse(req.session.session).passport.user;
    db.user.findOne({_id: sessionUser}, function (err, user) {
      if (err) {
        console.log(err);
        req.io.emit('error', {
          type: 'db',
          message: err 
        });
      } else {
        req.io.emit('db_item_details', removeSensitiveData(user));
      }
    })
  },
  // Get details of individual db items =================================
  getItem: function(req) {
    if (isValidRequest(req)) {
      console.log('getting item: '+req.data);
      var collectionName = req.data.split(':')[0];
      var id = req.data.split(':')[1];
      var viewableItem  = {};
      // if the request is valid get item from the database
      db[collectionName].findOne({_id: id}, function (err, item) {
        if (err) {
          console.log(err);
          req.io.emit('error', {
            type: 'db',
            message: err
          });
        } else { 
          if (item) {
            // if no errors, edit how the item is viewed 
            // depending on who is making the request 
            switch(item.type) {
              case 'user': viewableItem = getUser(req, item); break;
              case 'song': viewableItem = getSong(req, item); break;
              case 'station': viewableItem = getStation(req, item); break;
              case 'hashtag': viewableItem = getHashtag(req, item); break;
              case 'group': viewableItem = getGroup(req, item); break;
            }
            // send the edited item to the client 
            req.io.emit('db_item_details', removeSensitiveData(viewableItem));
          }
            
        }
      });
    }
  },
  // Get an entire collection from the db ===============================
  getCollection: function(req) {
    if (isValidRequest(req)) {
      var collectionName = req.data.type; 
      // if the request is valid get the collection from the database
      db[collectionName].find({}, function (err, collection) {
        if (err) {
          req.io.emit('error', {
            type: 'db',
            message: err
          });
        } else {
          // if no errors, send the collection to the client
          collection.forEach(function (item) {
            var itemLabel = item.type+':'+item._id
            req.data = itemLabel;
            routes.getItem(req)
          })
        }
      });
    }
  },
  // Create new item in the database ====================================
  create: function(req) { 
    if (isValidRequest(req)) {
      var sessionUser = JSON.parse(req.session.session).passport.user;
      var collectionName = req.data.item.type;
      
      var newEntry = new db[collectionName](req.data.item);
      newEntry.createdOn = Date.now();
      newEntry.createdBy = 'user:'+sessionUser;
      newEntry.save(function (err, item) {
        if (err) {
          console.log(err);
        } else {
          req.data = createLabel(item);
          routes.getItem(req);
          db.user.findOne({_id: sessionUser}, function (err, user) {
            if (err) {
              console.log(err);
            } else {
              var update = {
                operation: 'add',
                collection: collectionName+'s',
                item: createLabel(item)
              };

              saveTxn(req, user, update);
            }
          });
        } 
      });
    }
  },
  // Update item in the database ========================================
  update: function(req) {
    if (isValidRequest(req)) {

      var collection = req.data.itemLabel.split(':')[0];
      var id = req.data.itemLabel.split(':')[1];
      var updates = req.data.updates;

      // find the item that needs to be updated
      db[collection].findOne({_id: id}, function (err, item) {
        if (err) {
          console.log(err);
        } else {
          // update item based on the type of item, 
          // the txn details and the user permissions
          switch (item.type) {
            case 'user': 
              updates.forEach(function (update) {
                updateUser(req, item, update);
              });
              break;
            case 'song': 
              updates.forEach(function (update) {
                updateSong(req, item, update); 
              });
              break;
            case 'group': 
              updates.forEach(function (update) {
                updateGroup(req, item, update);
              }); 
              break;
            case 'hashtag': 
              updates.forEach(function (update) {
                updateHashtag(req, item, update);
              });
              break;
            case 'station': 
              updates.forEach(function (update) {
                updateStation(req, item, update); 
              }); 
              break;
          }
        }  
      });
    }
  },
  // Delete item from the database ======================================
  delete: function(req) {
    if(isValidRequest(req)) {

    }
  },
  // Get all the details for user items =================================
  getUserData: function(req) {
    var collectionNames = ['songs','hashtags','groups','friends'];
    var sessionUser = JSON.parse(req.session.session).passport.user;
    // find session user in the database
    db.user.findOne({_id: sessionUser}, function(err, user) {
      if (err) {
        console.log(err);
        req.io.emit('error', {
          type: 'db',
          message: err
        });
      } else {
        // if no errors, find each item within the aforementioned collectionNames
        for (var col = 0; col < collectionNames.length; col++) {
          var collectionName = collectionNames[col];
          var collection = user[collectionName];
          for (var itemIndex = 0; itemIndex < collection.length; itemIndex++) {
            req.data = collection[itemIndex];
            routes.getItem(req);
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
    console.log(req.data);
    var sessionUser = JSON.parse(req.session.session).passport.user;
    req.data.from = sessionUser;
    if (req.data.event === 'update_player_state') {
      db.station.findOne({name: req.data.room }, function (err, station) {
        if (err) {
          console.log(err);
        } else if (station) {
          station.state = req.data.state;
          station.save(function(err) {
            if (err) {
              console.log(err);
            }
          });
        } else {
          var newStation = new db.station({name: req.data.room, state: req.data.state});

          newStation.save(function(err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
    req.io.room(req.data.room).broadcast(req.data.event, req.data);
  },
  message: function(req) {
    console.log('got message');
    console.log(req.data);
  }
};

module.exports = routes;

var isValidRequest = function(req) {
  var correctData = false;
  var itemType = null;

  if (req.data.item) {
    itemType = req.data.item.type;
  } else if (req.data.itemLabel) {
    itemType = req.data.itemLabel.split(':')[0];
  } else if (req.data.type) {
    itemType = req.data.type;
  } else if (typeof req.data === 'string') {
    itemType = req.data.split(':')[0];
  }
  for (collection in db) {
    if (collection === itemType) { correctData = true; }
  }
  return correctData;
};

// Get data from db ===================================================
var getUser = function(req, item) {
  console.log('Getting user: '+item._id);
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var viewableItem = {
    _id: item._id,
    type: item.type,
    status: item.status,
    name: item.firstName
  };

  // check if requested user is session user
  if (item._id === sessionUser) {
    viewableItem = item;
  // check if requested user is a friend
  } else if (item.settings.viewableByFriends.length > 0) {
     var isFriend = item.friends.indexOf('user:'+sessionUser) >= 0;
     console.log('is a friend: '+isFriend);
    // if user is a friend 
    if (isFriend) {
      var viewableItems = item.settings.viewableByFriends;
      for (var i = 0; i < viewableItems.length; i++) {
        var collectionName = viewableItems[i];
        viewableItem[collectionName] = item[collectionName];
      }
    }
  // check if requested user has public data
  } else if (item.isPublic && item.settings.viewableByPublic.length > 0) {
    var viewableItems = item.settings.viewableByPublic;
    for (var i = 0; i < viewableItems.length; i++) {
      var collectionName = viewableItems[i];
      viewableItem[collectionName] = item[collectionName];
    }
  } else {
    var error = {
      type: 'db_access',
      message: 'access denied'
    };
    viewableItem.error = error;
  }
  return viewableItem;
}

var getStation = function(req) {
  switch(item.name.split(':')[0]) {
    case 'group': viewableItem = getGroup(req); break;
    case 'user': viewableItem = getUser(req); break;
    case 'song' : viewableItem = getSong(req); break;
    case 'hashtag': viewableItem = getHashtag(req); break;
  }
  return viewableItem;
}

var getGroup = function(req, item) {
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var viewableItem = {
    _id: item._id,
    type: item.type,
    name: item.name
  };
  
  // check if user is active member of group
  var isMember = item.members.indexOf('user:'+sessionUser) >= 0;

  if (isMember) {
    viewableItem = item;
  // check if group has public data
  } else if (item.isPublic && item.settings.viewableByPublic.length > 0) {
    var viewableItems = item.settings.viewableByPublic;
    for (var i = 0 ; i < viewableItems.length; i++) {
      var collectionName = viewableItems[i];
      viewableItem[collectionName] = item[collectionName];
    }
  } else {
    var error = {
      type: 'db_access',
      message: 'access denied'
    };
    viewableItem.error = error;
  }
  return  viewableItem;
}

var removeSensitiveData = function (item) {
  var sensitiveDataCollections = ['votes'];
  var numberOfCollections = sensitiveDataCollections.length;

  for (var collectionIndex = 0; collectionIndex < numberOfCollections; collectionIndex++) {
    var collectionName = sensitiveDataCollections[collectionIndex];
    if (item[collectionName]) {
      switch (collectionName) {
        case 'votes': 
          var votes = item[collectionName];

          if (votes.length > 0) {
            var numberOfVotes = 0;
            var voteTotal = 0;
            for (var i = 0; i < votes.length; i++) {
              var vote = Number(votes[i].split(':')[2]);
              voteTotal += vote;

              if (i === votes.length - 1) {
                numberOfVotes = i + 1;
              }
            } 

          } else {
             item[collectionName] = null;
          }
          break;
        default:
          item[collectionName] = null;
      }
    }
  }
  return item;
}

var getHashtag = function(req, item) {
  return item;
}

var getSong = function(req, song) {

  return song;
}

// Update data in db =================================
var applyUpdateToItem = function (req, itemToUpdate, update) {
  var sessionUser = JSON.parse(req.session.session).passport.user;
  if (itemToUpdate && update) {

    console.log("Applying update to "+itemToUpdate.type+": "+itemToUpdate._id);
    console.log(update);
    switch (update.operation) {
      // update a collection if it is not an array of items 
      // (items in array are handled by the add, remove operations)
      case 'update_collection':
        var collection = itemToUpdate[update.collection];
        if (typeof collection === 'string' || typeof collection === 'object') {
          itemToUpdate[update.collection] = update.item;
        }
        break;
      // if adding the itemlabel to updated item's collection
      case 'add': 
        if (itemToUpdate[update.collection]) {
          var itemLabel = update.item;
          var indexOfItemToAdd = itemToUpdate[update.collection].indexOf(itemLabel);
          // if item doesn't exist add it to the collection
          if (indexOfItemToAdd < 0) {
            itemToUpdate[update.collection].push(itemLabel);
          }

          switch (update.collection) {
            case 'pendingMembers':
              req.data.updates =  [{
                collection: 'followers',
                operation: 'add',
                item: 'user:'+sessionUser,
              }];
              routes.update(req);
              break;
            case 'members':
              req.data.updates =  [{
                collection: 'pendingMembers',
                operation: 'remove'
              }];
              routes.update(req);

              var item = req.data.itemLabel;
              var collection = item.split(':')[0];

              req.data.itemLabel = update.item;
              req.data.updates =  [{
                collection: collection+'s',
                operation: 'add',
                item: item
              }];
              routes.update(req);
              break;
            case 'votes':

            default:

          }
        }
        break;
      // if removing the itemlable to updated item's collection
      case 'remove':
        console.log('removing item from '+itemToUpdate.type)
        var itemLabel = update.item;

        var indexOfItemToRemove = itemToUpdate[update.collection].indexOf(itemLabel);
        // if item doesn't exist add it to the collection
        if (indexOfItemToRemove >= 0) {
          itemToUpdate[update.collection].splice(indexOfItemToRemove, 1);
        }
        break;
      // if adding or changing a vote 
      case 'vote':
        var voteLabel = update.item;
        var previousVoteLabel = itemToUpdate[update.collection].filter(function (voteRecord) {
          var userId = voteRecord.split(':')[1];
          if (userId === voteLabel.split(':')[1]) {return true;}
        })[0];

        if(previousVoteLabel) {
          var previousVoteRecordIndex = itemToUpdate[update.collection].indexOf(previousVoteLabel);
          itemToUpdate[update.collection].splice(previousVoteRecordIndex, 1, voteLabel);
        } else {
          itemToUpdate[update.collection].push(voteLabel);
        }
        break;
      // if a song has been played add to the total duration of play time 
      case 'play':
        var playLabel = update.item;
        var id = playLabel.split(':')[1];
        var additionalPlayTime = Number(playLabel.split(':')[2]);

        var previousPlayLabel = itemToUpdate[update.collection].filter(function (playRecord) {
          var userId = playRecord.split(':')[1];
          if (userId === id) {
            return true;
          }
        })[0];

        if (previousPlayLabel) {
          var previousPlayRecordIndex = itemToUpdate[update.collection].indexOf(previousPlayLabel);
          var playDuration = Number(previousPlayLabel.split(':')[2]);
          playDuration += additionalPlayTime;

          var newPlayRecord = 'user:'+id+':'+playDuration;
          itemToUpdate[update.collection].splice(previousPlayRecordIndex, 1, newPlayRecord);
        } else {
          itemToUpdate[update.collection].push(playLabel);
        }

    }
    return itemToUpdate;
  }
}

var updateUser = function(req, user, update) {
  var updateUser = false;
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var sessionUserLabel = 'user:'+sessionUser;
  var t = new ValidatedTxn(update);

  console.log('Updating user: '+user._id)
  console.log(update);
  // if session user is the same as the user 
  if (sessionUser == user._id) {
    updateUser = true;
 
  // if not user check relationship 
  } else { 
    var sessionUserIndex = user.friends.indexOf(sessionUserLabel);
    var isFriend = sessionUserIndex > 0;
    var hasRequestedFriendship = false;

    if (!isFriend) { 
      sessionUserIndex = user.requests.indexOf(sessionUserLabel);
      hasRequestedFriendship = sessionUserIndex >= 0;
    }

    // if session user is friend, check if removing friendship
    if ((isFriend && (t.removeFriend || t.denyRequest))
    || (hasRequestedFriendship && t.removeRequest)
    || (!hasRequestedFriendship && t.addRequest)
    || (t.denyRequest || t.addFriend)) {
      updateUser = true;
    // if editing session user frineds and request
    } else if (t.denyRequest || t.confirmRequest) {
      if (!isFriend && t.confirmRequest) {
        updateUser = true;
      }

      // change session user's friend information if handling a friend request
      db.users.findOne({_id: sessionUser}, function (err, sessionUser) {
        var requestersIndex = sessionUser.requests.indexOf(user._id);
        var hasRequestedFriendship = requestersIndex >= 0;
        var alreadyFriend = sessionUser.friends.indexOf(user._id);

        if (hasRequestedFriendship) {

          var requestUpdate = {
            operation: 'remove',
            collection: 'requests',
            item: 'user:'+user._id
          }

          req.data.updates = [update];

          if (t.confirmRequest && !alreadyFriend) {
            var friendUpdate = {
              operation: 'add',
              collection: 'friends',
              item: 'user:'+user._id
            }

            req.data.updates.push(friendUpdate);
          } 

          req.data.itemLabel = 'user:'+sessionUser;
          routes.update(req); 
        }
      });
    } else if (t.joinGroup) {
      updateUser = true;
    }
  }

  if (updateUser) {
    saveTxn(req, user, update);
  } else {
    console.log('Could not update user: '+user._id);
  }
}

var updateSong = function(req, song, update) {
  var updateSong = false;
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var sessionUserLabel = 'user:'+sessionUser;
  var t = new ValidatedTxn(update);

  console.log('Updating song: '+song._id);
  console.log(update);

  // if user created song and is updating song details
  if (song.createdBy === sessionUser) {
    updateSong = true;
  } else if (song.isPublic) {
    // if user is adding or removing hashtags
    if (t.addHashtag 
    || t.removeHashtag
    || t.playedSong
    || t.vote
    || t.follow
    || t.unfollow) {
      updateSong = true;
    } 
  }

  if (updateSong) {
    saveTxn(req, song, update);
  } else {
    console.log('Could not update song: '+song._id);
  }
}

var updateGroup = function (req, group, update) {
  var updateGroup = false;
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var sessionUserLabel = 'user:'+sessionUser;
  var t = new ValidatedTxn(update);

  var isAdmin = group.admins.indexOf(sessionUserLabel) >= 0;
  var isMember = group.members.indexOf(sessionUserLabel) >= 0;
  var isCreator = group.createdBy === sessionUser;

  console.log('Updating group: '+group._id);
  console.log(update);
  console.log('User is a member of gorup: '+ isMember);
  
    // if user is not in group allow 
  // him or her to follow, join, or 
  // vote on group
  if (t.follow || t.unfollow || t.joinGroup || t.vote) {
      updateGroup = true;
  // if user is an admin or member
  } else if (isAdmin || isMember) {
    if (t.addSong || t.addHashtag || t.addMember || t.leaveGroup) {
      updateGroup = true;
    // is user is an admin
    } else if (isAdmin) {
      if (t.addAdmin || t.removeMember || t.removeSong || t.updateCollection) {
        updateGroup = true;
      // if user is creater 
      } else if (isCreator) {
        // if removing admin
        if (t.removeAdmin) {
          updateGroup = true;
        } 
      }
    }
  } 

  if (updateGroup) {
    saveTxn(req, group, update);
  } else {
    console.log('Could not update group');
  }
}

var updateHashtag = function (req, hashtag, update) {
  var updateHashtag = false;
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var sessionUserLabel = 'user:'+sessionUser;
  var t = new ValidatedTxn(update);

  if (t.follow || t.unfollow || t.joinGroup || t.vote) {
    updateHashtag = true;
  }  

  if (updateHashtag) {
    saveTxn(req, hashtag, update);
  } else {
    console.log('Could not update hashtag');
  }
}

// Save transaction to item and update entry in database ==================
var saveTxn = function (req, item, update) {
  console.log('Saving transaction')
  var sessionUser = JSON.parse(req.session.session).passport.user;
  var updatedItem = applyUpdateToItem(req, item, update);
  update.createdOn = Date.now();
  update.createdBy = sessionUser;
  if (item._id != sessionUser) {
    db.user.findOne({_id: sessionUser}, function (err, user) {
      if (err) {
        console.log(err);
      } else if (user) {
        var userUpdate = getUserTxn(item, user, update);
        saveTxn(req, user, userUpdate); 
      }
    }); 
  }
  updatedItem.txnHistory.push(update);
  updatedItem.save(function (err, item) {
    if (err) {
      console.log(err);
    } else {
      req.data = createLabel(item);
      request.getItem(req);
      var itemLabel = createLabel(item);
      console.log(itemLabel);
      req.io.room(itemLabel).broadcast('item_update', itemLabel);
    }
  });
}

var getUserTxn = function (item, user, update) {
  var t = new ValidatedTxn(update);

  switch (true) {
    case t.addSong || t.removeSong: 
      update.collection = createLabel(item);
      break;
    case update.collection === 'pendingMembers':
    case t.addMember || t.removeMember:
      update.collection = createLabel(item);
      update.operation = 'add_member';
      break;
    case t.updateCollection
    || t.addRequest || t.removeRequest
    || t.addFriend || t.removeFriend
    || t.addAdmin || t.removeAdmin:
      update.item = createLabel(item); 
      break;
    case t.vote: 
      update.collection = createLabel(item);
    default: 
      update.collection = item.type+'s';
      update.item = createLabel(item);
  }
  return update;
}

var ValidatedTxn = function (update) {
  // hashtags
  this.addHashtag = update.operation === 'add' && update.collection === 'hashtags';
  this.removeHashtag = update.operation === 'remove' && update.collection === 'hashtags';
  // song
  this.playedSong = update.operation === 'play' && update.collection === 'playedBy';
  this.addSong = update.operation === 'add' && update.collection === 'songs';
  this.removeSong = update.operation === 'remove' && update.collection === 'songs';
  
  // update details if account permissioned
  this.updateCollection = update.operation === 'update_collection';

  // friend request
  this.removeRequest  = update.operation === 'remove' && update.collection === 'requests';
  this.addRequest = update.operation === 'add' && update.collection === 'requests';
  this.denyRequest = update.collection === 'requests' && update.operation === 'remove';
  this.addFriend = update.collection === 'friends' && update.operation === 'add';
  this.removeFriend = update.operation === 'remove' && update.collection === 'friends';
  // vote
  this.vote = update.operation === 'vote' && update.collection === 'votes';
  // follow
  this.follow = update.operation === 'remove' && update.collection === 'followers';
  this.unfollow = update.operation === 'add'  && update.collection === 'followers';
  // groups
  this.removeMember = update.operation === 'remove' && update.collection === 'members';
  this.addMember = update.operation === 'add' && update.collection === 'members';
  this.addAdmin = update.operation === 'add' && update.collection === 'admins';
  this.removeAdmin = update.operation === 'remove' && update.collection === 'admins';
  this.joinGroup = update.operation === 'add' && (update.collection === 'pendingMembers' || update.collection === 'groups'); 
}

var createLabel = function (item) {
  return item.type+':'+item._id;
}
