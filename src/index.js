import {LitElement, html} from "lit-element";
import './navigator.js';
import './editor.js';

class WebDavE extends LitElement {
	/**
	* open is a function to share functionality between children
	*
	* open triggers editor to load content and call back `save` on submit
	*/
	open(filename, content) {
		this.editor.open(filename, content);
	}

	/**
	* save is a function to share functionality between children
	*
	* save triggers the navigator to save given content under given name
	*/
	save(filename, content) {
		this.navigator.save(filename, content);
	}

	get editor() {
		return this.shadowRoot.querySelector("webdav-editor");
	}
	get navigator() {
		return this.shadowRoot.querySelector("webdav-navigator");
	}

	render() {
		return html`
		<style>
			div {display: flex}
			webdav-navigator {flex-grow: 1}
			webdav-editor {flex-grow: 4}
		</style>

		<div>
			<webdav-navigator .open=${this.open.bind(this)}></webdav-navigator>
			<webdav-editor .save=${this.save.bind(this)}></webdav-editor>
		</div>`;
	}
}

customElements.define("webdav-e", WebDavE);
