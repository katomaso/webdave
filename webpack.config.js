const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	mode: "development",
	entry: {
		"webdav-navigator": "./src/navigator.js",
		"webdav-editor": "./src/editor.js",
		"vtcn-logger": "./src/logger.js",
		"cloudblog-admin": "./src/cloudblog-admin.js"
	},
	plugins: [
		new CopyPlugin([{from: "static"}])
	],
	output: {
		path: path.resolve(__dirname, "dist")
	}
}
