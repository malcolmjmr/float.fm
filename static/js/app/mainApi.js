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