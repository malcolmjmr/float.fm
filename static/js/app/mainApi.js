var app = {
  initiate: function() {
    socket.emit('get_library');
    socket.emit('get_groups');
    socket.emit('get_stations');
  }
}

app.db = {

  // add entry to database 
  addItem: function(collection, item) {

  },

  // get entry from database
  getItem: function(collection, item) {

  },

  // update entry in database
  updateItem: function(collection, item) {

  },

  // log in 
  login: {
    local: function(email, password) {

      var params = {
        email: email,
        password: password
      };

      $.post("/login", params, function(res) {
        if (res.error) {
          console.log(res.error);
        } else {
          console.log(res.data);
          app.user = res.data;
        }
      });
    },
    google: function() {

    },
    facebook: function() {

    },
    twitter: function() {

    }
  },


  // sign up
  signup: {
    local: function(email, password) {
      var params = {
        email: email,
        password: password
      };

      $.post("/signup", params, function(res) {
        if (res.error) {
          console.log(res.error);
        } else {
          app.user = res.data;
        }
      });
    },
    google: function() {

    },
    facebook: function() {

    },
    twitter: function() {

    } 
  },

  // log out
  logout: function(session) {
    $.post('/logout', function() {
      delete app.user
      delete app.player
    });
  },


  song: {
    add: function(song) {
      socket.emit('song:add', song)
    },
    update: function(song) {
      socket.emit('song:update', song)
    }
  },

  group: {
    add: function(group) {

    },
    update: function(group) {

    }
  },

  station: {
    add: function(station) {

    },
    update: function(station) {

    }
  }
};

app.functions = {

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
        socket.emit('playlist:add_item')
      },
      removeFromPlaylist: function(playlist) {
        data.playlist = playlist;
        socket.emit('playlist:remove_item');
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
    }
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