const express = require('express');
const webdav = require('webdav-server').v2;
const app = express();

app.use(express.static('dist'));

app.get('/', function (req, res) {
   res.sendFile(__dirname + "/dist/" + "index.html" );
})

// Mount the WebDAVServer instance
const webdav_server = new webdav.WebDAVServer();
webdav_server.setFileSystem('', new webdav.PhysicalFileSystem(__dirname + "/dav-root"));
app.use(webdav.extensions.express('/dav', webdav_server));

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Web server listening at http://%s:%s", host, port)
   console.log("WebDav mount point at http://%s:%s/dav", host, port)
})
