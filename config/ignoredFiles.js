'use strict';

const path = require('path');
const escape = require('escape-string-regexp');

const ignoredFiles = (appSrc) => {
	return new RegExp(
		`^(?!${escape(path.normalize(appSrc + '/').replace(/[\\]+/g, '/'))}).+/node_modules/`,
		'g'
	);
};

module.exports = ignoredFiles;
