"use strict";

import { createClient as webdavClient } from "webdav";
import { LitElement, html, css } from "lit-element";

class Navigator extends LitElement {
	
	constructor() {
		super();
		this.client = null;
		this.content = [];  // content of current directory (denoted by path)
		this.crumbs = []; // breadcrumbs-like navigation derived from path
		this.open = (f, c) => console.log("Function open was not assigned!");
		this.username = "";
		this.password = "";
		this.url = "";
		this.connected = false;
		this.path = "";
	}

	static get properties() {
		return {
			username: {type: String, reflect: true},
			password: {type: String},
			url: {type: String},
			path: {type: String},
			connected: {type: Boolean, attribute: false},
			open: {type: Function, reflect: false}
		}
	}

	connect(event) {
		event.preventDefault();
		event.stopPropagation();
		this.username = (this.shadowRoot.querySelector('form')['username']).value;
		this.password = (this.shadowRoot.querySelector('form')['password']).value;
		this.url = (this.shadowRoot.querySelector('form')['url']).value;
		this.client = webdavClient(this.url, {"username": this.username, "password": this.password});
		this.client.getDirectoryContents(this.path)
			.then(content => {console.log(content); this.content = content; this.connected = true}, // important that connected is the last statement?
			      () => console.log("Invalid credentials!"))
	}

	save(filename, content) {
		return this.client.putFileContents(filename, content);
	}

	navigate(item, e) {
		var navigator = this;
		e.preventDefault();
		e.stopPropagation();
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
	
	render() {
		return html`
			<style>
			a {display: inline-block; padding: 0.2em;}
			</style>
			${this.connected?
				html`${this.crumbs.map(item => html`<a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}/</a>`)}`:
				html`
				<form>
				<input type="text" name="username" placeholder="username" value="${this.username}" />
				<input type="password" name="password" placeholder="password" value="${this.password}" />
				<input type="text" name="url" placeholder="WebDAV URL (including https://)" value="${this.url}" />
				<input type="submit" value="Connect" @click="${this.connect}" />
				</form>`}
			<ul>
				${this.content.map(item => html`<li><a href="" @click="${(e) => this.navigate(item, e)}">${item.basename}</a></li>`)}
			</ul>
		`;
	}
}

customElements.define('webdav-navigator', Navigator);
