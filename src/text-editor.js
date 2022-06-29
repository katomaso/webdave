import {LitElement, html, property, query} from "lit-element";
// import EasyMDE from "easymde";
import CodeMirror from 'codemirror';

import "../node_modules/codemirror/mode/javascript/javascript.js";
import "../node_modules/codemirror/mode/htmlmixed/htmlmixed.js";
import "../node_modules/codemirror/addon/edit/matchbrackets.js";


class TextEditor extends LitElement {

	@property({type: String}) filetype;
	@property({type: String}) content;
	@query("textarea", cached=true) textarea;

	save(event) {
		this.swallow(event);
		console.log("Saving file " + this.filename);
		this.fire("file:save", {
			filename: this.filename,
			content: this.editor.getValue()
		});
		this.dirty = false;
	}

	close(event) {
		this.swallow(event);
		if(this.editor === null) return;
		if(this.dirty && confirm("You have unsaved changes. Save now?")) this.save();
		this.editor.toTextArea();
		this.textarea.value = "";
		this.editor = null;
		this.filename = "";
		this.dirty = false;
		return this.requestUpdate();
	}

	render() {
		return html`
			<link rel="stylesheet" href="css/font-awesome.min.css">
			<link rel="stylesheet" href="css/codemirror.css">
			<style>
				form {
					height: 100%;
					width: 100%;
					display: flex;
					align-items: stretch;
					flex-direction: column;
					justify-content: flex-start;
				}
				textarea {flex: 1}
				#buttons {flex: 0 0 auto; display: flex; align-items: stretch;}
				#buttons button{font-size: 13pt; padding: 0.3em 1em;}
				#buttons > button {flex: 1; margin-right: 1em;}
				#buttons > button + button {flex: 0 0 auto; margin-right: 0; margin-left: 1em;} 
			</style>
			<form>
			<textarea></textarea>
			<div id="buttons">
			${this.dirty?
				html`<button @click=${this.save}>Save ${this.filename}</button>`:
				html`<button disabled="disabled">Saved ${this.filename}</button>`
			}
			<button @click=${this.close}>Close</button>
			</div>
			</form>`;
	}

	swallow(event) {
		if(event !== undefined) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
}

customElements.define("text-editor", TextEditor);
