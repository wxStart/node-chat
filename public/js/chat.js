var Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
  const message = {
    room,
    text
  };
  this.socket.emit("message", message);
};

Chat.prototype.changeRoom = function(room) {
  this.socket.emit("join", {
    newRoom: room
  });
};

Chat.prototype.processCommand = function(command) {
  const words = command.split(" ");
  const cmd = words[0].substring(1, words[0].length).toLowerCase();
  let message = false;
  switch (cmd) {
    case "join":
      words.shift();
      const room = words.jsoin(" ");
      this.changeRoom(room);
      break;
    case "nick":
      words.shift();
      const name = words.jsoin(" ");
      this.socket.emit("nameAttempt", name);
      break;
    default:
      message = "未知 cmd";
      break;
  }
  return message;
};
