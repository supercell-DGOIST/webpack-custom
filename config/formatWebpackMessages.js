'use strict';

const friendlySyntaxErrorLabel = 'Syntax error:';

const isLikelyASyntaxError = (message) => {
	return message.indexOf(friendlySyntaxErrorLabel) !== -1;
};

// 清楚webpack错误消息
function formatMessage(message) {
	let lines = [];

	if (typeof message === 'string') {
		lines = message.split('\n');
	} else if ('message' in message) {
		lines = message['message'].split('\n');
	} else if (Array.isArray(message)) {
		message.forEach((message) => {
			if ('message' in message) {
				lines = message['message'].split('\n');
			}
		});
	}

	// 删除webpack标题错误或告警
	// https://github.com/webpack/webpack/blob/master/lib/ModuleError.js
	lines = lines.filter((line) => !/Module [A-z ]+\(from/.test(line));

	// 将分析错误转换为语法错误
	// TODO: move this to our ESLint formatter?
	lines = lines.map((line) => {
		const parsingError = /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
		if (!parsingError) {
			return line;
		}
		const [, errorLine, errorColumn, errorMessage] = parsingError;
		return `${friendlySyntaxErrorLabel} ${errorMessage} (${errorLine}:${errorColumn})`;
	});

	message = lines.join('\n');
	// Smoosh语法错误（常见于CSS中）
	message = message.replace(
		/SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g,
		`${friendlySyntaxErrorLabel} $3 ($1:$2)\n`
	);
	// 清除导出错误
	message = message.replace(
		/^.*export '(.+?)' was not found in '(.+?)'.*$/gm,
		`Attempted import error: '$1' is not exported from '$2'.`
	);
	message = message.replace(
		/^.*export 'default' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm,
		`Attempted import error: '$2' does not contain a default export (imported as '$1').`
	);
	message = message.replace(
		/^.*export '(.+?)' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm,
		`Attempted import error: '$1' is not exported from '$3' (imported as '$2').`
	);
	lines = message.split('\n');

	// 删除前导换行符
	if (lines.length > 2 && lines[1].trim() === '') {
		lines.splice(1, 1);
	}
	// 清理文件名
	lines[0] = lines[0].replace(/^(.*) \d+:\d+-\d+$/, '$1');

	// 清除文件和包的详细“找不到模块”消息。
	if (lines[1] && lines[1].indexOf('Module not found: ') === 0) {
		lines = [
			lines[0],
			lines[1]
				.replace('Error: ', '')
				.replace('Module not found: Cannot find file:', 'Cannot find file:'),
		];
	}

	// 为首次尝试使用Sass的用户添加有用的消息
	if (lines[1] && lines[1].match(/Cannot find module.+sass/)) {
		lines[1] = 'To import Sass files, you first need to install sass.\n';
		lines[1] += 'Run `npm install sass` or `yarn add sass` inside your workspace.';
	}

	message = lines.join('\n');
	// 剥离无用堆栈
	message = message.replace(/^\s*at\s((?!webpack:).)*:\d+:\d+[\s)]*(\n|$)/gm, ''); // at ... ...:x:y
	message = message.replace(/^\s*at\s<anonymous>(\n|$)/gm, ''); // at <anonymous>
	lines = message.split('\n');

	// 删除重复的换行符
	lines = lines.filter(
		(line, index, arr) => index === 0 || line.trim() !== '' || line.trim() !== arr[index - 1].trim()
	);

	// 重新组装消息
	message = lines.join('\n');
	return message.trim();
}

function formatWebpackMessages(json) {
	const formattedErrors = json.errors.map(formatMessage);
	const formattedWarnings = json.warnings.map(formatMessage);
	const result = { errors: formattedErrors, warnings: formattedWarnings };
	if (result.errors.some(isLikelyASyntaxError)) {
		// 显示语法错误
		result.errors = result.errors.filter(isLikelyASyntaxError);
	}
	return result;
}

module.exports = formatWebpackMessages;
