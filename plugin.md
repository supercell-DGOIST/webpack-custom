##### 插件 (plugins)

>**html-webpack-plugin**
>
>描述：简化html创建
>
>参数：fn(**options**)
>
>| key | **value** | **Default** | **描述** |
>| :------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
>| **inject** |`true| 'head' | 'body' | false`|`true`|将所有资产注入给定的模板或模板内容。'body' \| 'head'：所有javascript资源将放在body或head元素的底部、true：根据scriptLoading选项将其添加到head/body、false：禁用自动注入。|
>| **template** |`''`|''|将所有资产注入给定的模板或模板内容。|
>| **minify** |`Boolean | Object`|`{html-minifier options}`|将所有资产注入给定的模板或模板内容。|
>| **favicon** |`''`|''|将favicon路径添加到html。|
>
>**{html-minifier options}**
>
>描述：自定义html-minifier options。
>
>| key | **value** | **Default** | **描述** |
>| :------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
>| **removeComments** |`true | false`|`false`|是否删除注释|
>| **collapseWhitespace** |`true | false`|`false`|是否清空空格|
>| **removeRedundantAttributes** |`true | false`|`false`|是否去除引号|
>| **useShortDoctype** |`true | false`|`false`|是否将doctype替换为html5简短版|
>| **removeEmptyAttributes** |`true | false | Function(attrName, tag)`|`false`|是否将空属性去除|
>| **removeStyleLinkTypeAttributes** |`true | false`|`false`|是否将style和link中的type="text/css"删除|
>| **keepClosingSlash** |`true | false`|`false`|是否在单元素保留闭合斜杠|
>| **minifyJS** |`true | false | object | Function(text, inline)`|`false`|是否压缩script元素和事件属性中的代码|
>| **minifyCSS** |`true | false | object | Function(text, inline)`|`false`|是否压缩style元素和style属性中的代码|
>| **minifyURLs** |`true | false | object | Function(text)`|`false`|是否压缩各种属性中的url|

>**InterpolateHtmlPlugin**
>
>描述：替换运行中的html里的环境变量，列如：%PUBLIC_URL%，变更为配置的PUBLIC_URL。
>
>参数：fn(**HtmlWebpackPlugin**, **env.raw**)
>
>**{env.raw}**: 自定义环境变量


>**InlineChunkHtmlPlugin**
>
>描述：导出较小的runtime文件注入到html中直接使用，从而减少请求。
>
>参数：fn(**HtmlWebpackPlugin**, **[/runtime-.+[.]js/]**)
>

>**ModuleNotFoundPlugin**
>
>描述：模块未找到增加错误提示
>
>参数：fn(**appPath**)
>

>**webpack.DefinePlugin**
>
>描述：允许在 编译时 将你代码中的变量替换为其他值或表达式。
>
>参数：fn(**env.stringified**)
>

>**case-sensitive-paths-webpack-plugin**
>
>描述： 区分路径大小写，避免大小写导致的问题。

>**mini-css-extract-plugin**
>
>描述： 提取js中的css放到单独的文件中，支持按需加载css和SourceMaps。
>
>参数：fn(**options**)
>| key | **value** | **Default** | **描述** |
>| :------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
>| **filename** |`string | ((pathData: PathData, assetInfo?: AssetInfo) => string);`|`[name].css`|每个输出的css文件名。|
>| **chunkFilename** |`string | ((pathData: PathData, assetInfo?: AssetInfo) => string);`|`[name].css`|需要动态加载的每个css文件名。|

>**webpack-manifest-plugin**
>
>描述： 生成manifest.json文件，文件内容是原文件名称和对应的编译后的文件名称，便于获得对应的文件。
>
>参数：fn(**options**)
>| key | **value** | **Default** | **描述** |
>| :------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
>| **filename** |`string`|`manifest.json`|生成的manifest.json的文件名。|
>| **publicPath** |`string`|`<webpack-config>.output.publicPath`|添加manifest.json文件路径。|
>| **generate** |`string`|`<webpack-config>.output.publicPath`|添加manifest.json文件路径。|

