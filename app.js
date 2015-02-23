var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');

var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(app.router);
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public')));
// app.use("/styles",  express.static(__dirname + '/public/css'));
// app.use("/scripts", express.static(__dirname + '/public/js'));

if (app.get('env') == 'development') {
  app.use(express.errorHandler());
  app.use(express.logger('dev'));
}

// usernames which are currently connected to the chat
var usernames = {};

// lista de todas las "salas" creadas
var matchnames = [];

var numUsers = 0;

// var match = io.of('/match').on('connection', function (socket) {
//   console.log(req.params.match);
// });

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data, matchname) {

    // we tell the client to execute 'new message'
    socket.broadcast.to(matchname).emit('new message', {
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

  // when the player join a match
  socket.on('join match', function (username, matchname, hiddeuser) {

    matchnames.push(matchname);
    socket.join(matchname);

    console.log("Username at join match: " + matchname + ", is: " + socket.username);

    socket.broadcast.to(matchname).emit('join match', {
      username: socket.username,
      numUsers: numUsers,
      matchname: socket.rooms
    });
  });

  // when the player begin the match
  // socket.on('new throw', function (username, matchname) {

  //   // comprobar codigo de acierto
  //   checkCode();

  //   // añadiremos una tirada al usuario
  //   addTrhowtoUsername(username);

  //   socket.broadcast.emit('new throw', {
  //     username: socket.username,
  //     numUsers: numUsers
  //   });
  // });

  // // al acabar partida
  // socket.on('acabar partida', function (username, matchname) {

  //   // comprobar si es ganador o perdedor
  //   checkWin();

  //   socket.broadcast.emit('acabar partida', {
  //     username: socket.username,
  //     matchname: matchname
  //   });
  // });

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

  // Routing

  // backURL=req.header('Referer') || '/';
  // do your thang
  // res.redirect(backURL);

  app.get('/', function (req, res) {
    res.sendfile( __dirname + '/public/' );
  });

  app.get('/:match', function(req, res) {
    var match = req.params.match;
    socket.emit('join match', { username: socket.username, matchname: match });
    res.sendfile( __dirname + '/public/', { hidden} );
  });

});
