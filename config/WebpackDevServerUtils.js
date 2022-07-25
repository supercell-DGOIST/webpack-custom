'use strict';

const detect = require('detect-port-alt');
const isRoot = require('is-root');
const chalk = require('chalk');
const url = require('url');
const address = require('address');
const formatWebpackMessages = require('./formatWebpackMessages');

const printInstructions = (appName, urls) => {
	console.log();
	console.log(`You can now view ${chalk.bold(appName)} in the browser.`);
	console.log();

	if (urls.lanUrlForTerminal) {
		console.log(`  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`);
		console.log(`  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`);
	} else {
		console.log(`  ${urls.localUrlForTerminal}`);
	}

	console.log();
	console.log('Note that the development build is not optimized.');
	console.log('To create a production build, use npm run build.');
	console.log();
};

const prepareUrls = (protocol, host, port, pathname = '/') => {
	const formatUrl = (hostname) =>
		url.format({
			protocol,
			hostname,
			port,
			pathname,
		});
	const prettyPrintUrl = (hostname) =>
		url.format({
			protocol,
			hostname,
			port: chalk.bold(port),
			pathname,
		});

	const isUnspecifiedHost = host === '0.0.0.0' || host === '::';
	let prettyHost, lanUrlForConfig, lanUrlForTerminal;
	if (isUnspecifiedHost) {
		prettyHost = 'localhost';

		try {
			// 返回IPv4地址
			lanUrlForConfig = address.ip();
			if (lanUrlForConfig) {
				// 检查地址是否为私有
				if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(lanUrlForConfig)) {
					// 地址为私有格式化后使用
					lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig);
				} else {
					// 地址非私有不使用
					lanUrlForConfig = undefined;
				}
			}
		} catch (e) {}
	} else {
		prettyHost = host;
	}
	const localUrlForTerminal = prettyPrintUrl(prettyHost);
	const localUrlForBrowser = formatUrl(prettyHost);
	return {
		lanUrlForConfig,
		lanUrlForTerminal,
		localUrlForTerminal,
		localUrlForBrowser,
	};
};

const createCompiler = ({ appName, config, urls, webpack }) => {
	// 自定义消息
	let compiler;
	try {
		compiler = webpack(config);
	} catch (err) {
		console.log(chalk.red('Failed to compile.'));
		console.log();
		console.log(err.message || err);
		console.log();
		process.exit(1);
	}

	// 更改文件触发
	compiler.hooks.invalid.tap('invalid', () => {
		console.log('Compiling...');
	});

	let isFirstCompile = true;

	// 重新编译结束触发done
	compiler.hooks.done.tap('done', async (stats) => {
		//关闭WebpackDevServer的默认输出，显示错误和告警信息，增强可读性。
		const statsData = stats.toJson({
			all: false,
			warnings: true,
			errors: true,
		});

		const messages = formatWebpackMessages(statsData);
		const isSuccessful = !messages.errors.length && !messages.warnings.length;

		if (isSuccessful && isFirstCompile) {
			printInstructions(appName, urls);
		}
		isFirstCompile = false;

		// 有错误信息，只显示错误信息。
		if (messages.errors.length) {
			// 只显示第一个错误信息。
			if (messages.errors.length > 1) {
				messages.errors.length = 1;
			}
			console.log(chalk.red('Failed to compile.\n'));
			console.log(messages.errors.join('\n\n'));
			return;
		}

		// 没有错误信息，则显示告警。
		if (messages.warnings.length) {
			console.log(chalk.yellow('Compiled with warnings.\n'));
			console.log(messages.warnings.join('\n\n'));

			console.log(
				'\nSearch for the ' +
					chalk.underline(chalk.yellow('keywords')) +
					' to learn more about each warning.'
			);
		}
	});

	return compiler;
};

