import {LitElement, html} from "lit-element";
// import EasyMDE from "easymde";
import CodeMirror from 'codemirror';

import "../node_modules/codemirror/mode/javascript/javascript.js";
import "../node_modules/codemirror/mode/htmlmixed/htmlmixed.js";
import "../node_modules/codemirror/addon/edit/matchbrackets.js";


class Editor extends LitElement {

	constructor() {
		super();
		this.filename = null;
		this.dirty = false;
		this.editor = null;
		document.addEventListener("file:open", this.open.bind(this));
	}

	get textarea() {
		return this.shadowRoot.querySelector('textarea');
	}

	open(event) {
		if(this.isDirty && confirm("You have unsaved changes. Save now?")) this.save();
		this.filename = event.detail.filename;
		console.log("Requested to open " + filename);
		this.styles = ["font-awesome.min.css", "codemirror.css"]
		await this.updateComplete; // wait for rendering
		this.editor = CodeMirror.fromTextArea(this.textarea, {
			"readOnly": false,
			"dragDrop": false,
			"indentUnit": 4,
			"indentWithTabs": true,
			"lineNumbers": true,
			"matchBrackets": true,
			"mode": filename.endsWith(".js")?"javascript":
				filename.endsWith(".html")?"htmlmixed":
				"text"});
		this.editor.setSize(null, "95vh");
		this.editor.getDoc().setValue(content);
		this.editor.refresh();
	}

	save(event) {
		this.swallow(event);
		console.log("Saving file " + this.filename);
		let customEvent = new CustomEvent("file:save", { detail: {
			filename: this.filename,
			content: this.editor.getValue()
		}});
		document.dispatchEvent(customEvent);
		this.dirty = false;
	}

	close(event) {
		this.swallow(event);
		if(this.isDirty && confirm("You have unsaved changes. Save now?")) this.save();
		this.editor.toTextArea();
		this.textarea.value = "";
		this.styles = [];
	}

	render() {
		return html`
			<link rel="stylesheet" href="css/font-awesome.min.css">
			<link rel="stylesheet" href="css/codemirror.css">
			<style>
				form > textarea {width: 100%; height: 95vh}
				form > button { display: inline-block; font-size: 15pt; width: 70%; margin: 5pt}
				form > button + button {width: 20%}
			</style>
			<form>
			<textarea></textarea>
			<button @click=${this.save}>Save content</button>
			<button @click=${this.close}>Discard</button>
			</form>`;
	}

	swallow(event) {
		if(event !== undefined) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
}

customElements.define("webdav-editor", Editor);
