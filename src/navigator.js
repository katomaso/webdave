import { createClient as webdavClient } from "webdav";
import { LitElement, html, css } from "lit-element";

/* WebDAV file object examples
{basename: "a.md"
etag: "679e6de74f05cc755edc4a5ae9195bc4"
filename: "/dir1/a.md"
lastmod: "Mon, 20 Apr 2020 19:30:42 GMT"
mime: "text/markdown"
size: 0
type: "file"}
----------------------------------------
{basename: "dir11"
etag: "a5138e5406c0c8b3521486dc73b950b4"
filename: "/dir1/dir11"
lastmod: "Mon, 20 Apr 2020 19:30:46 GMT"
size: 0
type: "directory"}
*/

function matchHashOr(expression, defaultValue) {
	const matched = window.location.hash.match(expression);
	if (Array.isArray(matched) && matched.length == 2) {
		return matched[1];
	}
	return defaultValue;
}

function stripProtocol(url) {
	if (url.startsWith("https://")) return url.substr(8, url.length);
	if (url.startsWith("http://")) return url.substr(7, url.length);
	return url;
}

function loadValue(key, defaultValue) {
	let value = window.localStorage.getItem(key);
	if (value == null) return defaultValue;
	return value;
}

function storeValue(key, value) {
	 window.localStorage.setItem(key, value);
}

function stop(event) {
	if(event !== undefined) {
		event.preventDefault();
		event.stopPropagation();
	}
}

function pathJoin(/*paths...*/) {
	let path = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		if(path.endsWith("/")) path = path + arguments[i];
		else path = path + "/" + arguments[i];
	}
	return path;
}

class Navigator extends LitElement {

	static get sortOptions() {return ["name", "time"];}

	constructor() {
		super();
		this.client = null;
		this.content = [];  // content of current directory (denoted by path)
		this.crumbs = []; // breadcrumbs-like navigation derived from path

		this.username = matchHashOr(/username=(\w+)/, "");
		if(!this.username) {
			this.username = loadValue("navigator.username", "")
		}
		this.url = matchHashOr(/url=(\w+)/, "");
		if(!this.url) this.url = loadValue("navigator.url", "");
		if(!this.url) this.url = window.location;

		this.password = ""
		this.connected = false;
		this.path = matchHashOr(/path=([\w/\._\-]+)/, "/");
		this.sort = Navigator.sortOptions[0]; // first is the default

		document.addEventListener("file:save", this.saveHandler.bind(this));
	}

	static get properties() {
		return {
			username: {type: String},
			password: {type: String},
			url: {type: String},
			path: {type: String},
			sort: {type: String},
			connected: {type: Boolean, attribute: false}
		}
	}

	connectHandler(event) {
		if (this.connected) return;

		if (event instanceof CustomEvent) {
			return this.connect(event.username, event.password, event.url);
		} else if (event) {
			stop(event);
			return this.connect(
				(event.target['username']).value,
				(event.target['password']).value,
				(event.target['url']).value
			).then(() => {
				if(!this.connected) return;

				return document.dispatchEvent(new CustomEvent("login", {"detail": {
					'username': this.username,
					'password': this.password,
					'url': this.url
				}}));
			});
		}
	}

	connect(username, password, url) {
		this.username = username;
		this.password = password;
		this.url = url;
		return new Promise(
			(resolve, reject) => resolve(webdavClient(
				this.url,
				{"username": this.username, "password": this.password}))
			).then(client => {
				this.client = client;
				return client.stat("/");
			})
			.then(stat => {
				this.connected = true;
				storeValue("navigator.username", this.username);
				storeValue("navigator.url", this.url);
				return this.navigate(this.path);
			})
			.catch(error => {
				this.connected = false;
				this.error("Connection failed", error);
				return this.requestUpdate(); // to refresh form values
			});
	}

	open(filename, content) {
		let e = new CustomEvent("file:open", {detail : {
			filename: filename, content: content
		}});
		document.dispatchEvent(e);
	}

	saveHandler(event) {
		let {filename, content} = event.detail;
		return this.save(filename, content);
	}

	save(filename, content) {
		return this.client.putFileContents(filename, content).then(() => this.refresh());
	}

