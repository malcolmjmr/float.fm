var app = {
  collectionNames: ['songs','groups','hashtags', 'friends', 'subscribed'],
  initiate: function() {
    app.collectionNames.forEach(function(collectionName) {
      app[collectionName] = [];
    });
  }, 

  add: function (item) {
    var userTxn = new Models.txn({
      operation: 'add',
      itemId: item._id
    });
    var itemTxn = new Models.txn({
      itemId: app.user._id
    })
    switch(item.type) {
      case 'user': 
        app.user.friends.push(item._id);
        item.requests.push(app.user._id);
        userTxn.collections.push('friends');
        itemTxn.operation = 'request';
        itemTxn.collections.push('requests');
        break;
      case 'song':
        app.user.songs.push(item._id);
        userTxn.collections.push('songs');
        item.playedBy.push(app.user._id);
        itemTxn.collections.push('playedBy');
        itemTxn.operation = 'add';
        break;
      case 'hashtag': 
        app.user.hashtags.push(item._id);
        userTxn.collections.push('hashtags');
        item.followers.push(app.user._id);
        itemTxn.collections.push('followers');
        itemTxn.operation = 'add';
        break;
      case 'group': 
        app.user.groups.push(item._id);
        item.members.push(app.user._id);
        break;
    }
    app.user.txnHistory.push(userTxn);
    item.txnHistory.push(itemTxn);
    app.db.update(app.user);
    app.db.update(item);
    
  },
  remove: function (item) {
    var itemToRemove = app.user[item.type+'s'].indexOf(item._id)
    var userTxn = new Models.txn({
      operation: 'remove',
      itemId: item._id
    });
    var itemTxn = new Models.txn({
      operation: 'remove',
      itemId: app.user._id
    })
    switch(item.type) {
      case 'user': 
        itemToRemove = app.user.friends.indexOf(item._id);
        app.user.friends.splice(itemToRemove, 1);
        userTxn.collections.push('friends');
        break;
      case 'song':
        app.user.songs.splice(itemToRemove, 1);
        userTxn.collections.push('songs');
        break;
      case 'hashtag': 
        app.user.hashtags.splice(itemToRemove, 1);
        userTxn.collections.push('hashtags');
        itemToRemove = item.followers.indexOf(item);
        item.followers.splice(itemToRemove, 1);
        itemTxn.collections.push('followers');
        break;
      case 'group': 
        app.user.groups.splice(itemToRemove, 1);
        userTxn.collections.push('groups');
        itemToRemove = item.followers.indexOf(item);
        item.followers.splice(itemToRemove, 1);
        itemTxn.collections.push('followers');
        itemToRemove = item.members.indexOf(item);
        item.members.splice(itemToRemove, 1);
        if (itemToRemove > -1) {itemTxn.collections.push('members');}
        itemToRemove = item.admins.indexOf(item);
        item.admins.splice(itemToRemove, 1);
        if (itemToRemove > -1) {itemTxn.collections.push('admins');}
        break;
    }
    app.user.txnHistory.push(userTxn);
    if (item.type === 'group' || item.type === 'hashtag') {
      item.txnHistory.push(itemTxn);
    }
    app.db.update(app.user);
    app.db.update(item);
  },
  edit: function(item, txn) {
    if (!txn) {
      console.log('enter txn');
    } else {
      item.txnHistory.push(txn);
      app.db.update(item);
    }
  },
  vote: function(item, isUpVote) {
    var userVote = {user: app.user._id, vote: isUpVote ? 1 : -1};
    // check if vote already exists
    var filter = item.votes.filter(function (vote) {
      return vote.user === userVote.user
    });
    var voteExists = filter.length > 0;
    // if vote exist remove
    if (voteExists) {
      var voteIndex = item.votes.indexOf(filter[0]);
      item.votes.splice(voteIndex, 1);
    }
    // push vote to votes array
    item.votes.push({ user: app.user._id, vote: isUpvote ? 1 : -1 });
    app.db.update(app.user);
  },
  message: function(group, message) {
    var room = group.type+':'+group._id;
    socket.emit('broadcast', {
      room: room, 
      event: 'message', 
      message: message, 
      from: app.user._id
    });
    console.log(room+'| Me: '+message);
  },
  getAll: function(type) {
    app.db.getCollection({type: type});
  },
  toggleSubscription: function(item) {
    var room = item.type+':'+item._id;
    var itemIndex = app.subscribed.indexOf(room)
    var isSubscribed = -1 !== itemIndex;
    if (isSubscribed) {
      app.subscribed.splice(itemIndex, 1);
      socket.emit('unsubscribe', room);
    } else {
      app.subscribed.push(room);
      socket.emit('subscribe', room);
    }
  }
};

