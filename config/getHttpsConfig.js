'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');
const paths = require('./paths');

// 校验证书和秘钥是否有效，无效抛出错误
const validateKeyAndCerts = ({ cert, key, keyFile, crtFile }) => {
	let encrypted;
	try {
		// 证书无效，抛出错误
		encrypted = crypto.publicEncrypt(cert, Buffer.from('test'));
	} catch (err) {
		throw new Error(`The certificate "${chalk.yellow(crtFile)}" is invalid.\n${err.message}`);
	}

	try {
		// 秘钥无效，抛出错误
		crypto.privateDecrypt(key, encrypted);
	} catch (err) {
		throw new Error(`The certificate key "${chalk.yellow(keyFile)}" is invalid.\n${err.message}`);
	}
};

// 读取文件并在文件不存在时抛出错误
const readEnvFile = (file, type) => {
	if (!fs.existsSync(file)) {
		throw new Error(
			`You specified ${chalk.cyan(type)} in your env, but the file "${chalk.yellow(
				file
			)}" can't be found.`
		);
	}
	return fs.readFileSync(file);
};

// 获取https配置，可在env中设置证书文件
const getHttpsConfig = () => {
	const { SSL_CRT_FILE, SSL_KEY_FILE, HTTPS } = process.env;
	const isHttps = HTTPS === 'true';

	if (isHttps && SSL_CRT_FILE && SSL_KEY_FILE) {
		const crtFile = path.resolve(paths.appPath, SSL_CRT_FILE);
		const keyFile = path.resolve(paths.appPath, SSL_KEY_FILE);
		const config = {
			cert: readEnvFile(crtFile, 'SSL_CRT_FILE'),
			key: readEnvFile(keyFile, 'SSL_KEY_FILE'),
		};

		validateKeyAndCerts({ ...config, keyFile, crtFile });
		return config;
	}

	return isHttps;
};

module.exports = getHttpsConfig;
