
var db = require('../models/dbSchema');

module.exports = {

  create: function(req) {
    var collection = req.data.collection
    var entry = new db[collection](req.data.item);
    entry.save(function(err) {
      req.io.emit('created_'+collection);
    })
  },
  update: function(req) {

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