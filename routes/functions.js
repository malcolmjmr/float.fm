
var db = require('../models/dbSchema');

module.exports = {
  ready: function(req) {
    console.log(req.session);
    req.session.user = req.data;

  },
  create: function(req) { 
    if (isValidRequest(req)) {
      var collection = req.data.collection;
      var newEntry = new db[collection](req.data.item);
      newEntry.save(function(err, entry) {
        req.io.emit('created_'+ collection, entry);
        db.user.findOne({_id: req.data.userId},  function(err, user) {
          user[collection+'s'].push(entry._id);
          var txn = {
            operation: 'create_'+collection,
            collection: collection
            itemId: entry._id
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
      
    }
  },
  delete: function(req) {

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
    db[collection].update({_id: item._id}, function(err) {
      if (err) { throw err; }
    })
  },

  song: {
    create: function(req) {
      var song = new db.song(req.data.song);
      song.save(function(err) {
        if (err) { throw err; } 


      })
    },
    update: function(req) {
      socket.emit('song:update', song)
    }
  },

  group: {
    create: function(group) {
      socket.emit('group:create', group);
    },
    update: function(group) {
      socket.emit('group:update', group);
    },
    delete: function(group) {
      socket.emit('group:delete', group);
    }
  },

  station: {
    create: function(station) {
      socket.emit('station:create', station);
    },
    update: function(station) {
      socket.emit('station:update', station);
    },
    delete: function(station) {
      socket.emit('station:delete', station);
    }
  }
};

var functions = {

  song: function(song) {
    var data = {
      userId: app.user._id,
      song: song 
    };

    return {
      addToLibrary: function() {
        socket.emit('library:add_item', data);
      },
      removeFromLibrary: function() {
        socket.emit('library:remove_item', data);    
      },
      addToPlaylist: function(playlist) {
        data.playlist = playlist;
        socket.emit('playlist:add_item', data);
      },
      removeFromPlaylist: function(playlist) {
        data.playlist = playlist;
        socket.emit('playlist:remove_item', data);
      },
      addToQue: function() {
        //app.player.que.push(song);
      },
      removeFromQue: function() {
        //var index = app.player.que.indexOf(song);
        // app.player.que.splice(index, 1);
      },
      addToStation: function(station) {
        data.station = station;
        socket.emit('station:add_tiem', data);
      },
      removeFromStation: function(station) {
        data.station = station;
        socket.emit('station:remove_item', data);
      },
      upVote: function() {
        socket.emit('vote:up', data);
      },
      downVote: function() {
        socket.emit('vote:down', data);
      },
      play: function() {
        //app.player.tempQue.upshift(song);
        //app.
      },
      download: function() {

      }
    }
  },
  playlist: function(playlist) {
    var data = {
      userId: app.user._id,
      playlist: playlist
    };
    return {
      create: function() {
        socket.emit('playlist:create', data);
      },
      update: function() {
        socket.emit('playlist:update', data)
      },
      delete: function() {
        socket.emit('playlist:delete', data);
      },
      addToStaition: function(station) {
        data.station = station;
        socket.emit('station:add_item', data);
      },
      removeFromStation: function(staion) {
        data.station = station;
        socket.emit('station:remove_item', data);
      },
      upVote: function() {
        socket.emit('vote:up', data);
      },
      downVote: function() {
        socket.emit('vote:down', data);
      }
    }
  },
  station: function(station) {
    var data = {
      userId: app.user._id,
      station: station
    };

    return {
      create: function() {

      },
      delete: function() {

      },
      listen: function() {

      },
      follow: function() {

      },
      join: function() {

      },
      message: function(msg) {

      }  
    } 
  },
  group: {
    create: function(name) {

    },
    delete: function(id) {

    },
    follow: function(id) {

    },
    join: function(id) {

    },
    message: function(id, msg) {

    }
  }
}

var isValidRequest = function(req) {
  var session = JSON.parse(req.session.session)
    var isUser = false;
    var correctData = false;
    if (req.data.userId && req.data.collection && req.data.item) {
      isUser = (session.passport.user == req.data.userId);
      for (collection in db) {
        if (collection === req.data.collection) { correctData = true; }
      }
    }
    return (isUser && correctData);
}