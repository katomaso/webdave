const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "development",
	entry: {
		"webdav-navigator": "./src/webdav-navigator.js",
		"text-editor": "./src/text-editor.js",
		"vtcn-logger": "./src/logger.js",
		"cloudblog-editor": "./src/cloudblog-editor.js",
		"cloudblog-publisher": "./src/cloudblog-publisher.js"
	},
	plugins: [
		new CopyPlugin([{from: "static"}])
	],
	output: {
		path: path.resolve(__dirname, "dist")
	}
}
