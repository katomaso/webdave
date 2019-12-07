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
		this.password = matchHashOr(/password=(\w+)/, "");
		this.url = matchHashOr(/url=(\w+)/, "https://");
		this.connected = false;
		this.path = "";

		document.addEventListener("file:save", this.save.bind(this));
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
			.then(
				content => {this.content = content; this.connected = true}, // important that connected is the last statement?
				error => console.log(error));
	}

	open(filename, content) {
		let e = new CustomEvent("file:open", {detail : {
			filename: filename, content: content
		}});
		document.dispatchEvent(e);
	}

	save(event) {
		let {filename, content} = event.detail;
		return this.client.putFileContents(filename, content);
	}

	navigate(item, event) {
		const navigator = this;
		stop(event);
		if(item.type == "directory") {
			let acc="";
			if(item.filename == "/") {item.filename = ""; }
			this.crumbs = item.filename.split("/").map(part => {return {filename: acc + "/" + part, basename: part, type: "directory"};});
			this.client.getDirectoryContents(item.filename).then(
				// change a property to trigger rendering
				content => {this.content = content; this.path = item.filename;},
				error => console.log(error))
		} else if(item.type == "file") {
			this.client.getFileContents(item.filename, {"format": "text"}).then(
				content => navigator.open(item.filename, content),
				error => console.log("Could not open " + item.filename + " because of " + error));
		}
	}

	attributeChangedCallback(name, oldval, newval) {
		console.log(name + ' change: ', newval);
			super.attributeChangedCallback(name, oldval, newval);
	}

	async newContentHandler(event) {
		stop(event);
		return this.newContent(event.target["name"].value)/*.then(
			() => this.navigate({filename: this.path, type: "directory"}),
			error => console.log("Filed to create new content!", error))*/;
	}

	async newContent(name) {
		const filePath = this.path + "/" + name;
		console.log("Creating " + filePath);
		if(name.indexOf(".") > 0) {
			// create file if the name contains "."
			return this.save(filePath, "");
		} else {
			return this.client.createDirectory(filePath);
		}
	}

	render() {
		return html`
			<style>
			a {display: inline-block; padding: 0.2em;}
			</style>
			${this.connected?
				html`${this.crumbs.map(item => html`<a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}/</a>`)}`:
				html`
				<form @submit="${this.connect}">
				<input type="text" name="username" placeholder="username" value="${this.username}" />
				<input type="password" name="password" placeholder="password" value="${this.password}" />
				<input type="text" name="url" placeholder="WebDAV URL (including https://)" value="${this.url}" />
				<input type="submit" value="Connect" />
				</form>`}
			<ul>
				${this.content.map(item => html`<li><a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}</a></li>`)}
				${this.connected?html`<li><form @submit=${this.newContentHandler}><input type="text" name="name"></form></li>`:html``}
			</ul>
		`;
	}
}

customElements.define('webdav-navigator', Navigator);