	navigate(path, event) {
		stop(event);
		return this.client.stat(path).then(
			stats => {
				if(stats.type == "file") {
					if(stats.mime && !stats.mime.startsWith("text")) throw new Error("Can open only text files");
					if(stats.size > 512000) throw new Error("Cannot open too big files (512kB is the limit)");
					return this.client.getFileContents(path, {"format": "text"}).then(
						content => this.open(path, content)
					);
				}
				else if(stats.type == "directory") {
					const parts = path.split("/");
					this.crumbs = [{filename: "/", basename: stripProtocol(this.url || "")}];
					for(let i = 1; i < parts.length && parts[i].filename != ""; i++) {
						this.crumbs.push({filename: pathJoin(this.crumbs[i-1].filename, parts[i]), basename: parts[i]});
					}
					return this.client.getDirectoryContents(path).then(
						content => {
							this.content = content;
							if(this.path == path) {
								return this.requestUpdate()
							}
							this.path = path;
							return this.updateComplete;
						}).then(
						() => {
							// fire an event about folder change
							return document.dispatchEvent(new CustomEvent("navigate", {"detail": {
								'path': this.path
							}}));
						});
				}
				else throw new Error(`Does $path really exist?`);
			});
	}

	sorted(content) {
		let sortFunc;
		if(this.sort == "name") {
			sortFunc = (a, b) => a.basename < b.basename ? -1 : +1;
		}
		if(this.sort == "time") {
			sortFunc = (a, b) => new Date(a.lastmod) < new Date(b.lastmod) ? -1 : +1;
		}
		return this.content.filter(d => d.type == "directory").sort(sortFunc).concat(
				this.content.filter(d => d.type == "file").sort(sortFunc));
	}

	refresh() {
		this.selectNone();
		return this.navigate(this.path);
	}

	newContentHandler(event) {
		stop(event);
		const input = event.target["name"];
		const filename = input.value;
		input.blur();
		input.value = ""; // zero out old name
		return this.newContent(filename);
	}

	uploadContentHandler(event) {
		stop(event);
		if(event.target.files.length == 0) return;
		let nav = this;
		let uploads = [];
		let input = event.target;
		input.disabled = true;
		for (let file of input.files) {
			uploads.push(this.save(pathJoin(this.path, file.name), file));
		}
		return Promise.all(uploads)
			.then(() => this.refresh())
			.catch(err => this.error("Failed to upload files", err))
			.finally(() => {
				input.value = "";
				input.disabled = false;
			});
	}

	newContent(name) {
		const filePath = pathJoin(this.path, name);
		const isDir = (name.indexOf(".") < 0 || name.endsWith("/"));

		return (isDir?
			this.client.createDirectory(filePath):
			this.save(filePath, "").then(() => this.open(filePath, ""))
		).then(() => this.refresh());
	}

	// Return list of selected filenames (absolute paths)
	selected() {
		return Array.from(this.shadowRoot.querySelectorAll("input[type='checkbox']"))
			.filter(i => i.name != "all" && i.checked)
			.map(i => i.name);
	}

	toggleSelection(event) {
		let checked = event.target.checked;
		return this.shadowRoot
			.querySelectorAll("input[type='checkbox']")
			.forEach(i => i.checked==checked?checked:i.checked=checked);
			// if the check status conforms to the main checked status than keep
			// otherwise change
	}
	selectNone() {return this.toggleSelection({"target": {"checked": false}});}
	selectAll() {return this.toggleSelection({"target": {"checked": true}});}

	// Delete all files that have checkbox checked next to them
	deleteSelected(event) {
		stop(event);
		if(event) {
			// event exists thus it was made by the user clicking a button - let's re-confirm
			if(!confirm("Really delete files?")) {
				return;
			}
		}
		return Promise.all(this.selected().map(
				filename => this.client.deleteFile(pathJoin(this.path, filename)))
			)
			.then(deleted => this.refresh())
			.catch(err => this.error("Could not delete file " + pathJoin(this.path, filename), err));
	}

