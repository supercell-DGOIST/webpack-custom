'use strict';

const chalk = require('chalk');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const open = require('open');

const OSX_CHROME = 'google chrome';

const Actions = Object.freeze({
	NONE: 0,
	BROWSER: 1,
	SCRIPT: 2,
});

// 使用当前操作系统环境变量
const getBrowserEnv = () => {
	const value = process.env.BROWSER;
	const args = process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(' ') : [];
	let action;
	if (!value) {
		// 默认
		action = Actions.BROWSER;
	} else if (value.toLowerCase().endsWith('.js')) {
		action = Actions.SCRIPT;
	} else if (value.toLowerCase() === 'none') {
		action = Actions.NONE;
	} else {
		action = Actions.BROWSER;
	}
	return { action, value, args };
};

const executeNodeScript = (scriptPath, url) => {
	const extraArgs = process.argv.slice(2);
	const child = spawn(process.execPath, [scriptPath, ...extraArgs, url], {
		stdio: 'inherit',
	});
	child.on('close', (code) => {
		if (code !== 0) {
			console.log();
			console.log(chalk.red('The script specified as BROWSER environment variable failed.'));
			console.log(chalk.cyan(scriptPath) + ' exited with code ' + code + '.');
			console.log();
			return;
		}
	});
	return true;
};

const startBrowserProcess = (browser, url, args) => {
	const shouldTryOpenChromiumWithAppleScript =
		process.platform === 'darwin' && (typeof browser !== 'string' || browser === OSX_CHROME);

	// 在苹果系统中如果未指定浏览器，可以尝试打开Chrome
	if (shouldTryOpenChromiumWithAppleScript) {
		// 打开使用列表中的第一个浏览器
		const supportedChromiumBrowsers = [
			'Google Chrome Canary',
			'Google Chrome',
			'Microsoft Edge',
			'Brave Browser',
			'Vivaldi',
			'Chromium',
		];

		for (let chromiumBrowser of supportedChromiumBrowsers) {
			try {
				execSync('ps cax | grep "' + chromiumBrowser + '"');
				execSync(
					'osascript openChrome.applescript "' + encodeURI(url) + '" "' + chromiumBrowser + '"',
					{
						cwd: __dirname,
						stdio: 'ignore',
					}
				);
				return true;
			} catch (err) {}
		}
	}

	// 检查是否在OS上运行及浏览器设置为打开
	if (process.platform === 'darwin' && browser === 'open') {
		browser = undefined;
	}

	// 如果有参数将其转换成数组传递
	if (typeof browser === 'string' && args.length > 0) {
		browser = [browser].concat(args);
	}

	// 回退到打开，始终打开新的选项卡
	try {
		var options = { app: browser, wait: false, url: true };
		open(url, options).catch(() => {}); // 防止“unmandRejection”错误。
		return true;
	} catch (err) {
		return false;
	}
};

const openBrowser = (url) => {
	const { action, value, args } = getBrowserEnv();
	
	switch (action) {
		case Actions.NONE:
			// 没有浏览器不打开
			return false;
		case Actions.SCRIPT:
			return executeNodeScript(value, url);
		case Actions.BROWSER:
			return startBrowserProcess(value, url, args);
		default:
			throw new Error('Not implemented.');
	}
};

module.exports = openBrowser;
