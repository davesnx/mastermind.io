// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var router = express.Router();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var matchnames = [];
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {

    // we store the username in the socket session for this client
    socket.username = username;

    // add the client's username to the global list
    usernames[username] = username;

    ++numUsers;
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers
    });

    socket.emit('view matchnames', {
      matchnames: matchnames
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the player begin the match
  socket.on('begin match', function (username, matchname) {

    // crear nuevo codigo
    // createNewCode();

    matchnames.push(matchname);

    socket.emit('log match', {
      matchname: matchname
    });

    socket.broadcast.emit('begin match', {
      username: socket.username,
      numUsers: numUsers,
      matchname: matchname,
      matchnames: matchnames
    });
  });

  // when the player join in a match
  socket.on('join match', function (username, matchname) {

    //

    socket.broadcast.emit('join match', {
      username: socket.username,
      numUsers: numUsers,
      matchname: matchname
    });
  });

  // when the player begin the match
  socket.on('new throw', function (username, matchname) {

    // comprobar codigo de acierto
    checkCode();

    // añadiremos una tirada al usuario
    addTrhowtoUsername(username);

    socket.broadcast.emit('new throw', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // al acabar partida
  socket.on('acabar partida', function (username, matchname) {

    // comprobar si es ganador o perdedor
    checkWin();

    socket.broadcast.emit('acabar partida', {
      username: socket.username,
      matchname: matchname
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

