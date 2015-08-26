var socket = io.connect('http://'+window.location.host);

socket.on('connect', function(){
  console.log("Socket connected");
  app.initiate();
  socket.emit('ready');
});


socket.on('db_item_details', function(item) {
  var collectionName = item.type+'s';
  if (collectionName === 'users') {
    if (app.user === undefined) {
      app.user = item;
      app.initiate();
      app.player.initiate();
      app.toggleSubscription(app.user);
      app.db.getUserData();
      app.collectionNames.forEach(function (collectionName) {
        if (collectionName !== 'subscribed') {
          var ids = app.user[collectionName];
          ids.forEach(function (id) {
            app.toggleSubscription({
              _id: id,
              type: collectionName.substr(0, collectionName.length - 1)
            });
          })
        }
      });
    } else {
      app.user = item;
      app.collectionNames.forEach(function (collectionName) {
        var type = collectionName.substr(0, collectionName.length - 1)
        var newSubscriptions = helpers.getSubsToChange(
          type, 
          app.subscribed, 
          app.user[collectionName]
        );
        newSubscriptions.forEach(function (subscription) {
          var subItem = {
            type: type,
            _id: subscription
          };
          app.toggleSubscription(subItem);
        })
      })
      
    }
  } else {
    var itemExists = false;

    for (var itemIndex = 0; itemIndex < app[collectionName].length; itemIndex++) {
      if (app[collectionName][itemIndex]._id) {
        if (app[collectionName][itemIndex]._id === item._id) {
          itemExists = true;
          app[collectionName][itemIndex] = item;
        }
      } else {
        if (app[collectionName][itemIndex] === item._id) {
          itemExists = true;
          app[collectionName][itemIndex] = item;
        }
      }
    }
    if (!itemExists) {
      app[collectionName].push(item);
    }
  }
  
})

socket.on('db_collection', function (collection) {
  console.log(collection);
  var collectionName = collection.name+'s';
  app[collectionName] = collection.items;
})

socket.on('error', function (error) {
  console.log(error);
});

socket.on('message', function(data) {
  console.log(data);
  var roomType = data.room.split(':')[0];
  var itemId = data.room.split(':')[1];
  var name = null;
  for (var i = 0; i < app.groups.length; i++) {
    if (app.groups[i]._id === itemId) {

      switch(roomType) {
        case 'song': 
          name = app.groups[i].title;
          break;
        case 'hashtag':
          name = app.groups[i].name;
          break;
        case 'group':
          name = app.groups[i].name;
          break;
        case 'user':
          name = app.groups[i].local.email;
          break;
        default:
      }
      console.log(name+'| '+data.from+': '+data.message);
    }
  }
})

socket.on('update_player_state', function (data) {
  if (data.from !== app.user._id) {
    var latency = (Date.now() - data.time) / 1000;
    data.state.currentLocation +=  1 + latency;
    app.player.state = data.state;
    app.player.state.changed = true;
  }
})
