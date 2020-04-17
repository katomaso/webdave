"use strict";

import { createClient as webdavClient } from "webdav";
import { LitElement, html, css } from "lit-element";


function matchHashOr(expression, defaultValue) {
	const matched = window.location.hash.match(expression);
	if (Array.isArray(matched) && matched.length == 2) {
		return matched[1];
	}
	return defaultValue;
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

class Navigator extends LitElement {

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
		this.path = "";

		document.addEventListener("file:save", this.saveHandler.bind(this));
	}

	static get properties() {
		return {
			username: {type: String},
			password: {type: String},
			url: {type: String},
			path: {type: String},
			connected: {type: Boolean, attribute: false},
			open: {type: Function, reflect: false}
		}
	}

	connect(event) {
		stop(event);
		this.username = (event.target['username']).value;
		this.password = (event.target['password']).value;
		this.url = (event.target['url']).value;
		this.client = webdavClient(this.url, {"username": this.username, "password": this.password});
		this.client.getDirectoryContents(this.path)
			.then(content => {
				storeValue("navigator.username", this.username);
				storeValue("navigator.url", this.url);
				this.content = content;
				this.connected = true; // important that connected is the last statement?
			})
			.catch(error => console.log(error));
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
		return this.client.putFileContents(filename, content);
	}

	navigate(item, event) {
		const navigator = this;
		stop(event);
		if(item.type == "directory") {
			let acc="";
			if(item.filename == "/") {item.filename = ""; }
			this.crumbs = item.filename.split("/").map(part => {return {filename: acc + "/" + part, basename: (part?part:window.location.hostname), type: "directory"};});
			return this.client.getDirectoryContents(item.filename).then(
				// change a property to trigger rendering
				content => {this.content = content; this.path = item.filename;},
				error => console.log(error))
		} else if(item.type == "file") {
			return this.client.getFileContents(item.filename, {"format": "text"}).then(
				content => navigator.open(item.filename, content),
				error => console.log("Could not open " + item.filename + " because of " + error));
		}
	}

	attributeChangedCallback(name, oldval, newval) {
		console.log(name + ' change: ', newval);
			super.attributeChangedCallback(name, oldval, newval);
	}

	newContentHandler(event) {
		stop(event);
		const filename = event.target["name"].value;
		event.target["name"].value = ""; // zero out old name
		return this.newContent(filename);
	}

	newContent(name) {
		const navigator = this;
		const filePath = this.path + "/" + name;
		const isDir = !(name.indexOf(".") > 0);

		return isDir?
			this.client.createDirectory(filePath).then(
				() => navigator.navigate({filename: filePath, "type": "directory"})
			):
			this.save(filePath, "").then(
				() => navigator.navigate({filename: this.path, "type": "directory"})
				).then(
				() => navigator.open(filePath, "")
			);
	}

	static get styles() {
		return css`
			a {display: inline-block; padding: 0.2em;}
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
			li:last-of-type {list-style: none; margin-left: -1em}
		`;
	}

	render() {
		return html`
			${this.connected?
				html`
					${this.crumbs.map(item => html`<a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}</a> /`)}
					<ul>
						${(this.content.length == 0)?
							html`<li>&lt;empty&gt;</li>`:
							html`${this.content.map(item => html`
								<li>
									<a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}</a>
								</li>`)}`
						}
						${this.connected?
							html`<li>
									<form @submit=${this.newContentHandler}>
										<input type="text" name="name" placeholder="new item"/>
										<input type="submit" value="create" />
									</form>
								</li>`:
							html``
						}
					</ul>
				`:
				html`
				<h1>WebDAV browser</h1>
				<form @submit="${this.connect}">
					<input type="text" name="username" placeholder="username" value="${this.username}" />
					<input type="password" name="password" placeholder="password" value="${this.password}" />
					<input type="text" name="url" placeholder="WebDAV URL (including https://)" value="${this.url}" />
					<input type="submit" value="Connect" />
				</form>`}
			`;
	}
}

customElements.define('webdav-navigator', Navigator);
