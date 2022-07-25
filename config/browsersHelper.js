'use strict';

const browserslist = require('browserslist');
const fs = require('fs');
const os = require('os');
const pkgUp = require('pkg-up');
const chalk = require('chalk');

const defaultBrowsers = {
	production: ['>0.2%', 'not dead', 'not op_mini all'],
	development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
};

function checkBrowsers(dir, retry = true) {
	const current = browserslist.loadConfig({ path: dir });

	if (current != null) {
		return Promise.resolve(current);
	}

	if (!retry) {
		Promise.reject(
			new Error(
				chalk.red(
					`you must specify targeted browsers. ${os.EOL} Please add a ${chalk.underline(
						'browserslist'
					)} key to you ${chalk.bold('package.json')}.`
				)
			)
		);
	}

	return pkgUp
		.cwd(dir)
		.then((filePath) => {
			if (filePath === null) {
				return Promise.reject();
			}
			const pkgFile = fs.readFileSync(filePath);
			console.log(pkgFile);
			const pkg = JSON.parse(pkgFile);
			pkg['browserslist'] = defaultBrowsers;
			fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2), os.EOL);

			browserslist.clearCaches();
			console.log();
			console.log(
				`${chalk.green('Set target browsers:')} ${chalk.cyan(defaultBrowsers.join(','))}`
			);
			console.log();
		})
		.catch((err) => {})
		.then(() => checkBrowsers(dir, false));
}

module.exports = { defaultBrowsers, checkBrowsers };
