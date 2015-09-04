var app = {
  collectionNames: ['songs','groups','hashtags', 'users', 'subscribed'],
  initiate: function() {
    app.collectionNames.forEach(function(collectionName) {
      app[collectionName] = {};
    });
    app.player.initiate();
    app.toggleSubscription(createLabel(app.user));
    app.db.getUserData();
    app.collectionNames.forEach(function (collectionName) {
      if (collectionName !== 'subscribed' 
        && collectionName !== 'songs'
        && collectionName !== 'users') {
        var itemLabels = app.user[collectionName];
        itemLabels.forEach(app.toggleSubscription);
      }
    });
  }, 
  // add user, hashtag, group, station
  add: function (itemLabel) {
    var itemType = itemLabel.split(':')[0];
    var Update = function(collection) {
      this.operation = 'add';
      this.item = createLabel(app.user);
      this.collection = collection;
    }
    var updates = []
    switch(itemType) {
      case 'user': 
        var isFriend = app.user.friends.indexOf(itemLabel) >= 0;
        var hasRequestedFriendship = app.user.requests.indexOf(itemLabel) >= 0;
        // if user is not a friend make friend request
        if (!isFriend) {
          if (hasRequestedFriendship) {
            var removeRequest = new Update('requests');
            removeRequest.operation = 'remove';
            updates.push(new Update('friends'), removeRequest);
          } else {
            updates.push(new Update('requests'));
          }
        }
        break;
      case 'song':
      case 'hashtag':
        var hasItem = app.user[itemType+'s'].indexOf(itemLabel) >= 0;
        // if user does not have that song or hashtag in 
        // their collections, add it  
        console.log(hasItem);
        if (!hasItem) {
          updates.push(new Update('followers'));
        }
        break;
      case 'group': 
        var isMember = app.user.groups.indexOf(itemLabel) >= 0;
        // if user is not in group, make request to be added
        if (!isMember) {
          updates.push(new Update('pendingMembers'));
        }
        break;
    }

    if (updates.length > 0) {
      app.db.update(itemLabel, updates);
    }
    
  },
  // add item to group or hashtag
  addTo: function (groupLabel, itemLabel) {
    var groupType = groupLabel.split(':')[0];
    var group = app[groupType+'s'][groupLabel];
    var itemType = itemLabel.split(':')[0];
    var Update = function(collection) {
      this.operation = 'add';
      this.item = itemLabel;
      this.collection = collection;
    }
    updates = [];

    switch (itemType) {
      case 'user':
        var isMember = group.members.indexOf(itemLabel) >= 0;
        if (!group.members[itemLabel]) {
          updates.push(new Update('members'));
        }
        break;
      default:
        var hasItem = group[itemType+'s'].indexOf(itemLabel) >= 0;
        if (!hasItem) {
          updates.push(new Update(itemType+'s'));
        }
    }

    if (updates.length > 0) {
      app.db.update(groupLabel, updates)
    }
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
  update: function(collection, updatedItem) {
    var update = {
      operation: 'update_collection',
      item: updatedItem,
      collection: collection
    };

    app.db.update(createLabel(app.user), [update]);


  },
  vote: function(itemLabel, vote) {

    var update = {
      operation: 'vote',
      collection: 'votes',
      item: createLabel(app.user)+':'+vote
    }

    app.db.update(itemLabel, [update]);
  },
  message: function(room, message) {
    var groupType = room.split(':')[0];
    var group = app[groupType+'s'][room]
    socket.emit('broadcast', {
      room: room, 
      event: 'message', 
      message: message, 
      from: app.user._id
    });
    console.log(group.name+'| Me: '+message);
  },
  getAll: function(type) {
    app.db.getCollection({type: type});
  },
  toggleSubscription: function(itemLabel, subscribe) {
    if (app.subscribed[itemLabel] && !subscribe) {
      
      app.subscribed[itemLabel] = null;
      socket.emit('unsubscribe', itemLabel);

    } else {
      
      app.subscribed[itemLabel] = ['public'];
      socket.emit('subscribe', itemLabel);
    } 
  }, 
  updates: []
};

app.db = {
  create: function(item) {
    socket.emit('create', {item: item});
  },
  update: function(itemLabel, updates) {
    socket.emit('update', {
      itemLabel: itemLabel,
      updates: updates
    });
  },
  delete: function(itemLabel) {
    socket.emit('delete', itemLabel);
  },
  getItem: function(itemLabel) {
    socket.emit('get_item', itemLabel);
  },
  getCollection: function (collectionName) {
    socket.emit('get_collection', collectionName);
  },
  getUserData: function() {
    socket.emit('get_user_data');
  },
  // update entry in database

  // log in 
  login: {
    local: function(email, password) {

      if (app.user) {
        logout();
      }

      var params = {
        email: email,
        password: password
      };

      $.post("/login", params, function(response) {
        if (response.error) {
          console.log(response.error);
        } else if (response.isLoggedIn) {
          socket = new SocketConfig();
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
        } else if (response.isSignedUp) {
          var userEmail = response.user.local.email;
          console.log('User: '+userEmail+' has been signed up. Please log in.');
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


var createLabel = function (item) {
  return item.type+':'+item._id;
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
  getSubsToChange: function (subscribed, userCollection) {
    var collectionName = userCollection[0].split(':')[0]
    var subsInCollection = [];

    for (var i = 0; i < subscribed.length; i++) {
      console.log(subscribed[i])
      var subCollectionName = subscribed[i].split(':')[0];
      if (subCollectionName === collectionName) {
        subsInCollection.push(id);
      }
    }
    var filter1 = subsInCollection.filter(function (itemLabel) {
      var exists = false
      for (var itemIndex = 0; itemIndex < userCollection.length; itemIndex++) {
        if (itemLabel === userCollection[itemIndex]) {
          exists = true;
        }
      }
      return !exists;
    });
    var filter2 = [];
    if (userCollection !== undefined) {
      filter2 = userCollection.filter(function (itemLabel) {
        var exists = false
        for (var itemIndex = 0; itemIndex < subsInCollection.length; itemIndex++) {
          if (id === subsInCollection[itemIndex]) {
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
  'https://soundcloud.com/r-b-my-first-big-love/pleasure-p-sex-mechanic-2014',
  'https://soundcloud.com/octobersveryown/drake-back-to-back-freestyle',
  'https://soundcloud.com/futureisnow/future-trap-niggas-prod-by',
  'https://soundcloud.com/travisscott-2/travis-scott-antidote',
  'https://soundcloud.com/the-weeknd-beauty-behind-the-madness/the-game-100-ft-drake',
  'https://soundcloud.com/partyomo/partynextdoor-kehlanis-freestyle',
  'https://soundcloud.com/kendricktrax/young-thug-power-prod-by-london-on-the-track-digitaldrippedcom',
  'https://soundcloud.com/chaoticphoenix13-phoenix/big-sean-i-know-feat-jhene-aiko',
  'https://soundcloud.com/actionbronson/baby-blue-ft-chance-the-rapper',

]

var downloadURLs = function (urls) {
  var song = new Models.song();
  song.from = 'soundcloud';
  urls.forEach(function(url) {
    song.location.origin = url;
    app.player.downloadToServer(song);
  });
}


