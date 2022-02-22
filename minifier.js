const minify = require('@node-minify/core');
const terser = require('@node-minify/terser');
const cssnano = require('@node-minify/cssnano');

module.exports = (DEV_MODE) => {
	return Promise.all([
		minify({
			compressor: DEV_MODE ? generateFakeMinifier() : terser,
			input: [
				'./src/utils.js',
				'./src/main.js'
			],
			output: './public/js/main.js',
			options: {
				compress: !DEV_MODE
			}
		})
	]);
};

function generateFakeMinifier() {
	const _terser = require("terser");
	const _utils = require("@node-minify/utils");

	const fake = async ({
		settings,
		content,
		callback,
		index
	}) => {
		try {
			_utils.utils.writeFile({
				file: settings.output,
				content,
				index
			});

			if (callback) {
				return callback(null, content);
			}

			return content;
		} catch (error) {
			return callback(error);
		}
	};

	return fake;
}