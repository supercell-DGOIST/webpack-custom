'use strict';

const path = require('path');
const fs = require('fs');
const getPublicUrlOrPath = require('./getPublicUrlOrPath');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const publicUrlOrPath = getPublicUrlOrPath(
	process.env.NODE_ENV === 'development',
	require(resolveApp('package.json')).homepage,
	process.env.PUBLIC_URL
);

const buildPath = process.env.BUILD_PATH || 'build';

const moduleFileExtensions = ['web.mjs', 'mjs', 'web.js', 'js', 'json'];

// 按照webpack路径解析文件路径
const resolveModule = (resolveFn, filePath) => {
	const extension = moduleFileExtensions.find((extension) =>
		fs.existsSync(resolveFn(`${filePath}.${extension}`))
	);

	if (extension) {
		return resolveFn(`${filePath}.${extension}`);
	}

	return resolveFn(`${filePath}.js`);
};

module.exports = {
	dotenv: resolveApp('.env'),
	appPath: resolveApp('.'),
	appBuild: resolveApp(buildPath),
	appPublic: resolveApp('public'),
	appHtml: resolveApp('public/index.html'),
	appIndexJs: resolveModule(resolveApp, 'src/index'),
	appPackageJson: resolveApp('package.json'),
	appSrc: resolveApp('src'),
	proxySetup: resolveApp('mock/setupProxy.js'),
	publicUrlOrPath,
	appNodeModules: resolveApp('node_modules'),
	appWebpackCache: resolveApp('node_modules/.cache'),
  swSrc: resolveModule(resolveApp, 'src/service-worker'),
	moduleFileExtensions,
};
