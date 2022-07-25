'use strict';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// 未处理的承诺被拒绝时，抛出错误，并结束进程。
process.on('unhandledRejection', (err) => {
	throw err;
});

// 确保读取了环境变量
require('../config/env');

const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const paths = require('../config/paths');
const checkRequiredFiles = require('../config/checkRequiredFiles');
const {
	choosePort,
	prepareUrls,
	prepareProxy,
	createCompiler,
} = require('../config/WebpackDevServerUtils');
const openBrowser = require('../config/openBrowser');
const createDevServerConfig = require('../config/webpackDevServer.config');

// 缺少文件终止进程
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
	process.exit(1);
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
	console.log(
		chalk.cyan(
			`Attempting to bind to HOST environment variable: ${chalk.yellow(
				chalk.bold(process.env.HOST)
			)}`
		)
	);
	console.log(`If this was unintentional, check that you haven't mistakenly set it in your shell.`);
	console.log(`Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`);
	console.log();
}

const configFactory = require('../config/webpack.config');
const { checkBrowsers } = require('../config/browsersHelper');

// 设置默认浏览器
checkBrowsers(paths.appPath)
	.then(() => {
		// 根据情况选择设置或默认端口
		return choosePort(HOST, DEFAULT_PORT);
	})
	.then((port) => {
		if (port === null) return;

		const config = configFactory('development');
		const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
		const appName = require(paths.appPackageJson).name;

		const urls = prepareUrls(protocol, HOST, port, paths.publicUrlOrPath.slice(0, -1));

		// 自定义编译器信息。
		const compiler = createCompiler({
			appName,
			config,
			urls,
			webpack,
		});

		// 加载代理配置
		const proxySetting = require(paths.appPackageJson).proxy;
		const proxyConfig = prepareProxy(proxySetting, paths.appPublic, paths.publicUrlOrPath);

		const serverConfig = {
			...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
			host: HOST,
			port,
		};

		const devServer = new WebpackDevServer(serverConfig, compiler);

		devServer.startCallback(() => {
			console.log(chalk.cyan('Starting the development server...\n'));
			openBrowser(urls.localUrlForBrowser);
		});

		['SIGINT', 'SIGTERM'].forEach(function (sig) {
			process.on(sig, function () {
				devServer.close();
				process.exit();
			});
		});

		if (process.env.CI !== 'true') {
			// 标准输入结束后退出
			process.stdin.on('end', function () {
				devServer.close();
				process.exit();
			});
		}
	})
	.catch((err) => {
		if (err && err.message) {
			console.log(err.message);
		}
		process.exit(1);
	});
