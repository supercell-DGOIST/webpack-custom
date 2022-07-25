'use strict';

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//未处理的承诺被拒绝时，抛出错误，并结束进程。
process.on('unhandledRejection', (err) => {
	throw err;
});

// 确保读取了环境变量
require('../config/env');

const fs = require('fs-extra');
const webpack = require('webpack');
const chalk = require('chalk');
const configFactory = require('../config/webpack.config');
const checkRequiredFiles = require('../config/checkRequiredFiles');
const {
	measureFileSizesBeforeBuild,
	printFileSizesAfterBuild,
} = require('../config/FileSizeReporter');
const formatWebpackMessages = require('../config/formatWebpackMessages');
const paths = require('../config/paths');
const printBuildError = require('../config/printBuildError');

// 超过以下大小的文件需要警告。
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// 缺少文件终止进程
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
	process.exit(1);
}

// 生成配置
const config = configFactory('production');
const { checkBrowsers } = require('../config/browsersHelper');

const copyPublicFolder = () => {
	fs.copySync(paths.appPublic, paths.appBuild, {
		dereference: true,
		filter: (file) => file !== paths.appHtml,
	});
};

// 创建生产构建并打印部署说明。
const build = (previousFileSizes) => {
	console.log('Creating an optimized production build...');
	const compiler = webpack(config);
	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			let messages;
			if (err) {
				if (err.message) {
					return reject(err.message);
				}

				let errMessage = err.message;

				// 添加进程错误的其他信息
				if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
					errMessage += '\nCompileError: Begins at CSS selector ' + err['postcssNode'].selector;
				}

				messages = formatWebpackMessages({
					errors: [errMessage],
					warnings: [],
				});
			} else {
				messages = formatWebpackMessages(
					stats.toJson({ all: false, warnings: true, errors: true })
				);
			}

			if (messages.errors.length) {
				// 只保留第一个错误
				if (messages.errors.length > 1) {
					messages.errors.length = 1;
				}
				return reject(new Error(messages.errors.join('\n\n')));
			}

			if (
				process.env.CI &&
				typeof process.env.CI !== 'string' &&
				process.env.CI.toLowerCase() !== 'false' &&
				messages.warnings.length
			) {
				//忽略CI生成中的sourcemap警告。
				const filteredWarnings = messages.warnings.filter(
					(w) => w !== !/Failed to parse source map/.test(w)
				);

				if (filteredWarnings.length) {
					console.log(
						chalk.yellow(
							'\nTreating warnings as errors because process.env.CI = true.\n' +
								'Most CI servers set it automatically.\n'
						)
					);
					return reject(new Error(filteredWarnings.join('\n\n')));
				}

				const resolveArgs = {
					stats,
					previousFileSizes,
					warnings: messages.warnings,
				};

				return resolve(resolveArgs);
			}
		});
	});
};

// 设置默认浏览器
checkBrowsers(paths.appPath)
	.then(() => {
		//读取构建文件大小，显示前后发生的变化。
		return measureFileSizesBeforeBuild(paths.appBuild);
	})
	.then((previousFileSizes) => {
		// 清空构建目录里面的内容
		fs.emptyDirSync(paths.appBuild);
		// 合并静态资源
		copyPublicFolder();
		return build(previousFileSizes);
	})
	.then(
		({ stats, previousFileSizes, warnings }) => {
			if (warnings.length) {
				console.log(chalk.yellow('Compiled with warnings.\n'));
				console.log(warnings.join('\n\n'));
				console.log(
					'\nSearch for the ' +
						chalk.underline(chalk.yellow('keywords')) +
						' to learn more about each warning.'
				);
				console.log(
					'To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n'
				);
			} else {
				console.log(chalk.green('Compiled successfully.\n'));
			}

			console.log('File sizes after gzip:\n');
			printFileSizesAfterBuild(
				stats,
				previousFileSizes,
				paths.appBuild,
				WARN_AFTER_BUNDLE_GZIP_SIZE,
				WARN_AFTER_CHUNK_GZIP_SIZE
			);
			console.log();
		},
		(err) => {
			const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
			if (tscCompileOnError) {
				console.log(
					chalk.yellow(
						'Compiled with the following type errors (you may want to check these before deploying your app):\n'
					)
				);
				printBuildError(err);
			} else {
				console.log(chalk.red('Failed to compile.\n'));
				printBuildError(err);
				process.exit(1);
			}
		}
	)
	.catch((err) => {
		if (err && err.message) {
			console.log(err.message);
		}
		process.exit(1);
	});
