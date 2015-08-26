// main player class that is used by the player object to control the playing of songs

app.player = {
  audioPlayer: new Audio(),
  state: {
    currentSongIndex: null,
    currentSongDuration: null,
    currentLocation: 0,
    currentVolume: 100,
    currentStationIndex: null,
    isPlaying: false,
    que: [],
    queOrder: [],
    queUpdates: [],
    playingFrom: 'que'  
  },
  stateChanges: [],
  play: function(song) {
    // if song is passed through, put new song
    // infront of current song and play the new song
    if (song) {
      // if the player was playing another song
      if (app.player.state.currentSongIndex && app.player.state.isPlaying) {
        app.player.state.que.splice(app.player.state.currentSongIndex, 0, song);
        app.player.audioPlayer.pause();
      } else {
        app.player.state.que.unshift(song);
        app.player.state.currentSongIndex = 0;
      }
    }

    // play from current song
    app.player.audioPlayer.src = '/sendsong/?id='+app.player.state.que[app.player.state.currentSongIndex]._id;
    app.player.audioPlayer.play();
    // if the app was paused play from previous location
    if (!app.player.state.isPlaying && app.player.state.currentSongIndex >= 0) {
      app.player.audioPlayer.currentTime = app.player.state.currentLocation;
    }
    app.player.stateChanges.push('play');
  },
  pause: function() {
    app.player.audioPlayer.pause();
    app.player.stateChanges.push('pause');
  },
  fastforward: function(num) {
    app.player.audioPlayer.currentTime += 5*num;
  },
  rewind: function(num) {
    app.player.audioPlayer.currentTime -= 5*num;
  },
  repeat: function() {

  },
  shuffle: function() {

  },
  next: function() {
    app.player.state.currentSongIndex++;
    app.player.play();
    app.player.stateChanges.push('next');
  },
  previous: function() {
    app.player.state.currentSongIndex--;
    app.player.play();
    app.player.stateChanges.push('previous');
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
      if (app.player.stateChanges.length > 0) {
        while (app.player.stateChanges.length > 0) {
          var change = app.player.stateChanges.pop();
          switch (change) {
            case 'play': onPlay(); break;
            case 'pause': onPause(); break;
            case 'end': onEnd(); break;
            case 'next': onNext(); break;
            case 'previous': onPrevious(); break;
            case 'update_state': onUpdateState(); break;
            case 'update_station': onUpdateStation(); break;
          }
        }
      }

      // if song is close to end 
      if (app.player.audioPlayer.duration - app.player.audioPlayer.currentTime < 5) {
        app.player.stateChanges.push('end');
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

var onPlay = function () {
  app.player.state.isPlaying = true;
  app.player.stateChanges.push('update_state');
}
var onPause = function() {
  app.player.state.isPlaying = false;
  app.player.state.currentLocation = app.player.audioPlayer.currentTime;
  app.player.stateChanges.push('update_state');
}
var onNext = function() {
  console.log('next');
  app.player.stateChanges.push('update_state');
}
var onPrevious = function (argument) {
  console.log('previous');
  app.player.stateChanges.push('update_state');
}
var onUpdateState = function () {
  console.log('updated');
  var data = {
    room: 'user:'+app.user._id,
    event: 'update_player_state',
    state: app.player.state,
  }
  socket.emit('broadcast', data);
}
var onUpdateStation = function () {
  console.log('station');
  app.player.pause();
  app.player.play();
}
var onEnd = function() {
  app.player.state.currentSongIndex++;
  if (app.player.state.que.length > app.player.state.currentSongIndex) {
    app.player.audioPlayer.src = '/sendsong/?id='+app.player.state.que[app.player.state.currentSongIndex]._id;
    app.player.audioPlayer.play();
  } else {
    app.player.state.currentSongIndex = null;
    app.player.state.isPlaying = false;
  }
  app.player.stateChanges.push('update_state');
}

