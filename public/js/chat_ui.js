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

const socket = io.connect();
$(document).ready(function() {
  const charApp = new Chat(socket);
  socket.on("nameResult", function(result) {
    let message;
    if (result.success) {
      message = `你现在的名字叫:${result.name}`;
    } else {
      message = result.message;
    }
    $("#messages").append(divSystemContentElement(systemMessage));
  });

  socket.on("joinResult", function(result) {
    $("#room").text(result.room);
    $("#messages").append(divSystemContentElement("房间更换"));
  });

  socket.on("message", function(message) {
    const newElement = $("<div></div>").text(message.text);
    $("#messages").append(newElement);
  });
});
