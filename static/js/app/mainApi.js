var app = {
  collectionNames: ['songs','groups','hashtags', 'friends', 'subscribed'],
  initiate: function() {
    app.collectionNames.forEach(function(collectionName) {
      app[collectionName] = [];
    });
  }, 
  add: function (item) {
    app.db.getItem(item);
    switch(item.type) {
      case 'user': 
        app.user.friends.push(item._id);
        item.requests.push(app.user._id);
        app.db.update(app.user);
        app.db.update(item, 'add');
        break;
      case 'song':
        app.user.songs.push(item._id);
        item.playedBy.push(app.user._id);
        app.db.update(app.user);
        app.db.update(item, 'add');
        break;
      case 'hashtag': 
        app.user.hashtags.push(item._id);
        item.followers.push(app.user._id);
        app.db.update(app.user);
        app.db.update(item, 'add');
        break;
      case 'group': 
        app.user.groups.push(item._id);
        item.members.push(app.user._id);
        app.db.update(app.user);
        app.db.update(item, 'add');
        break;
      default: 
    }
    
  },
  remove: function (item) {
    var itemToRemove = app.user[item.type+'s'].indexOf(item._id)
    console.log(item.type);
    switch(item.type) {
      case 'user': 
        itemToRemove = app.user.friends.indexOf(item._id);
        app.user.friends.splice(itemToRemove, 1);
        app.db.update(app.user);
        break;
      case 'song':
        app.user.songs.splice(itemToRemove, 1);
        app.db.update(app.user, 'remove');
        break;
      case 'hashtag': 
        app.user.hashtags.splice(itemToRemove, 1);
        itemToRemove = item.followers.indexOf(item);
        item.followers.splice(itemToRemove, 1);
        app.db.update(app.user);
        app.db.update(item, 'remove');
        break;
      case 'group': 
        app.user.groups.splice(itemToRemove, 1);
        itemToRemove = item.followers.indexOf(item);
        item.followers.splice(itemToRemove, 1);
        itemToRemove = item.members.indexOf(item);
        item.members.splice(itemToRemove, 1);
        itemToRemove = item.admins.indexOf(item);
        item.admins.splice(itemToRemove, 1);
        app.db.update(app.user);
        app.db.update(item, 'remove');
        break;
      default: 
    }
  },
  edit: function(item) {
    app.db.update(item);
  },
  vote: function(item, isUpVote) {
    item.votes.push({ user: app.user._id, vote: isUpvote ? 1 : -1 });
    app.db.update(app.user);
  },
  message: function(group, message) {
    var room = group.type+':'+group._id;
    app.groups.forEach(function (appGroup) {
      if (appGroup._id === group._id) {
        socket.emit('broadcast', {
          room: room, 
          event: 'message', 
          message: message, 
          from: app.user._id
        });
        console.log(group.name+'| Me: '+message);
      }
    })
    
  },
  getAll: function(type) {
    app.db.getCollection({type: type});
  }
};

app.db = {
  create: function(item) {
    socket.emit('create', new reqData({item:item}));
  },
  update: function(item, type) {
    var data = new reqData({
      item: item,
      type: type || null
    });
    socket.emit('update', data);
  },
  delete: function(item) {
    socket.emit('delete', new reqData({item:item}));
  },
  getItem: function(item) {
    socket.emit('get_item', new reqData({item: item}));
  },
  getCollection: function (item) {
    socket.emit('get_collection', new reqData({item:item}));
  },
  getUserData: function(data) {
    if (data === undefined) {
      data = {
        userId: app.user._id
      };
    }
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

      $.post("/login", params, function(response) {
        if (response.error) {
          console.log(response.error);
        } else if (response.isLoggedIn) {
          location.reload();
        } else {
          console.log('Unknown error while logging in');
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

      $.post("/signup", params, function(response) {
        if (response.error) {
          console.log(response.error);
        } else if (response.isLoggedIn) {
          location.reload();
        } else {
          console.log('Unknown error while signing up');
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
};


app.chat = function(data) {
  socket.emit('broadcast', data);
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

var reqData = function (options) {
  this.userId = app.user._id;
  this.item = null;
  if (options) {
    for (option in options) {
      this[option] = options[option];
    }
  }
}
