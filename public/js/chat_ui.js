function divEscapedContentElement(message) {
  return $("<div></div>").text(message);
}

function divSystemContentElement(message) {
  return $("<div></div>").html(`<i>${message}</i>`);
}

function processUserInput(chatApp, socket) {
  const message = $("#send-message").val();
  let systemMessage;
  const messageElm = $("#messages");
  if (message.charAt(0) === "/") {
    systemMessage = chatApp.processCommand("message");
    if (systemMessage) {
      messageElm.append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($("#room").text(), message);
    messageElm
      .append(divEscapedContentElement(message))
      .scrollTop(messageElm.prop("scrollheight"));
  }
  $("#send-message").val("");
}


$(document).ready(function() {
  const socket = io.connect();
  const charApp = new Chat(socket);
  socket.on("nameResult", function(result) {
    let message;
    if (result.success) {
      message = `你现在的名字叫:${result.name}`;
    } else {
      message = result.message;
    }
    $("#messages").append(divSystemContentElement(message));
  });

  socket.on("joinResult", function(result) {
    $("#room").text(result.room);
    $("#messages").append(divSystemContentElement("房间更换"));
  });

  socket.on("message", function(message) {
    const newElement = $("<div></div>").text(message.text);
    $("#messages").append(newElement);
  });

  socket.on("rooms", function(rooms) {
    const roomEle = $("#room-list");
    roomEle.empty();
    for (let room in rooms) {
      room = room.substring(0, room.length);
      if (room !== "") {
        roomEle.append(divEscapedContentElement(room));
      }
    }
    $("#room-list div").click(function() {
      charApp.processCommand("/join " + $(this).text());
      $("#send-message").focus();
    });
  });
  setInterval(function() {
    socket.emit("rooms");
  }, 1000);
  $("#send-message").focus();

  $("#send-form").submit(function() {
    processUserInput(charApp, socket);
    return false;
  });
});
