'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

//确保evn.js之后的路径会被读取。
delete require.cache[require.resolve('./paths.js')];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
	throw new Error('The NODE_ENV environment variable is required but was not specified.');
}

// xxx.env.local
const dotenvFiles = [
	`${paths.dotenv}.${NODE_ENV}.local`,
	NODE_ENV !== 'test' && `${paths.dotenv}.local`,
	`${paths.dotenv}.${NODE_ENV}`,
	paths.dotenv,
].filter(Boolean);

dotenvFiles.forEach((dotenvFile) => {
	if (fs.existsSync(dotenvFile)) {
		require('dotenv-expand')(
			require('dotenv').config({
				path: dotenvFile,
			})
		);
	}
});

const appDirectory = fs.realpathSync(process.cwd());
process.env.NODE_PATH = (process.env.NODE_PATH || '')
	.split(path.delimiter)
	.filter((folder) => folder && !path.isAbsolute(folder))
	.map((folder) => path.resolve(appDirectory, folder))
	.join(path.delimiter);

const APP = /^APP_/i;

const getClientEnvironment = (publicUrl) => {
	const raw = Object.keys(process.env)
		.filter((key) => APP.test(key))
		.reduce(
			(env, key) => {
				env[key] = process.env[key];
				return env;
			},
			{
				// 运行环境
				NODE_ENV: process.env.NODE_ENV || 'development',
				// 静态路径
				PUBLIC_URL: publicUrl,
				// 设置主机，路径，端口
				WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
				WDS_SOCKET_PATH: process.env.WDS_SOCKET_PATH,
				WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT,
			}
		);
	// 字符化后输入到 webpack DefinePlugin
	const stringified = {
		'process.env': Object.keys(raw).reduce((env, key) => {
			env[key] = JSON.stringify(raw[key]);
			return env;
		}, {}),
	};

	return { raw, stringified };
};

module.exports = getClientEnvironment;
