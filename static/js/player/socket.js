var socket = io.connect('http://'+window.location.host);

socket.on('connect', function(){
  console.log("Socket connected");
  socket.emit('fetch_user_data');
});

socket.on('user', function(user) {
  console.log(user);
  App.start(user);
});

socket.on('user_songs', function(songs) {
  var playlist = App.Player.library = songs;
  App.Ui.showPlaylists(playlist);
});

socket.on('user_groups', function(groups) {
  console.log(groups);
  App.User.groups = groups;
  var curr_group = {
    _id : groups[0]._id,
    name : groups[0].name,
    playlist : groups[0].playlists[0]
  };
  App.User.groups.current = curr_group;
});

socket.on('add_to_group_que', function() {
  user.playlists
});

socket.on('new_song_added_to_group_playlist', function(data) {
  App.User.groups.forEach(function(group) {
    if (group._id === data.group) {
      group.playlists.forEach(function(playlist) {
        if (playlist.name === data.playlist) {
          App.User.groups.current.playlist.songs.push(data.song);
          App.Ui.redrawQue();
        }
      });
    }
  });
});

socket.on('new_playlist_added_to_group', function(playlist) {
  console.log(playlist)
});