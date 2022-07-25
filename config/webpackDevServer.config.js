'use strict';

const fs = require('fs');
const paths = require('./paths');
const ignoredFiles = require('./ignoredFiles');
const getHttpsConfig = require('./getHttpsConfig');
const evalSourceMapMiddleware = require('./evalSourceMapMiddleware');
const redirectServedPath = require('./redirectServedPathMiddleware');
const noopServiceWorkerMiddleware = require('./noopServiceWorkerMiddleware');

const host = process.env.HOST || '0.0.0.0';
const sockHost = process.env.WDS_SOCKET_HOST;
const sockPath = process.env.WDS_SOCKET_PATH; // default: '/ws'
const sockPort = process.env.WDS_SOCKET_PORT;

module.exports = (proxy, allowedHost) => {
	const disableFirewall = !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true';
	return {
		// 允许访问白名单
		allowedHosts: disableFirewall ? 'all' : [allowedHost],
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': '*',
			'Access-Control-Allow-Headers': '*',
		},
		// 开启gzip压缩生成文件
		compress: true,
		static: {
			directory: paths.appPublic,
			publicPath: [paths.publicUrlOrPath],
			watch: {
				// 可以避免某些系统上的cpu过载
				ignored: ignoredFiles(paths.appSrc),
			},
		},
		client: {
			webSocketURL: {
				// 自定义websocket主机名、路径名和端口
				hostname: sockHost,
				pathname: sockPath,
				port: sockPort,
			},
			overlay: {
				errors: true,
				warnings: false,
			},
		},
		devMiddleware: {
			// 设置静态资源目录
			publicPath: paths.publicUrlOrPath.slice(0, -1),
		},
		https: getHttpsConfig(),
		host,
		// 
		historyApiFallback: {
			disableDotRule: true,
			index: paths.publicUrlOrPath,
		},
		// 代理设置
		proxy,
		// 自定义函数和中间键
		setupMiddlewares(middlewares, devServer) {
			if (!devServer) {
				throw new Error('webpack-dev-server is not defined');
			}

			// 用sourceMap覆盖相应的错误
			devServer.app.use(evalSourceMapMiddleware(devServer));

			if (fs.existsSync(paths.proxySetup)) {
				// 注册代理中间件
				require(paths.proxySetup)(app);
			}

			// 如果url不匹配，让package.json从定向到PUBLIC_URL或homepage
			app.use(redirectServedPath(paths.publicUrlOrPath));
			app.use(noopServiceWorkerMiddleware(paths.publicUrlOrPath));

			return middlewares;
		},
	};
};
