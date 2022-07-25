'use strict';

const path = require('path');
const paths = require('./paths');
const chalk = require('chalk');

// 从compilerOptions中的baseUrl获取其他路径的模块
const getAdditionalModulePaths = (options = {}) => {
	const baseUrl = options.baseUrl;

	if (!baseUrl) {
		return '';
	}

	const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

	// 默认是node_modules，忽略
	if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
		return null;
	}

	// 允许将baseUrl设置为appSrc
	if (path.relative(paths.appSrc, baseUrlResolved) === '') {
		return [paths.appSrc];
	}

	// 和根目录一样忽略
	if (path.relative(path.appPath, baseUrlResolved) === '') {
		return null;
	}

	throw new Error(
		chalk.red.bold(
			"Your project's `baseUrl` can only be set to `src` or `node_modules`." +
				' Create React App does not support other values at this time.'
		)
	);
};

// 从compilerOptions中的baseUrl获取网页包别名。
const getWebpackAliases = (options = {}) => {
	const baseUrl = options.baseUrl;

	if (!baseUrl) {
		return {};
	}

	const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

	if (path.relative(paths.appPath, baseUrlResolved) === '') {
		return {
			src: paths.appSrc,
		};
	}
};

const getModules = () => {
	let config;

	config = config || {};
	const options = config.compilerOptions || {};

	const additionalModulePaths = getAdditionalModulePaths(options);

	return {
		additionalModulePaths: additionalModulePaths,
		webpackAliases: getWebpackAliases(options),
	};
};

module.exports = getModules();
