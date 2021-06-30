import {LitElement, html} from 'lit-element';

// taken from https://lucidar.me/en/web-dev/how-to-slugify-a-string-in-javascript/
function slugify(str)
{
	str = str.replace(/^\s+|\s+$/g, '');

	// Make the string lowercase
	str = str.toLowerCase();

	// Remove accents, swap ñ for n, etc
	var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
	var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
	for (var i=0, l=from.length ; i<l ; i++) {
		str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
	}

	// Remove invalid chars
	str = str.replace(/[^a-z0-9 -]/g, '')
	// Collapse whitespace and replace by -
	.replace(/\s+/g, '-')
	// Collapse dashes
	.replace(/-+/g, '-');

	return str;
}

class CloudBlogAdmin extends LitElement {

	constructor() {
		super();
		this.connected = false;
		this.path = "/";
		this.category = "article";
		document.addEventListener("login", (e) => this.login(e));
		document.addEventListener("navigate", (e) => this.path = e.detail.path);
	}

	static get properties() {
		return {
			"connected": {type: Boolean, attribute: false},
			"path": {type: String, attribute: false},
			"category": {type: String}
		}
	}

	login(event) {
		this.url = event.detail.url;
		this.connected = true;
	}

	getCategory() {
		let category = this.category;
		if(this.path.length>1) {
			category = this.path.substring(this.path.lastIndexOf("/")+1, this.path.length);
			if(category.length == 0) {
				category = this.path
			}
		}
		return category[0].toUpperCase() + category.substring(1, category.length);
	}

	create() {
		const title = window.prompt("Název nového článku");
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const day = now.getDay();
		if(!title) return;
		let filename = slugify(title);
		if(title.length > 48) {
			filename = slugify(title.substring(0, title.indexOf(" ", 35)));
		}
		const file_data = {
			filename: `${this.path}/${year}-${month<10?"0"+month:month}-${filename}.md`,
			content: [
				`Title: ${title}`,
				`Date: ${year}-${month<10?"0"+month:month}-${day<10?"0"+day:day}`,
				`Category: ${this.getCategory()}`,
				`Status: draft`,
				"Description: Krátký popis obsahu vašeho článku\n"+
							 "který může být na více řádků jen nový řádek nesmí začínat slovem následovaným dvojtečkou.\n"+
							 "Také nesmí obsahovat prázdný řádek",
				"",
				`Zde začíná váš nový článek. Používejte Markdown syntax. Až budete hotovi smažte řádek "Status: draft" nebo ho změňte na "Status: published"`
			].join("\n")
		};

		document.dispatchEvent(new CustomEvent("file:save", {detail: file_data}));
		document.dispatchEvent(new CustomEvent("file:open", {detail: file_data}));
	}

	preview() {
		return document.dispatchEvent(new CustomEvent("file:save", {detail: {
			"filename": "/.preview",
			"content": ""
		}}));
	}

	publish() {
		const handled = !document.dispatchEvent(new CustomEvent("file:save", {detail: {
			"filename": "/.publish",
			"content": ""
		}}));
		// if(!handled) {
		// 	document.dispatchEvent(new CustomEvent("log:error", {detail: {message: "Publish event was not handled! Are you connected to the blog's content?"}}));
		// 	return;
		// }
		return fetch(this.url + "/.publish")
			.then(response => response.body)
			.then(stream => {
				const utf8Decoder = new TextDecoder("utf-8");
				const output = this.shadowRoot.querySelector("pre");
				const reader = stream.getReader();
				return reader.read().then(function processText({ done, value }) {
					if (done) return;
					output.textContent += utf8Decoder.decode(value, {stream: true});
					// Read some more, and call this function again
					return reader.read().then(processText);
				});
			});
	}

	render() {
		return html`${this.connected?
			html`
			<button @click=${this.create}>Nový článek v ${this.path}</button>
			<br>
			<button @click=${this.preview}>Náhled</button>
			<button @click=${this.publish}>Publikovat</button>
			<br>
			<pre></pre>
			`:
			html``
			}
		`;
	}
}

customElements.define('cloudblog-admin', CloudBlogAdmin);