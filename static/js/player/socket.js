var socket = io.connect('http://'+window.location.host);

socket.on('connect', function(){
  console.log("Socket connected");
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
  for (collection in response) {
    app.user[collection] = response[collection];
  }
});


