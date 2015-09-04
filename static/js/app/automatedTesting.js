/*

  var numberOfAccounts = 5;
  var users = [];
  var groups = [];
  var numberofWaits= 0;
  var defaultWaitTime = 5000;
  var voteProbability = 0.65;
  var waitTime = function () {
    return numberofWaits * defaultWaitTime;
  }

  // create main user 
  var mainUser = {
    email: 'malcolmjmr',
    password: 'peanut butter jelly'
  }

  app.db.signup.local(mainUser.email, mainUser.password);

  // create additional users
  for (var accountIndex = 0; accountIndex < numberOfAccounts; accountIndex++) {
    app.db.signup.local(accountIndex,accountIndex);
  }

  numberofWaits++;
  window.setTimeout(function () {
    console.log('login main user')
    app.db.login.local(mainUser.email, mainUser.password);
  }, waitTime);
  
  numberofWaits++;
  window.setTimeout(function () {
    console.log('create group');
    
    // main user create group
  
  }, waitTime);

  numberofWaits++;
  window.setTimeout(function () {
    console.log('get group and add to groups')
    for (group in app.groups) {
      if (app.groups[group].createdBy === createLabel(app.user)) {
        groups.push(group);
      } 
    }
  }, waitTime);
  
  numberofWaits++;
  // additional users request access to group
  window.setTimeout(function () {
    console.log('additional users request access to group')
    
    for (var accountIndex = 0; accountIndex < numberOfAccounts;  window.setTimeout(function () {accountIndex++;}, waitTime)) {
      numberofWaits++;
      app.db.login.local(accountIndex,accountIndex);
      users.push(createLabel(app.user));
      groups.forEach(function (group) {
        app.add(group);
      });
    }
  }, waitTime)
  
  numberofWaits+numberOfAccounts;
  window.setTimeout(function () {
    
    // main user add additional users to group
    console.log('main user add additional users to group')
  app.db.login.local(mainUser.email, mainUser.password);
    users.forEach(function (user) {
      groups.forEach(function (group) {

        app.addTo(group, user);

      });
    });
  }, waitTime);

  // main user adds songs to group
  numberofWaits++;

  window.setTimeout(function () {
    app.getAll('song');
    console.log('main user adds songs to group')
    numberofWaits++;
    groups.forEach(function (group) {

      for (song in app.songs) { app.addTo(group, song); }

    });

  }, waitTime);

    window.setTimeout(function () {
      console.log('all users vote on songs (randomly decide to vote, randomly decide vote)')
      // all users vote on songs (randomly decide to vote, randomly decide vote) 
      for (var accountIndex = 0; accountIndex < numberOfAccounts; accountIndex++) {

        app.db.login.local(accountIndex, accountIndex);

        app.user = {
          _id: users[accountIndex].split(':')[1],
          type: 'user'
        };

        for (song in app.songs) {
          var vote = Math.random() < voteProbability ? 1 : -1;
          app.vote(song, vote);
        }

      }
    }, waitTime)
*/

var logout = function () {
  delete app.user
  delete io.sockets['http://'+window.location.host];
}