app.db = {
  create: function(item) {
    socket.emit('create', new reqData({item:item}));
  },
  update: function(item, type) {
    socket.emit('update', new reqData({item: item}));
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




var helpers = {
  getObjFromId: function (collectionName, array) {
    var collection = app[collectionName];
    var objects = [];
    console.log(collectionName);
    console.log(collection);
    for (var idIndex = 0; idIndex < array.length; idIndex++) {
      for (var objIndex = 0; objIndex < collection.length; objIndex++) {
        if (array[idIndex] === collection[objIndex]) {
          objects.push(collection[objIndex]);
        }
      }
    }
    return objects;
  },
  getSubsToChange: function (type, subscribed, userCollection) {
    var subsInGroup = [];
    for (var i = 0; i < subscribed.length; i++) {
      var group = subscribed[i].split(':')[0];
      var id =  subscribed[i].split(':')[1];
      if (group === type) {
        subsInGroup.push(id);
      }
    }
    var filter1 = subsInGroup.filter(function (id) {
      var exists = false
      for (var idIndex = 0; idIndex < userCollection.length; idIndex++) {
        if (id === userCollection[idIndex]) {
          exists = true;
        }
      }
      return !exists;
    });
    var filter2 = [];
    if (userCollection !== undefined) {
      filter2 = userCollection.filter(function (id) {
        var exists = false
        for (var idIndex = 0; idIndex < subsInGroup.length; idIndex++) {
          if (id === subsInGroup[idIndex]) {
            exists = true;
          }
        }
        return !exists;
      });  
    }
    return filter1.concat(filter2);
  }
}

var scURLs = [
  'https://soundcloud.com/bbsvory/grindin-freestyle',
  'https://soundcloud.com/whyjaemusic/danny-glover-remix',
  'https://soundcloud.com/blaxx_luxaa/partynextdoor-ferina-full-ep',
  'https://soundcloud.com/ramel-ralphy-henry/partynextdoor-silhouette',
  'https://soundcloud.com/majorlazer/major-lazer-dj-snake-lean-on-feat-mo',
  'https://soundcloud.com/nosleepmusic/kehlani-ft-lexii-alijai-jealous-no-sleep-remix',
  'https://soundcloud.com/ambreperkins/kehlani-x-ambre-preach-prod-erick-bardales',
  'https://soundcloud.com/kehlanimusic/kehlani-the-way-feat-chance-the-rapper',
  'https://soundcloud.com/jgrammbeats/the-need-to-know-feat-sza',
  'https://soundcloud.com/etiennne-1/can-i-drake-ft-beyonce',
  'https://soundcloud.com/hhc-break-big/neyo-she-knows-ft-juicy-j-cdq',
  'https://soundcloud.com/hi-jackson/throw-some-mo-hi-w-jackson-x-rae-sremmurd-x-nicki-minaj-x-young-thug-final',
  'https://soundcloud.com/ericbellingermusic/eric-bellinger-r-b-singer',
  'https://soundcloud.com/r-b-my-first-big-love/pleasure-p-sex-mechanic-2014'
]

var downloadURLs = function (urls) {
  var song = new Models.song();
  song.from = 'soundcloud';
  urls.forEach(function(url) {
    song.location.origin = url;
    app.player.downloadToServer(song);
  });
}


