// main player class that is used by the player object to control the playing of songs

app.player = {
  audioPlayer: new Audio(),
  state: {
    changed: false,
    currentSongIndex: null,
    currentSongDuration: null,
    currentLocation: 0,
    currentVolume: 100,
    currentStationIndex: null,
    isPlaying: false,
    que: [],
    queOrder: [],
    queUpdates: [],
    playingFrom: 'que',
    repeat: 'none',
    shuffle: 'none'  
  },
  lastRequestTime: null,
  latency: null,
  play: function(song) {
    // if song is passed through, put new song
    // infront of current song and play the new song
    if (song) {
      // if the player was playing another song
      if (app.player.state.currentSongIndex && app.player.state.isPlaying) {
        app.player.state.que.splice(app.player.state.currentSongIndex, 0, song);
      } else {
        app.player.state.que.unshift(song);
        app.player.state.currentSongIndex = 0;
      }
    }
    // if app has not been played yet initiate current song index
    if (!app.player.state.currentSongIndex && app.player.state.que.length > 0) {
      app.player.state.currentSongIndex = 0;
    }

    app.player.state.isPlaying = true;
    app.player.state.changed = true;
  },
  pause: function () {
    app.player.state.isPlaying = false;
    app.player.state.changed = true;
  },
  fastforward: function (rate) {
    app.player.state.currentLocation += 5 * rate;
    app.player.state.changed = true;
  },
  rewind: function (rate) {
    app.player.state.currentLocation -= 5 * rate;
    app.player.state.changed = true;
  },
  repeat: function () {
    if (app.player.state.repeat < 2) {
      app.player.state.repeat++;
    } else {
      app.player.state.repeat = 0;
    }   
  },
  shuffle: function () {
    if (app.player.state.shuffle < 2) {
      app.player.state.shuffle++;
    } else {
      app.player.state.shuffle = 0;
    }  
  },
  next: function () {
    app.player.state.currentLocation = 0;
    if (app.player.state.currentSongIndex < app.player.state.que.length - 1){
      app.player.state.currentSongIndex++;
    } else {
      app.player.state.currentSongIndex = 0;
    }
    app.player.state.changed = true;
  },
  previous: function () {
    app.player.state.currentLocation = 0;
    if (app.player.state.currentSongIndex > 0){
      app.player.state.currentSongIndex--;
    } else {
      app.player.state.currentSongIndex = app.player.que.length - 1;
    }
    app.player.state.changed = true;
  },
  downloadToServer: function(song) {
    var data = {
      userId: app.user._id,
      item: song
    };
    socket.emit('download', data);
  },
  initiate: function() {
    window.setInterval(function() {
      if (app.player.state.changed) {
        updateState();
      }

      // if the player is playing 
      if (app.player.state.isPlaying) {
        var song = app.player.state.que[app.player.state.currentSongIndex];
        var duration = new Date(app.player.audioPlayer.currentTime * 1000);
        var message = 'Playing: '+song.title+' by '+song.artist+' | '+duration.getMinutes() +':'+duration.getSeconds();
        console.log(message);
      }
    }, 500)
  }
};

var updateState = function () {
  if (app.player.state.isPlaying) {
    app.player.lastRequestTime = Date.now();
    app.player.audioPlayer.src = '/sendsong/?id='+app.player.state.que[app.player.state.currentSongIndex]._id;
    app.player.audioPlayer.play();
  } else {
    app.player.state.currentLocation = app.player.audioPlayer.currentTime;
    app.player.audioPlayer.pause();
  }
  app.player.state.changed = false;
  var data = {
    room: 'user:'+app.user._id,
    event: 'update_player_state',
    state: app.player.state,
    time: Date.now()
  }
  socket.emit('broadcast', data); 
}

app.player.audioPlayer.addEventListener('ended', function() {
  app.player.next();
});

app.player.audioPlayer.addEventListener('canplay', function() {
  app.player.latency = (Date.now() - app.player.lastRequestTime) / 1000;
  app.player.audioPlayer.currentTime = app.player.state.currentLocation + app.player.latency;
});


