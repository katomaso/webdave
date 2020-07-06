# Edit your files via webdav

This is the most elegant project I have created. It serves for editing your files online via WebDAV.
WebDAV is a standard protocol implemented by all mainstream HTTP servers that allows you to
write files to the remote disk. The only standard protocol I can think of. What is the benefit?
You can create your own blog - no php, no database, just an http server.

To prove my words, this project runs on [its Github page](https://katomaso.github.io/webdave).
You can access your webdav point (provided you have allowed CORS on your server) and edit your
files directly there. Then use some pelican/hugo/jekyll to turn those files into HTML.

# What is so elegant on your implementation?

It comes in form of pure web components. Go to the [github page](https://katomaso.github.io/webdave)
and view source (ctrl+u). Beautiful isn't it? You can see two components - a navigator and editor.

Don't you like my editor? I am not surprised. You can exchange it for your own. Just copy the index.html
to your server, keep the navigator component and replace the editor for you own. Will they cooperate? Yes!
That's the elegance I am talking about.

# Communication via customEvents on `document` is your new API

Each component listen to `customEvent`s on the top-level `document`. CustomEvents are
simply identified by a string and contain data in customEvent.detail dictionary. This 
project uses notation `object:action` for example `file:open`. Any component that can 
open a file (given its extension) should catch that event and react on it. Such as the
editor does. Once you hit "Save" button in the editor, it fires `file:save` event and 
puts file's content and full path into the `detail` of the CustomEvent. The navigator
catches it this time and sends the content of the file via WebDAV back to the server.  

# API

API is realized by dispatching CustomEvent on `document`. Following summary shows the
event's type (in bold) and required attributes of `detail` object of the event.

 * __"file:open"__, `detail` must contain `"filename"` (full path) and `"content"`.
 * __"file:save"__, `detail` must contain `"filename"` (full path) and `"content"`.


# How to develop

Project is using npm/yarn to manage dependencies and launch builds. During build, a webpack
is used so the result is runnable in browser.

`yarnpkg run build` to compile files into `dist/` folder. Part of the build process is copying
everything from `static` folder (even index.html) so the result in `dist/` is fully working.

`yarnpkg run serve` will launch a HTTP server listening on `localhost:8081` and serving content
from `dist/` folder. Also a WebDAV server is launched on url `locahost:8081/dav` that is
operating inside `dav-root/` folder. There is no authentication so keep username and password
empty when connecting using webdav-navigator.

`yarnpkg run publish` updates `docs/` that is published on github pages. So this is kind of a
deploy and you should use it only for stable releases.
