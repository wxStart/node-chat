const socketio = require("socket.io");
let io = null;
let guestNumber = 1;
let nickNames = {};
let nameUsed = [];
let currentRoom = {};

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set("log level", 1);
  io.sockets.on("connection", function(socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);
    joinRoom(socket, "Lobby");
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, nameUsed);
    handleRoomJoining(socket);
    socket.on("rooms", function() {
      socket.emit("rooms", io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, nameUsed);
  });
};

/**
 * 分类用户的名字
 * @param {*} socket
 * @param {*} guestNumber
 * @param {*} nickNames
 * @param {*} nameUsed
 */
function assignGuestName(socket, guestNumber, nickNames, nameUsed) {
  const name = `用户${guestNumber}`;
  nickNames[socket.id] = name;
  socket.emit("nameResult", {
    success: true,
    name
  });
  nameUsed.push(name);
  return guestNumber + 1;
}

/**
 * 进入聊天室逻辑
 * @param {*} socket
 * @param {*} room
 */
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit("joinResult", { room });

  socket.broadcast.to(room).emit("message", {
    text: `${nickNames[socket.id]} has joined ${room} .`
  });
  const usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = `Users currently in ${room}:`;
    for (let index in usersInRoom) {
      const userSocketId = usersInRoom[index].id;
      if (userSocketId !== socket.id) {
        if (index > 0) {
          usersInRoomSummary += ",";
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += ".";
    socket.emit("message", { text: usersInRoomSummary });
  }
}

/**
 * 修改名字操作
 * @param {*} socket
 * @param {*} nickNames
 * @param {*} nameUsed
 */
function handleNameChangeAttempts(socket, nickNames, nameUsed) {
  socket.on("nameAttempt", function(name) {
    if (name.indexOf("用户") === 0) {
      socket.emit("nameResult", {
        success: false,
        message: "名字不能以”用户“开头"
      });
    } else {
      if (nameUsed.indexOf(name) === -1) {
        const prevName = nickNames[socket.id];
        const prevIndex = nameUsed.indexOf(prevName);
        nameUsed.push(prevName);
        nickNames[socket.id] = name;
        delete nameUsed[prevIndex];
        socket.emit("nameResult", {
          success: true,
          name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit("message", {
          text: `${prevName} 改名为: ${name} .`
        });
      } else {
        socket.emit("nameResult", {
          success: false,
          message: "这个名字已经被其他用户使用，请换个名字再试"
        });
      }
    }
  });
}

/**
 * 发送消息
 * @param {*} socket
 * @param {*} nickNames
 */
function handleMessageBroadcasting(socket, nickNames) {
  socket.on("message", function(message) {
    socket.broadcast.to(message.room).emit("message", {
      text: `${nickNames[socket.id]}:${message.text}`
    });
  });
}

/**
 * 传建房间或者更换房间
 * @param {} socket
 */
function handleRoomJoining(socket) {
  socket.on("join", function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

/**
 * 用户离开房间
 * @param {*} socket 
 * @param {*} nickNames 
 * @param {*} nameUsed 
 */
function handleClientDisconnection(socket, nickNames, nameUsed) {
  socket.on("disconnect", function() {
    const nameIndex = nameUsed.indexOf(nickNames[socket.id]);
    delete nameUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
