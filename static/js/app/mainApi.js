var app = {
  initiate: function(email, password) {
    app.db.login.local(email, password); 
  }
}

app.db = {

  create: function(data) {
    socket.emit('create', data);
  },
  update: function(data) {
    socket.emit('update', data);
  },
  delete: function(data) {
    socket.emit('delete', data);
  },

  // add entry to database 
  addItem: function(collection, item) {

  },

  // get entry from database
  getItem: function(data) {
    socket.emit(data);
  },
  getUserData: function(data) {
    socket.emit('get_user_data', data);
  },
  // update entry in database

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
          socket.emit('ready', res.data);
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
    create: function(song) {
      socket.emit('song:create', song)
    },
    update: function(song) {
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
      },
      follow: function() {
        socket.emit('user:follow', data);
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
        socket.emit('station:create', data);
      },
      delete: function() {
        socket.emit('station:delete', data);
      },
      update: function() {
        socket.emit('station:update', data);
      },
      listen: function() {

      },
      follow: function() {
        socket.emit('group:follow', data);
      },
      join: function() {
        socket.emit('group:join', data);
      },
      message: function(msg) {

      }  
    } 
  },
  group: function(group) {
    var data = {
      userId : app.user._id,
      group : group
    };

    return {
      create: function() {
        socket.emit('group:create', data);
      },
      update: function() {
        socket.emit('group:update', data);
      },
      delete: function() {
        socket.emit('group:delete', data);
      },
      follow: function() {
        socket.emit('group:follow', data);
      },
      join: function() {
        socket.emit('group:join', data);
      },
      message: function(msg) {

      }
    }   
  }
}


var items = ['song', 'station', 'group'];
function create(items, numberOfEach) {
  items.forEach(function(item){
    for (var i = 0; i < numberOfEach; i++) {
      var data = new Models.reqData({collection: item, item: new Models[item]});
      socket.emit('create', data);
    }
  })
}