const choosePort = (host, defaultPort) => {
	return detect(defaultPort, host).then((port) => {
		return new Promise(
			(resolve) => {
				if (port === defaultPort) {
					return resolve(port);
				}

				const message =
					process.platform !== 'win32' && defaultPort && !isRoot()
						? `Admin permissions are required to run a server on a port below 1024.`
						: `Something is already running on port ${defaultPort}.`;

				console.log(chalk.red(message));
				resolve(null);
			},
			(err) => {
				throw new Error(
					chalk.red(`Could not find an open port at ${chalk.bold(host)}.`) +
						'\n' +
						('Network error message: ' + err.message || err) +
						'\n'
				);
			}
		);
	});
};

const resolveLoopback = (proxy) => {
	const o = url.parse(proxy);
	o.host = undefined;
	if (o.hostname !== 'localhost') {
		return proxy;
	}
	// 有些环境不支持ipv6改为ipv4。
	try {
		if (!address.ip()) {
			o.hostname = '127.0.0.1';
		}
	} catch (_ignored) {
		o.hostname = '127.0.0.1';
	}
	return url.format(o);
};

// 在控制台记录自定义的错误消息
const onProxyError = (proxy) => {
	return (err, req, res) => {
		const host = req.headers && req.headers.host;
		console.log(
			chalk.red('Proxy error:') +
				' Could not proxy request ' +
				chalk.cyan(req.url) +
				' from ' +
				chalk.cyan(host) +
				' to ' +
				chalk.cyan(proxy) +
				'.'
		);
		console.log(
			'See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (' +
				chalk.cyan(err.code) +
				').'
		);
		console.log();

		// 立刻向客户端发送正确的错误响应
		if (res.writeHead && !res.headersSent) {
			res.writeHead(500);
		}
		res.end(
			'Proxy error: Could not proxy request ' +
				req.url +
				' from ' +
				host +
				' to ' +
				proxy +
				' (' +
				err.code +
				').'
		);
	};
};

const prepareProxy = (proxy, appPublicFolder, servedPathname) => {
	// proxy可以为特定请求指定服务器。
	if (!proxy) {
		return undefined;
	}

	if (proxy !== 'string') {
		console.log(chalk.red('When specified, "proxy" in package.json must be a string.'));
		console.log(chalk.red('Instead, the type of "proxy" was "' + typeof proxy + '".'));
		console.log(chalk.red('Either remove "proxy" from package.json, or make it a string.'));
		process.exit(1);
	}

	// 指定了代理
	const sockPath = process.env.WDS_SOCKET_PATH || '/ws';
	const isDefaultSockHost = !process.env.WDS_SOCKET_HOST;

	const mayProxy = (pathname) => {
		const maybePublicPath = path.resolve(
			appPublicFolder,
			pathname.replace(new RegExp('^' + servedPathname), '')
		);
		const isPublicFileRequest = fs.existsSync(maybePublicPath);
		const isWdsEndpointRequest = isDefaultSockHost && pathname.startsWith(sockPath);
		return !(isPublicFileRequest || isWdsEndpointRequest);
	};

	if (!/^http(s)?:\/\//.test(proxy)) {
		console.log(
			chalk.red(
				'When "proxy" is specified in package.json it must start with either http:// or https://'
			)
		);
		process.exit(1);
	}

	let target;
	if (process.platform === 'win32') {
		target = resolveLoopback(proxy);
	} else {
		target = proxy;
	}

	return [
		{
			target,
			logLevel: 'silent',
			context(pathname, req) {
				return (
					req.method !== 'GET' ||
					(mayProxy(pathname) &&
						req.headers.accept &&
						req.headers.accept.indexOf('text/html') === -1)
				);
			},
			onProxyReq(proxyReq) {
				// 改为同源
				if (proxyReq.getHeader('origin')) {
					proxyReq.setHeader('origin', target);
				}
			},
			onError: onProxyError(target),
			secure: false,
			changeOrigin: true,
			ws: true,
			xfwd: true,
		},
	];
};

module.exports = {
	choosePort,
	prepareUrls,
	createCompiler,
	prepareProxy,
};
