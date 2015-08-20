var app = {
  initiate: function(email, password) {
    app.db.login.local(email, password); 
  }
};

app.db = {
  collection: function(collectionType) {
    var data = {
      userId: app.user._id,
      collection: collectionType
    }
    return { 
      create: function(item) {
        data.item = item;
        socket.emit('create', data);
      },
      update: function(item) {
        data.item = item;
        socket.emit('update', data);
      },
      delete: function(item) {
        data.item = item;
        socket.emit('delete', data);
      },
      addSubItem: function(item) {
        data.subItem = item;
        return {
          to: function(itemType) {
            data.subItemType = itemType;
            socket.emit('sub_item:add', data);
          }
        }
      },
      updateSubItem: function(item) {
        data.subItem = item;
        return {
          in: function(itemType) {
            data.subItemType = itemType;
            socket.emit('sub_item:update', data);
          }
        }
      },
      removeSubItem: function(item) {
        data.subItem = item;
        return {
          from: function(itemType) {
            data.subItemType = itemType;
            socket.emit('sub_item:remove', data);
          }
        }
      },
      getItem: function(data) {
        socket.emit('get_item', data);
      }
    }
  },
  getUserData: function(data) {
    socket.emit('get_user_data', data);
  },
  // update entry in database

  // log in 
  login: {
    local: function(email, password) {

      var params = {
        email: email,
        password: password
      };

      $.post("/login", params, function(res) {
        if (res.error) {
          console.log(res.error);
        } else {
          console.log(res.data);
          app.user = res.data;
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

      $.post("/signup", params, function(res) {
        if (res.error) {
          console.log(res.error);
        } else {
          app.user = res.data;
          socket.emit('ready', res.data);
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


app.social = {
  rooms: [],
  initiate: function() {
    var roomTypes = ['stations','groups'];
    roomTypes.forEach(function(roomType) {
      for (room in app.user[roomtype]) {
        socket.join(room._id);
        app.chatroom.rooms.push(room._id);
        socket.to(room._id).emit('new member', app.user);
      }
    });
  },
  join: function(room) {
    app.chatroom.rooms.push(room)
    socket.join(room);
  },
  leave: function (room) {
    app.chatroom.rooms.
    socket.leave(room);
  },
  send: function(room, msg) {
    socket.to(room).emit(msg);
  },

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
