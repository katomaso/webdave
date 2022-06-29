import {LitElement, html, property, query, eventOptions} from "lit-element"

function extension(s) {

}

function nowStr() {
    var pad = (i) => (i < 10) ? "0" + i : "" + i;
    var now = new Date()
    return pad(now.getFullYear()) + "-" + pad(1 + now.getMonth()) + "-" + pad(now.getDate());
}

class CloudblogEditor extends LitElement {

    definitions = {
        post: [
            {"name": "title", "default": "", "type": "text", "label": "Title"},
            {"name": "category", "default": "", "type": "text", "label": "Category", },
            {"name": "description", "default": "", "type": "textarea", "label": "Description"},
            {"name": "status", "default": "draft", "type": "select", "label": "Status", "options": ["draft", "published"]},
            {"name": "created", "default": nowStr, "type": "date", "label": "Created", "value": nowStr},
            {"name": "updated", "default": nowStr, "type": "date", "label": "Updated"},
        ],
        link: [
            {"name": "title", "type": "text", "label": "Title"},
            {"name": "link", "default": "draft", "type": "text", "label": "Status"},
            {"name": "created", "default": nowStr, "type": "date", "label": "Created", "value": nowStr},
            {"name": "updated", "default": nowStr, "type": "date", "label": "Updated"},
        ],
        book: [
            {"name": "title", "type": "text", "label": "Title"},
            {"name": "author", "type": "text", "label": "Author"},
            {"name": "rating", "type": "number", "label": "Rating", "max": 10, "min": 0, "step": 1},
            {"name": "created", "default": nowStr, "type": "date", "label": "Created", "value": nowStr},
            {"name": "updated", "default": nowStr, "type": "date", "label": "Updated"},
        ],
        note: [
            {"name": "title", "type": "text", "label": "Title"},
            {"name": "created", "default": nowStr, "type": "date", "label": "Created", "value": nowStr},
            {"name": "updated", "default": nowStr, "type": "date", "label": "Updated"},
        ]
    }

    constructor() {
		this.filename = null;
        this.data = {}
		this.dirty = false;
		document.addEventListener("file:open", this.open.bind(this));
	}

    @property({type: String}) docType;
    @query("text-editor") editor;

    connectedCallback() {
        super.connectedCallback()
        addEventListener('file:save', this.passFileSave());
    }
    
    @eventOptions({})
    open(event) {
		const self = this;
		let {filename, content} = event.detail;
		if(this.dirty && confirm("You have unsaved changes. Save now?")) {
			this.save();
		}
		this.filename = filename;
		if(this.editor === null) {
			this.editor = CodeMirror.fromTextArea(this.textarea, {
				"readOnly": false,
				"dragDrop": false,
				"indentUnit": 4,
				"indentWithTabs": true,
				"lineNumbers": true,
				"matchBrackets": true});
			this.editor.setSize(null, "95vh");
			this.editor.on("change", () => this.dirty=true);
		}
		if(filename.endsWith(".js")) this.editor.setOption("mode", "javascript");
		else if(filename.endsWith(".html")) this.editor.setOption("mode", "htmlmixed");
		else this.editor.setOption("mode", "text");
		this.editor.getDoc().setValue(content);
		this.editor.refresh();
		this.editor.focus();
		this.dirty = false;
	}

    render() {
        return html`
        <form>
            ${this.metadata[this.backend].map((input) => this.renderMetadata(input))}
            <text-editor filetype="${extension(this.filename)}"></text-editor>
        </form>
        `
    }

    renderMetadata(def) {
        const label=`<label for="${def.name}-id">${def.label}</label>`;
        const value = data[def.name] == undefined ? evaluate(def.default);
        let evaluate = (v) => typeof(v) == 'function' ? v() : v
        let input = "";
        
        // if there is valu in definition - always use that
        if (def.value != undefined) {
            value = evaluate(def.value)
        }

        if(def["type"] == "textarea") {
            input = `<textarea name="${def.name}"></textarea>`
        } else if(def["type"] == "select") {
            options = ""
            for (let option of def.options) {
                selected = option == value ? " selected " : ""
                options += `<option name="${option}"${selected}>${option}</option>`
            }
            input = `<select name="${def.name}">${options}</select>`
        } else if(def["type"] == "number") {
            input = `<input type="${def.type}" name="${def.name}" value=${value}" min="${def.min}" max="${def.max}" step="${def.step}"/>`;
        } else {
            input = `<input type="${def.type}" name="${def.name}" value=${value}"/>`;
        }
        return html`${label}${input}`
    }

    // Fire an cancelable bubbling event that can be caught and reacted on in wrapping elements
	fire(name, data) {
		let customEvent = new CustomEvent(name, {
			detail: data,
			bubbles: true, // to continue to bubble upwards until somebody catches it
			composed: true, // to be able to cross shadow DOM boundary
			cancelable: true
		});
		return this.textarea.dispatchEvent(customEvent);
	}
}
