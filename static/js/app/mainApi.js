
var db = {

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
          console.log(res.data);
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

  },


  song: {
    add: function(song) {

    },
    update: function(song) {

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