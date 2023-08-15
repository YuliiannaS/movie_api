const http = require('http');
const fs = require('fs');

http.createServer(function (req, res) {
    const url = req.url;
    let fileName;

    const logText = new Date() + ": " + url + "\r\n";
    fs.appendFile(__dirname + '/log.txt', logText, function (err) {
        if (err) throw err;
    });

    if (url.includes("documentation")) {
        fileName = __dirname + "/documentation.html";
    } else {
        fileName = __dirname + "/index.html";
    }

    fs.readFile(fileName, function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
      });
  }).listen(8080);