import {LitElement, html, css} from 'lit-element';

class CloudBlogAdmin extends LitElement {

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

	create() {
		return document.dispatchEvent(new CustomEvent("file:save", {detail: {
			"filename": "",
			"content": ""
		}}));
	}

	render() {
		return html`<div>
			<button class="preview" @click=${this.preview}>Náhled</button>
			<button class="publish" @click=${this.publish}>Publikovat</button>
		</div>`;
	}

	static get styles() {
		return css`
		div {padding: .3rem 2rem}
		button {padding: .1rem .6rem; margin-right: 1rem}
		.publish {background-color: #ca2; color: #fff}
		.preview {background-color: #2ac; color: #fff}
		`;
	}
}

customElements.define('cloudblog-admin', CloudBlogAdmin);