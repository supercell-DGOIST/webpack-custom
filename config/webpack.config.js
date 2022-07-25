const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { createHash } = require('crypto');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const InlineChunkHtmlPlugin = require('./plugin/InlineChunkHtmlPlugin');
const InterpolateHtmlPlugin = require('./plugin/InterpolateHtmlPlugin');
const ModuleNotFoundPlugin = require('./plugin/ModuleNotFoundPlugin');
const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');

const createEnvironmentHash = (env) => {
	const hash = createHash('md5');
	hash.update(JSON.stringify(env));

	return hash.digest('hex');
};

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000');

// 检查是否有Tailwind配置
const useTailwind = fs.existsSync(path.join(paths.appPath, 'tailwind.config.js'));

// 获取service-Worker.js路径
const swSrc = paths.swSrc;

// 样式文件规则
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.less$/;
const sassModuleRegex = /\.module\.less$/;

module.exports = function (webpackEnv) {
	const isEnvDevelopment = webpackEnv === 'development';
	const isEnvProduction = webpackEnv === 'production';
	// 启用分析
	const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');

	// 获取环境变量
	const env = getClientEnvironment('/');

	const getStyleLoaders = (cssOptions, preProcessor) => {
		const loaders = [
			isEnvDevelopment && require.resolve('style-loader'),
			isEnvProduction && {
				loader: MiniCssExtractPlugin.loader,
				// css在static/css中，使用../../查找索引。
				options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {},
			},
			{
				loader: require.resolve('css-loader'),
				options: cssOptions,
			},
			{
				// 添加浏览器前缀
				loader: require.resolve('postcss-loader'),
				options: {
					postcssOptions: {
						ident: 'postcss',
						config: false,
						plugins: !useTailwind
							? [
									'postcss-flexbugs-fixes',
									[
										'postcss-preset-env',
										{
											autoprefixer: {
												flexbox: 'no-2009',
											},
											stage: 3,
										},
									],
									// Adds PostCSS Normalize as the reset css with default options,
									// so that it honors browserslist config in package.json
									// which in turn let's users customize the target behavior as per their needs.
									'postcss-normalize',
							  ]
							: [
									'tailwindcss',
									'postcss-flexbugs-fixes',
									[
										'postcss-preset-env',
										{
											autoprefixer: {
												flexbox: 'no-2009',
											},
											stage: 3,
										},
									],
							  ],
					},
					sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
				},
			},
		].filter(Boolean);
		if (preProcessor) {
			loaders.push(
				{
					loader: require.resolve('resolve-url-loader'),
					options: {
						sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
						root: paths.appSrc,
					},
				},
				{
					loader: require.resolve(preProcessor),
					options: {
						sourceMap: true,
					},
				}
			);
		}
		return loaders;
	};

	return {
		target: ['browserslist'],
		// 只在发生错误或有新的编译时输出捆绑信息
		stats: 'errors-warnings',
		mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
		// 生产环境编译抛错停止打包
		bail: isEnvProduction,
		devtool: isEnvProduction
			? shouldUseSourceMap
				? 'source-map'
				: false
			: isEnvDevelopment && 'cheap-module-source-map',
		entry: paths.appIndexJs,
		output: {
			// 输出目录对应一个绝对路径
			path: paths.appBuild,
			// 告知 webpack 在 bundle 中引入「所包含模块信息」的相关注释。
			pathinfo: isEnvDevelopment,
			// 每个异步块将有一个主捆绑包和一个文件。
			// 在开发过程中，它不会生成真实的文件
			filename: isEnvProduction
				? 'static/js/[name].[contenthash:8].js'
				: isEnvDevelopment && 'static/js/bundle.js',
			// 拆分代码，缩小入口文件
			chunkFilename: isEnvProduction
				? 'static/js/[name].[contenthash:8].chunk.js'
				: isEnvDevelopment && 'static/js/[name].chunk.js',
			// 处理静态资源
			assetModuleFilename: 'static/media/[name].[hash][ext]',
			// 指定公共路径
			publicPath: '/',
			// 指定sourcemap位置
			devtoolModuleFilenameTemplate: isEnvProduction
				? (info) => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
				: isEnvDevelopment &&
				  ((info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
		},
		// 缓存生成的 webpack 模块和 chunk，来改善构建速度。
		cache: {
			type: 'filesystem',
			version: createEnvironmentHash(env.raw),
			cacheDirectory: paths.appWebpackCache,
			store: 'pack',
			buildDependencies: {
				defaultWebpack: ['webpack/lib/'],
				config: [__filename],
			},
		},
		// 禁用基础日志
		infrastructureLogging: {
			level: 'none',
		},
		// 根据mode环境执行对应的优化
		optimization: {
			minimize: isEnvProduction,
			minimizer: [
				// 只在生成环境下，进行压缩
				new TerserPlugin({
					terserOptions: {
						parse: {
							ecma: 8,
						},
						compress: {
							ecma: 5,
							warnings: false,
							comparisons: false,
							inline: 2,
						},
						mangle: {
							safari10: true,
						},
						// 增加devtools中的分析代码
						keep_classnames: isEnvProductionProfile,
						keep_fnames: isEnvProductionProfile,
						output: {
							ecma: 5,
							comments: false,
							ascii_only: true,
						},
					},
				}),
				new CssMinimizerPlugin(),
			],
		},
		resolve: {
			modules: ['node_modules', paths.appNodeModules],
			// 按顺序解析对应后缀的文件
			extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
			alias: {
				...(modules.webpackAliases || {}),
			},
		},
		module: {
			// 无效导出报错
			parser: {
				javascript: {
					exportsPresence: 'error',
				},
			},
			// 解析规则
			rules: [
				// 处理sourcemaps模块
				shouldUseSourceMap && {
					enforce: 'pre',
					exclude: /@babel(?:\/|\\{1,2})runtime/,
					test: /\.(js|mjs|ts|css)$/,
					loader: require.resolve('source-map-loader'),
				},
				{
					// 当规则匹配时，只使用第一个匹配规则。
					oneOf: [
						{
							// mime-db中有image/avif配置将其合并
							test: [/\.avif$/],
							type: 'asset',
							mimetype: 'image/avif',
							parser: {
								dataUrlCondition: {
									maxSize: imageInlineSizeLimit,
								},
							},
						},
						{
							test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
							type: 'asset',
							parser: {
								dataUrlCondition: {
									maxSize: imageInlineSizeLimit,
								},
							},
						},
						{
							test: /\.svg$/,
							use: [
								{
									loader: require.resolve('@svgr/webpack'),
									options: {
										prettier: false,
										svgo: false,
										svgoConfig: {
											plugins: [{ removeViewBox: false }],
										},
										titleProp: true,
										ref: true,
									},
								},
								{
									loader: require.resolve('file-loader'),
									options: {
										name: 'static/media/[name].[hash].[ext]',
									},
								},
							],
							issuer: {
								and: [/\.(ts|js|md|mdx)$/],
							},
						},
						// 使用Babel处理应用程序JS、TS。
						{
							test: /\.(js|mjs|ts)$/,
							include: paths.appSrc,
							loader: require.resolve('babel-loader'),
							options: {
								customize: require.resolve('babel-preset-react-app/webpack-overrides'),
								presets: [
									[
										require.resolve('babel-preset-react-app'),
										{
											runtime: hasJsxRuntime ? 'automatic' : 'classic',
										},
									],
								],

								plugins: [
									isEnvDevelopment &&
										shouldUseReactRefresh &&
										require.resolve('react-refresh/babel'),
								].filter(Boolean),
								// This is a feature of `babel-loader` for webpack (not Babel itself).
								// It enables caching results in ./node_modules/.cache/babel-loader/
								// directory for faster rebuilds.
								cacheDirectory: true,
								// See #6846 for context on why cacheCompression is disabled
								cacheCompression: false,
								compact: isEnvProduction,
							},
						},
						// "postcss" loader applies autoprefixer to our CSS.
						// "css" loader resolves paths in CSS and adds assets as dependencies.
						// "style" loader turns CSS into JS modules that inject <style> tags.
						// In production, we use MiniCSSExtractPlugin to extract that CSS
						// to a file, but in development "style" loader enables hot editing
						// of CSS.
						// By default we support CSS Modules with the extension .module.css
						{
							test: cssRegex,
							exclude: cssModuleRegex,
							use: getStyleLoaders({
								importLoaders: 1,
								sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
								modules: {
									mode: 'icss',
								},
							}),
							// Don't consider CSS imports dead code even if the
							// containing package claims to have no side effects.
							// Remove this when webpack adds a warning or an error for this.
							// See https://github.com/webpack/webpack/issues/6571
							sideEffects: true,
						},
						// Adds support for CSS Modules (https://github.com/css-modules/css-modules)
						// using the extension .module.css
						{
							test: cssModuleRegex,
							use: getStyleLoaders({
								importLoaders: 1,
								sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
								modules: {
									mode: 'local',
								},
							}),
						},
						// Opt-in support for SASS (using .scss or .sass extensions).
						// By default we support SASS Modules with the
						// extensions .module.scss or .module.sass
						{
							test: sassRegex,
							exclude: sassModuleRegex,
							use: getStyleLoaders(
								{
									importLoaders: 3,
									sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
									modules: {
										mode: 'icss',
									},
								},
								'sass-loader'
							),
							// Don't consider CSS imports dead code even if the
							// containing package claims to have no side effects.
							// Remove this when webpack adds a warning or an error for this.
							// See https://github.com/webpack/webpack/issues/6571
							sideEffects: true,
						},
						// Adds support for CSS Modules, but using SASS
						// using the extension .module.scss or .module.sass
						{
							test: sassModuleRegex,
							use: getStyleLoaders(
								{
									importLoaders: 3,
									sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
									modules: {
										mode: 'local',
									},
								},
								'sass-loader'
							),
						},
						{
							// Exclude `js` files to keep "css" loader working as it injects
							// its runtime that would otherwise be processed through "file" loader.
							// Also exclude `html` and `json` extensions so they get processed
							// by webpacks internal loaders.
							exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
							type: 'asset/resource',
						},
					],
				},
			],
		},
		plugins: [
			// 生成index.html并注入<script>标签
			new HtmlWebpackPlugin(
				Object.assign(
					{},
					{
						inject: true,
						template: paths.appHtml,
					},
					isEnvProduction
						? {
								minify: {
									removeComments: true,
									collapseWhitespace: true,
									removeRedundantAttributes: true,
									useShortDoctype: true,
									removeEmptyAttributes: true,
									removeStyleLinkTypeAttributes: true,
									keepClosingSlash: true,
									minifyJS: true,
									minifyCSS: true,
									minifyURLs: true,
								},
						  }
						: undefined
				)
			),
			// 导出较小的runtime文件注入到html中直接使用，从而减少请求。
			isEnvProduction &&
				shouldInlineRuntimeChunk &&
				new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
			// 替换运行中的html里的环境变量，列如：%PUBLIC_URL%，变更为配置的PUBLIC_URL。
			new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
			// 模块未找到增加错误提示
			new ModuleNotFoundPlugin(paths.appPath),
			// 允许在 编译时 将你代码中的变量替换为其他值或表达式。
			new webpack.DefinePlugin(env.stringified),
			// 区分路径大小写，避免大小写导致的问题
			isEnvDevelopment && new CaseSensitivePathsPlugin(),
			// 提取js文件中的css放到单独的文件中，支持按需加载CSS和SourceMaps。仅支持webpack5+
			isEnvProduction &&
				new MiniCssExtractPlugin({
					// 和webpack.output相似
					filename: 'static/css/[name].[contenthash:8].css',
					chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
				}),
			// 生成清单文件：
			// files: 将所有资产文件名映射到其相应的输出文件，以便工具无需解析即可获取它。
			// entrypoints: 包含在索引中的文件数组。
			new WebpackManifestPlugin({
				fileName: 'asset-manifest.json',
				publicPath: paths.publicUrlOrPath,
				generate: (seed, files, entrypoints) => {
					const manifestFiles = files.reduce((manifest, file) => {
						manifest[file.name] = file.path;
						return manifest;
					}, seed);
					const entrypointFiles = entrypoints.main.filter((fileName) => !fileName.endsWith('.map'));

					return {
						files: manifestFiles,
						entrypoints: entrypointFiles,
					};
				},
			}),
			// 使用Moment.js时，忽略语言设置文件加快打包速度
			new webpack.IgnorePlugin({
				resourceRegExp: /^\.\/locale$/,
				contextRegExp: /moment$/,
			}),
			// 生成一个服务工作者脚本，该脚本将预缓存并保持最新,网页包构建一部分的HTML和资产。
			isEnvProduction &&
				fs.existsSync(swSrc) &&
				new WorkboxWebpackPlugin.InjectManifest({
					swSrc,
					dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
					exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
					// 增加最大文件大小缓存字节，降低延迟加载失败的可能性。
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				}),
		].filter(Boolean),
		// 关闭性能提示，改为自己处理提示
		performance: false,
	};
};
