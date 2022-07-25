'use strict';

const { URL } = require('url');

// 返回URL或路径，末尾带有斜线
const getPublicUrlOrPath = (isEnvDevelopment, homepage, envPublicUrl) => {
	if (envPublicUrl) {
		// 确保最后有一个斜线
		envPublicUrl = envPublicUrl.endsWith('/') ? envPublicUrl : envPublicUrl + '/';

		// 验证envPublicUrl是否是url或path
		const validPublicUrl = new URL(envPublicUrl);

		return isEnvDevelopment
			? envPublicUrl.startsWith('.')
				? '/'
				: validPublicUrl.pathname
			: //一些应用程序不使用pushState的客户端路由。
			  //对于这些，可以将“homepage”设置为“.”启用相对资产路径。
			  envPublicUrl;
	}

	if (homepage) {
		// 删除最后的斜线
		homepage = homepage.endsWith('/') ? homepage : homepage + '/';

		// 验证“homepage”是否类似于URL或路径，并仅使用路径名
		const validHomepagePathname = new URL(homepage).pathname;

		return isEnvDevelopment
			? homepage.startsWith('.')
				? '/'
				: validHomepagePathname
			: //一些应用程序不使用pushState的客户端路由。
			//对于这些，可以将“homepage”设置为“.”启用相对资产路径。
			homepage.startsWith('.')
			? homepage
			: validHomepagePathname;
	}

	return '/';
};

module.exports = getPublicUrlOrPath;
