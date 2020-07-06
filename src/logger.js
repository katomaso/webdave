"use strict";

import {LitElement, html, css} from "lit-element";


class Logger extends LitElement {

	constructor() {
		super();
		this.timeout = 5000;
		this.messages = [];
		document.addEventListener("log:error", e => this.pushMessage("error", e.detail.message));
		document.addEventListener("log:info", e => this.pushMessage("info", e.detail.message));
	}

	static get properties() {
		return {
			messages: {type: Array, attribute: false},
			timeout: {type: Number}
		}
	}

	pushMessage(type, text) {
		this.messages.push({type, text});
		window.setTimeout(() => this.popMessage(), this.timeout);
		return this.requestUpdate();
	}

	popMessage() {
		this.messages.shift();
		return this.requestUpdate();
	}

	static get styles() {
		return css`
			ul {
				min-width: 15em;
			}
			li {
				display: block;
				list-style: none;
				margin-bottom: 1em;
				padding: .5em;
				border-radius: 5px;
				border: 1px solid black;
				font-size: 10pt;
			}
			li.info {
				background-color: green;
				color: white;
			}
			li.error {
				background-color: red;
				color: white;
			}
		`;
	}

	render() {
		return html`<ul>${this.messages.map(m => html`<li class="${m.type}">${m.text}</li>`)}</ul>`;
	}

}

customElements.define('vtcn-logger', Logger);
