var socket = io.connect('http://'+window.location.host);

socket.on('connect', function(){
  console.log("Socket connected");
});

socket.on('send_libary', function(library) {
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



