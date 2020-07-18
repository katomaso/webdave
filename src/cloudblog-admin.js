import {LitElement, html} from 'lit-element';

class CloudBlogAdmin extends LitElement {

	constructor() {
		this.connected = false;
		document.addEventListener("login", (e) => this.connected = true);
	}

	static get properties() {
		return {
			"connected": {type: Boolean}
		}
	}

	preview() {
		return document.dispatchEvent(new CustomEvent("file:save", {detail: {
			"filename": "/.preview",
			"content": ""
		}}));
	}

	publish() {
		return document.dispatchEvent(new CustomEvent("file:save", {detail: {
			"filename": "/.publish",
			"content": ""
		}}));
	}

	render() {
		return html`${this.connected?
			html`
			<button @click=${this.preview}>Náhled</button>
			<button @click=${this.publish}>Publikovat</button>
			`:
			html`
			Nejdříve je nutné se přihlásit
			`
			}
		`;
	}
}

customElements.define('cloudblog-admin', CloudBlogAdmin);