	// Delete all files that have checkbox checked next to them
	moveSelected(event) {
		stop(event);
		let whereTo = window.prompt("Where to move", this.path);
		return this.client.stat(whereTo)
			.then(stat => {
				if(stat.type != "directory") throw new Error(`$whereTo is not an existing directory`);
				return Promise.all(this.selected().map(
					(filename) => this.client.moveFile(pathJoin(this.path, filename), pathJoin(whereTo, filename)))
				)
			})
			.then(deleted => this.refresh())
			.catch(err => this.error(
				"Could not move file from " + pathJoin(this.path, filename) + " to " + pathJoin(whereTo, filename), err
			));
	}

	static get styles() {
		return css`
			a {display:inline-block; padding:0.2em; color:#000}
			label {font-size: 14pt; margin: 0 0.3rem;}
			select {padding: .2rem .5rem}
			ul {padding-left: .5rem}
			li {list-style: none; display: flex; margin-bottom: .4rem}
			li .list-checkbox {
				box-sizing: border-box;
				position: relative;
				width: 30px;
				min-height: 30px;
				flex-shrink: 0;
			}
			li .list-rest {
				display: flex;
				flex: 1 1 auto;
				overflow: hidden;
				min-height: 30px;
				line-height: 30px;
				text-decoration: none;
				color: inherit;
				font-size: 13pt;
			}
			li a.list-rest:hover {
				background-color: #ccc;
			}
			li input[type=checkbox] {
				margin: 7px 7px;
				width:16px; height:16px;
			}
			h1 + form input {
				margin-left: 1em;
				display: block;
				border-radius: 5px;
				padding: 0.5em 1em;
				margin-bottom: 1em;
				font-size: 10pt;
			}
			h1 + form input[type="submit"] {
				background-color: green;
				color: white;
			}
		`;
	}

	render() {
		return html`
			${this.connected?
				html`
					${this.crumbs.map(item => html`/ <a href="" @click="${this.navigate.bind(this, item.filename)}">${item.basename}</a>`)}
					<ul>
						<li>
							<label>Sort by</label>
							<select name="sort" @change=${(e) => this.sort = e.target.value}>
							${Navigator.sortOptions.map((option) => (this.sort == option) ?
								html`<option value="${option}" selected>${option}</option>` :
								html`<option value="${option}">${option}</option>`
							)}
							</select>
						</li>
						${(this.content.length == 0)?
							html`<li>&lt;empty&gt;</li>`:
							html`<li>
									<div class="list-checkbox">
										<input type="checkbox" name="all" @change=${this.toggleSelection}>
									</div>
									<div class="list-rest">
									<label>Selection:</label>
									<button @click=${this.moveSelected}><em>move</em></button>
									&nbsp;
									<button @click=${this.deleteSelected}><em>delete</em></button>
									</div>
								</li>
								${this.sorted(this.content).map(item => html`
								<li>
									<div class="list-checkbox">
									<input type="checkbox" name="${item.basename}" value="${item.filename}"/>
									</div>
									<a class="list-rest" href="" @click="${(e) => this.navigate(item.filename, e)}">${item.basename}${item.type=="directory"?"/":""}</a>
								</li>`)}`
						}
						<li>
							<form @submit=${this.newContentHandler}>
								<input type="text" name="name" placeholder="new item"/>
								<input type="submit" value="create" />
							</form>
						</li>
						<li>
							<form @submit=${stop}>
								<input type="file" name="file" multiple @change=${this.uploadContentHandler}/>
							</form>
						</li>
					</ul>
				`:
				html`
				<h1>WebDAV browser</h1>
				<form @submit="${this.connectHandler}">
					<input type="text" name="username" placeholder="username" value="${this.username}" />
					<input type="password" name="password" placeholder="password" value="${this.password}" />
					<input type="text" name="url" placeholder="WebDAV URL (including https://)" value="${this.url}" />
					<input type="submit" value="Connect" />
				</form>`}
			`;
	}

	error(message, error) {
		console.log(message);
		console.log(error.toString());
		let detail = {
			"message": `${message}: ${error.toString()}`
		}
		return document.dispatchEvent(new CustomEvent("log:error", {"detail" : detail}));
	}
}

customElements.define('webdav-navigator', Navigator);
