const path = require("path");
const mime = require("mime");
const fs = require("fs");
const http = require("http");
const chatServer = require("./lib/chat_server");

let cache = {};
/**
 *  404函数
 * @param {*} res 响应对象
 */
function send404(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.write("Error 404: not found.");
  res.end();
}
/**
 *
 * @param {*} req 响应对象
 * @param {*} filePath  路径
 * @param {*} fileContents  文件数据
 */
function sendFile(res, filePath, fileContents) {
  res.writeHead(200, {
    "Content-Type": mime.getType(path.basename(filePath))
  });
  res.end(fileContents);
}

/**
 *
 * @param {*} res 响应对象
 * @param {*} cache 缓存
 * @param {*} absPath  文件路径
 */
function serveStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(res);
          } else {
            cache[absPath] = data;
            console.log(absPath);
            console.log(data);
            sendFile(res, absPath, data);
          }
        });
      } else {
        send404(res);
      }
    });
  }
}

const server = http.createServer(function(req, res) {
  let filePath = null;
  if (req.url === "/") {
    filePath = "public/index.html";
  } else {
    filePath = `public${req.url}`;
  }
  const absPath = `./${filePath}`;
  serveStatic(res, cache, absPath);
});

chatServer.listen(server);

server.listen(3000, function() {
  console.log("server listening on port 3000.");
});
