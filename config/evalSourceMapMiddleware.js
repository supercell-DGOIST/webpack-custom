'use strict';

const base64SourceMap = (source) => {
	const base64 = Buffer.from(JSON.stringify(source.map()), 'utf8').toString('base64');
	return `data:application/json;charset=utf-8;base64,${base64}`;
};

const getSourceById = (server, id) => {
	console.log(server);
	const module = Array.from(server._stats.compilation.modules).find(
		(m) => server._stats.compilation.chunkGraph.getModuleId(m) == id
	);
	return module.originalSource();
};

// 搜索sourceMap的方法，接受webpack内部的url："webpack-internal:///<module-id>"
// 返回sourceMap标签"<source-text><sourceMappingURL><sourceURL>"
const createEvalSourceMapMiddleware = (server) => {
	return (req, res, next) => {
		if (req.url.startsWith('/__get-internal-source')) {
			const fileName = req.query.fileName;
			const id = fileName.match(/webpack-internal:\/\/\/(.+)/)[1];
			if (!id || !server._stats) {
				next();
			}

			const source = getSourceById(server, id);
			const sourceMapURL = `//# sourceMappingURL=${base64SourceMap(source)}`;
			const sourceURL = `//# sourceURL=webpack-internal:///${module.id}`;
			res.end(`${source.source()}\n${sourceMapURL}\n${sourceURL}`);
		} else {
			next();
		}
	};
};

module.exports = createEvalSourceMapMiddleware;
