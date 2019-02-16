import {LitElement, html} from "lit-element";
import EasyMDE from "easymde";
import CodeMirror from 'codemirror';

import "../node_modules/codemirror/mode/javascript/javascript.js";
import "../node_modules/codemirror/mode/htmlmixed/htmlmixed.js";

class Editor extends LitElement {

	constructor() {
		super();
		this.filename = null;
		this.dirty = false;
		this.mdEditor = null;
		this.codeEditor = null;
		this.editor = null;
		this.styles = [];
	}

	static get properties() {
		return {
			"save": {type: Function, "reflect": false},
			"styles": {type: Array, "attribute": false}
		}
	}
	
	get textarea() {
		return this.shadowRoot.querySelector('textarea');
	}

	async open(filename, content) {
		this.close();  // close any previous file
		this.filename = filename;
		console.log("Requested to open " + filename);
		if(filename.endsWith(".md")) {
 			this.styles = ["font-awesome.min.css", "codemirror.css", "easymde.min.css"]
			await this.updateComplete; // wait for rendering
			this.mdEditor = new EasyMDE({
				"autofocus": true,
				"lineWrapping": false,
				"element": this.shadowRoot.querySelector("textarea"),
				"autosave": {"enabled": true, "uniqueId": filename},
				"lineNumbers": true});
			this.mdEditor.value(content);
			this.editor = this.mdEditor;
		} else {
			this.styles = ["font-awesome.min.css", "codemirror.css"]
			await this.updateComplete; // wait for rendering
			this.codeEditor = CodeMirror.fromTextArea(this.textarea, {
				"readOnly": false,
				"dragDrop": false,
  				"indentUnit": 4,
 				"indentWithTabs": true,
				"lineNumbers": true,
				"mode": filename.endsWith(".js")?"javascript":
					filename.endsWith(".html")?"htmlmixed":
					"text"});
            this.codeEditor.setSize(null, "95vh");
			this.codeEditor.getDoc().setValue(content);
			this.codeEditor.refresh();
			this.editor = this.codeEditor;
		}
	}

	submit(event) {
		console.log("Saving file " + this.filename);
		if(event !== undefined) {
			event.preventDefault();
			event.stopPropagation();
		}
		if(this.mdEditor != null) {
			this.save(this.filename, this.mdEditor.value());
		}
		if(this.codeEditor != null) {
			this.save(this.filename, this.codeEditor.getValue());
		}
		this.dirty = false;
	}

	close(event) {
		if(event !== undefined) {
			event.preventDefault();
			event.stopPropagation();
		}
		if(this.mdEditor != null) {
			this.mdEditor.toTextArea();
			this.mdEditor = null;
		}
		if(this.codeEditor != null) {
			this.codeEditor.toTextArea();
			this.codeEditor = null;
		}
		this.textarea.value = "";
		this.editor = null;
		this.styles = [];
	}

	render() {
		return html`
			${this.styles.map(style => html`<link rel="stylesheet" href="css/${style}">`)}
			<style>
				form > textarea {width: 100%; height: 95vh}
				form > button { display: inline-block; font-size: 15pt; width: 70%; margin: 5pt}
				form > button + button {width: 20%} 
			</style>
			<form>
			<textarea></textarea>
			<button @click=${this.submit}>Save content</button>
			<button @click=${this.close}>Discard</button>
			</form>`;
	}
}

customElements.define("webdav-editor", Editor);
