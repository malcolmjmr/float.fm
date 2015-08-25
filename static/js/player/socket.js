var socket = io.connect('http://'+window.location.host);

socket.on('connect', function(){
  console.log("Socket connected");
  app.initiate();
  socket.emit('ready');
});

socket.on('song_sent', function(library) {
  app.user.songs = libary;
  app.user.currentSong = 0;
});

socket.on('send_groups', function(groups) {
  app.user.groups = groups;
  app.user.currentGroup = 0;
});

socket.on('send_stations', function(stations) {
  app.user.stations = stations;
  app.user.currentStation = 0;
})

socket.on('song_added', function(res) {
  if (res.error) {
    console.log(res.error);
  } else {
    console.log(res.data);
  }
});

socket.on('song_updated', function(res) {
  if (res.error) {
    console.log(res.error);
  } else {
    console.log(res.data);
  }
});

socket.on('created_song', function(res) {
  console.log(res);
});

socket.on('updated_user_songs', function(res) {
  console.log(res);
});

socket.on('updated_song', function (res) {
  console.log(res);
})

var collectionNames = ['songs','stations','groups'];

collectionNames.forEach(function(collectionName) {
  socket.on('upadated_user_'+collectionName, function(res) {
    console.log(res);
  });
  socket.on('updated_'+collectionName, function(res) {
    console.log(res);
  });
});

socket.on('updated_user_groups', function(res) {
  console.log(res);
})

socket.on('user_data_sent', function(response) {
  console.log(response);
  for (collection in response) {
    app.user[collection] = response[collection];
  }
});

socket.on('db_item_details', function(item) {
  console.log(item);
  var room = item.type+':'+item._id;
  var alreadySubscribed = -1 !== app.subscribed.indexOf(room);

  if (!alreadySubscribed) {
    socket.emit('subscribe', room);
    app.subscribed.push(room);
  }

  var collection = item.type+'s';
  if (collection === 'users') {
    if (app.user === undefined) {
      app.user = item; 
      app.db.getUserData();
    } else {
      app.user = item;
    }
  } else {
    var itemExists = false;

    for (var itemIndex = 0; itemIndex < app[collection].length; itemIndex++) {
      if (app[collection][itemIndex]._id) {
        if (app[collection][itemIndex]._id === item._id) {
          itemExists = true;
          app[collection][itemIndex] = item;
        }
      } else {
        if (app[collection][itemIndex] === item._id) {
          itemExists = true;
          app[collection][itemIndex] = item;
        }
      }
    }
    if (!itemExists) {
      app[collection].push(item);
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
