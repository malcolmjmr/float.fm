// main player class that is used by the player object to control the playing of songs

app.player = {
  que: [],
  currentSong: null,
  isPlaying: false,
  downloadToServer: function(song) {
    var data = {
      userId: app.user._id,
      item: song
    };
    socket.emit('download', data);
  },
  addToQue: function(song) {
    app.player.que.push(song);
  },
  deleteFromQue: function(song) {
    que.forEach(function(songIndex) {
      if (que[songIndex]._id === song._id) {
        que.splice(songIndex, 1);
      }
    });
  },
  play: function(song) {
    if (song) {
      app.player.que.unshift(song);
      app.player.currentSong = 0;
    }

    if (app.player.que.length > 0) {
      if (!app.player.currentSong) {
        app.player.currentSong = 0;
      }
      app.player.audioPlayer.src = '/sendsong/?id='+app.player.que[app.player.currentSong]._id;
      app.player.audioPlayer.play();
    }
  },
  audioPlayer: new Audio(),
  pause: function() {

  },
  stop: function() {

  },
  toggleShuffle: function() {

  },
  toggleRepeate: function() {

  },
  syncStation: function() {

  },
  currentStation: null,
  shuffleState: 'none',
  repeatState: 'none'
};



