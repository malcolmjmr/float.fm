// main player class that is used by the player object to control the playing of songs

app.player = {
  que: [],
  currentSong: null,
  download: function(song) {
    var data = {
      usrerId: app.user._id,
      item: song
    };
    return {
      toClient: function() {
      },
      toServer: function() {  
        console.log(data);
        socket.emit('download', data);
      }
    }
  },
  play: function() {

  },
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



