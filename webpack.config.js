const path = require('path');

module.exports = {
	mode: "development",
	entry: {
		navigator: "./src/navigator.js",
		editor: "./src/editor.js",
		main: "./src/index.js"
	},
	output: {
		path: path.resolve(__dirname, "build")
	}
}
