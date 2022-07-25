'use strict';

const path = require('path');

const createRedirectServedPathMiddleware = (servedPath) => {
	servedPath = servedPath.slice(0, -1);
	const redirectServedPathMiddleware = (req, res, next) => {
		if (servedPath === '' || req.url === servedPath || req.url.startsWith(servedPath)) {
			next();
		} else {
			const newPath = path.posix.join(servedPath, req.path !== '/' ? req.path : '');
			res.redirect(newPath);
		}
	};
	return redirectServedPathMiddleware;
};

module.exports = createRedirectServedPathMiddleware;
