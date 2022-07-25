'use strict';

const escapeStringRegexp = require('escape-string-regexp');

class InterpolateHtmlPlugin {
	constructor(htmlWebpackPlugin, replacements) {
		this.htmlWebpackPlugin = htmlWebpackPlugin;
		this.replacements = replacements;
	}

	apply(compiler) {
		compiler.hooks.compilation.tap('InterpolateHtmlPlugin', (compilation) => {
			this.htmlWebpackPlugin
				.getHooks(compilation)
				.afterTemplateExecution.tap('InterpolateHtmlPlugin', (data) => {
					// 用指定的字符串替换运行的html
					Object.keys(this.replacements).forEach((key) => {
						const value = this.replacements[key];
						data.html = data.html.replace(
							new RegExp('%' + escapeStringRegexp(key) + '%', 'g'),
							value
						);
					});
				});
		});
	}
}

module.exports = InterpolateHtmlPlugin;
