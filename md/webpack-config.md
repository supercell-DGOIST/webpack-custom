#####基础配置 (config )

> **target**：
>
> 描述：设置编译某哪种环境下可用。
> 
>| value：                                                      |
>| :----------------------------------------------------------- |
>| **web**：编译为类浏览器环境里可用 **（默认）**               |
>| **browserslist**：从 browserslist-config 中推断出平台和 ES 特性**（如果 browserslist 可用，其值则为默认）** |
>| **node**：编译为类 Node.js 环境可用（使用 Node.js `require` 加载 chunks） |

> **stats**：
>
> 描述：可精确地控制 bundle 信息的显示。
>
> | value：                                               |
> | :---------------------------------------------------- |
> | **'errors-only'**：只在发生错误时输出                 |
> | **'errors-warnings'**：只在发生错误或有新的编译时输出 |
> | **'none'**：没有输出                                  |
> | **'normal'**：标准输出                                |

> **mode**：
>
> 描述：告知 webpack 使用相应模式的内置优化。
>
> | value：                                                      |
> | :----------------------------------------------------------- |
> | **'development'**：会将 `DefinePlugin` 中 `process.env.NODE_ENV` 的值设置为 `development`. 为模块和 chunk 启用有效的名。 |
> | **'production'**：会将 `DefinePlugin` 中 `process.env.NODE_ENV` 的值设置为 `production`。为模块和 chunk 启用确定性的混淆名称，`FlagDependencyUsagePlugin`，`FlagIncludedChunksPlugin`，`ModuleConcatenationPlugin`，`NoEmitOnErrorsPlugin` 和 `TerserPlugin` 。 |
> | **'none'**：不使用任何默认优化选项                           |

> **bail**：
>
> 描述：控制抛出错误及失败结果后是否继续进行打包。
>
> | value：                                                      |
> | :----------------------------------------------------------- |
> | **false**：默认情况下，当使用 HMR 时，webpack 会将在终端以及浏览器控制台中，以红色文字记录这些错误，但仍然继续进行打包。 |
> | **true**：迫使 webpack 退出其打包过程。                      |

> **devtool**：
>
> 描述：控制是否生成，以及如何生成 source map。
>
> | value：                                                      |
> | :----------------------------------------------------------- |
> | **source-map**：整个 source map 作为一个单独的文件生成。它为 bundle 添加了一个引用注释，以便开发工具知道在哪里可以找到它。 |
> | **none**：不生成 source map。这是一个不错的选择。            |
> | **cheap-module-source-map**：没有列映射(column mapping)的 source map，将 loader source map 简化为每行一个映射(mapping)。 |

> **entry**：
>
> 描述：入口起点。
>
> | value：string \| [ string ]            |
> | :------------------------------------- |
> | './path/to/my/entry/file.js'           |
> | ['./src/file_1.js', './src/file_2.js'] |
>
> | value：{ <entryChunkName>  string  \|  [ string ] } \| {  }  |
> | :----------------------------------------------------------- |
> | **dependOn**：当前入口所依赖的入口。它们必须在该入口被加载前被加载。 |
> | **filename**：指定要输出的文件名称。                         |
> | **library**：指定 library 选项，为当前 entry 构建一个 library。 |
> | **runtime**：运行时 chunk 的名字。如果设置了，就会创建一个新的运行时 chunk。可将其设为 `false` 以避免一个新的运行时 chunk。 |
> | **publicPath**：当该入口的输出文件在浏览器中被引用时，为它们指定一个公共 URL 地址。|
> ```javascript
> module.exports = {
>   entry: {
>     a2: './a',
>     b2: {
>       runtime: 'x2',
>       dependOn: 'a2',
>       import: './b',
>     },
>   },
> };
> ```

> **output**：
>
> 描述：指示 webpack 如何去输出、以及在哪里输出你的「bundle、asset 和其他你所打包或使用 webpack 载入的任何内容。
>
> | key：                                                    |value:|描述|
> | :----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
> | **assetModuleFilename** |'\[hash\]\[ext\]\[query\]'|对从数据 URI 替换构建的静态资源名称|
> | **path**        |path.join(process.cwd(), 'dist')|输出目录对应一个**绝对路径**|
> | **pathinfo** |`boolean=true` `string: 'verbose'`|告知 webpack 在 bundle 中引入「所包含模块信息」的相关注释。`development`默认为**true**，`production`默认为**false**，值为**verbose**时，显示更多信息。|
> | **filename** |``string` `function (pathData, assetInfo) => string`|选项决定了每个输出 bundle 的名称。这些 bundle 将写入到 [`output.path`](https://webpack.docschina.org/configuration/output/#outputpath) 选项指定的目录下。|
> | **chunkFilename** |``string = '[id].js'` `function (pathData, assetInfo) => string`|选项决定了非初始（non-initial）chunk 文件的名称。这些文件名需要在运行时根据 chunk 发送的请求去生成。|
> | **publicPath** |`function`  `string`|选项指定在浏览器中所引用的「此输出目录对应的**公开 URL**」。|
> | **clean** |`boolean`  `{ dry?: boolean, keep?: RegExp | string | ((filename: string) => boolean) } `| `clean: true  在生成文件之前清空 output 目录。` `clean: { dry: true, // 打印而不是删除应该移除的静态资源, keep: /ignored\/dir\//, // 保留 'ignored/dir' 下的静态资源 }` |
> | **devtoolModuleFilenameTemplate** |``string = 'webpack://[namespace]/[resource-path]?[loaders]'` `function (info) => string`| `自定义每个 source map 的 `sources` 数组中使用的名称。可以通过传递模板字符串(template string)或者函数来完成。 |

> **cache**：
>
> 描述：缓存生成的 webpack 模块和 chunk，来改善构建速度。`cache` 会在[`开发` 模式](https://webpack.docschina.org/configuration/mode/#mode-development)被设置成 `type: 'memory'` 而且在 [`生产` 模式](https://webpack.docschina.org/configuration/mode/#mode-production) 中被禁用。 `cache: true` 与 `cache: { type: 'memory' }` 配置作用一致。
>
> | value： boolean   |
> | :------------------ |
> | **false**：禁用缓存 |
> | **true**：开启缓存  |
> 
> | key    | value | 描述 |
> | :------------------ | ------------------ | ------------------ |
> | **type** |`string: 'memory' | 'filesystem' `|将 `cache` 类型设置为内存或者文件系统。|
> | **version** |`strin=''`|缓存数据的版本。不同版本不会允许重用缓存和重载当前的内容。|
> | **cacheDirectory** |`string`|缓存目录。默认为 `node_modules/.cache/webpack`。|
> | **store** |`string = 'pack': 'pack'`|缓存数据的版本。不同版本不会允许重用缓存和重载当前的内容。|
> | **buildDependencies** |`object`|额外的依赖文件，当这些文件内容发生变化时，缓存会完全失效而执行完整的编译构建，通常可设置为项目配置文件。默认是 `webpack/lib` 来获取 webpack 的所有依赖项。` buildDependencies: { config: [__filename],       // 默认情况下 webpack 与 loader 是构建依赖。     }` |

> **infrastructureLogging**：
>
> 描述：用于基础设施水平的日志选项。
>
> | key            | value                                                        | 描述                                                         |
> | :------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
> | **appendOnly** | `boolean`                                                    | 将内容追加到现有输出中，而非更新现有输出，这对于展示状态信息来说非常有用。 |
> | **colors**     | `boolean`                                                    | 为基础设施日志启用带有颜色的输出。                           |
>| **level**      | `string = 'info' : 'none' | 'error' | 'warn' | 'info' | 'log' | 'verbose'` | 开启基础设施日志输出。'none' - 禁用日志、'error' - 仅仅显示错误、'warn' - 仅仅显示错误与告警、'info' - 显示错误、告警与信息、'log' - 显示错误、告警，信息，日志信息，组别，清楚。 收缩的组别会在收缩的状态中被显示。、'verbose' - 输出所有日志除了调试与追踪。收缩的组别会在扩展的状态中被显示。 |

> **optimization**：
>
> 描述：会根据你选择的 [`mode`](https://webpack.docschina.org/concepts/mode/) 来执行不同的优化， 不过所有的优化还是可以手动配置和重写。
>
> | key           | value                                       | 描述                                                         |
> | :------------ | ------------------------------------------- | ------------------------------------------------------------ |
> | **minimize**  | `boolean = true`                            | 告知 webpack 使用 [TerserPlugin](https://webpack.docschina.org/plugins/terser-webpack-plugin/) 或其它在 [`optimization.minimizer`](https://webpack.docschina.org/configuration/optimization/#optimizationminimizer)定义的插件压缩 bundle。 |
> | **minimizer** | `[TerserPlugin]` 或 `[function (compiler)]` | 允许你通过提供一个或多个定制过的 [TerserPlugin](https://webpack.docschina.org/plugins/terser-webpack-plugin/) 实例，覆盖默认压缩工具(minimizer)。 |

> **resolve**：
>
> 描述：配置模块如何解析。例如，当在 ES2015 中调用 `import 'lodash'`，`resolve` 选项能够对 webpack 查找 `'lodash'` 的方式去做修改（查看[`模块`](https://webpack.docschina.org/configuration/resolve/#resolve-modules)）。
>
> | key            | value                                  | 描述                                                         |
> | :------------- | -------------------------------------- | ------------------------------------------------------------ |
> | **modules**    | `[string] = ['node_modules']`          | 告诉 webpack 解析模块时应该搜索的目录。绝对路径和相对路径都能使用。 |
> | **extensions** | `[string] = ['.js', '.json', '.wasm']` | 尝试按顺序解析这些后缀名。如果有多个文件有相同的名字，但后缀名不同，webpack 会解析列在数组首位的后缀的文件 并跳过其余的后缀。 |
> | **alias**      | `object`                               | 创建 `import` 或 `require` 的别名，来确保模块引入变得更简单。 |
> | **plugins**    | `[Plugin]`                             | 应该使用的额外的解析插件列表。                               |

> **module**：
>
> 描述：这些选项决定了如何处理项目中的[不同类型的模块](https://webpack.docschina.org/concepts/modules)。
>
> | key        | value              | 描述                                                         |
> | :--------- | ------------------ | ------------------------------------------------------------ |
> | **rules**  | `[Rule]`           | 创建模块时，匹配请求的[规则](https://webpack.docschina.org/configuration/module/#rule)数组。这些规则能够修改模块的创建方式。 这些规则能够对模块(module)应用 loader，或者修改解析器(parser)。 |
> | **parser** | `module.generator` | 类似于 [`module.generator`](https://webpack.docschina.org/configuration/module/#modulegenerator)，你可以用 `module.parser` 在一个地方配置所有解析器的选项。 |
>
> **[Rule]**
>
> 描述：每个规则可以分为三部分 - 条件(condition)，结果(result)和嵌套规则(nested rule)。
>
> | key         | value                                  | 描述                                                         |
> | :---------- | -------------------------------------- | ------------------------------------------------------------ |
> | **enforce** | `string="pre" | "post"` | 指定 loader 种类。没有值表示是普通 loader。 |
> | **exclude** | `RegExp` | 排除所有符合条件的模块。 |
> | **test** | `RegExp`                         | 引入所有通过断言测试的模块。 |
> | **loader** | `[UseEntry] function(info)`    | `Rule.loader` 是 `Rule.use: [ { loader } ]` 的简写。 |
> | **type** | `string` | 设置类型用于匹配模块。它防止了 `defaultRules` 和它们的默认导入行为发生。 |
> | **mimetype** | `string` | 使 rules 配置与 data 的 uri 进行匹配 |
> | **parser** | `object`  `boolean` | **{ parserEntry }** |
> | **use** | `[UseEntry] function(info)` | `应用于模块的 [UseEntries](https://webpack.docschina.org/configuration/module/#useentry) 数组。每个入口(entry)指定使用一个 loader。 |
> | **issuer** | `[Condition]` | 一个[`条件`](https://webpack.docschina.org/configuration/module/#condition)，用来与被发出的 request 对应的模块项匹配。 |
> | **oneOf**   | `[Rule]`                    | [`规则`](https://webpack.docschina.org/configuration/module/#rule)数组，当规则匹配时，只使用第一个匹配规则。 |
> | **options** | `string | object` | 值可以传递到 loader 中，将其理解为 loader 选项。 |
> | **sideEffects** | `boolean` | 表明模块的哪一部份包含副作用。详情参阅 [Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)。 |
> | **options** | `string | object` | 值可以传递到 loader 中，将其理解为 loader 选项。 |
>
> **{ parserEntry }**
>
> 描述：解析选项对象。所有应用的解析选项都将合并。
>
> | key         | value                                  | 描述                                                         |
> | :---------- | -------------------------------------- | ------------------------------------------------------------ |
> | **dataUrlCondition** | `object = { maxSize number = 8096 }` `function (source, { filename, module }) => boolean` | 如果一个模块源码大小小于 `maxSize`，那么模块会被作为一个 Base64 编码的字符串注入到包中， 否则模块文件会被生成到输出的目标目录中。 |
> ``````/
>  {
  parser: {
      dataUrlCondition: (source, { filename, module }) => {
          const content = source.toString();
          return content.includes('some marker');
      },
  },
}
> ``````
>

> **plugins**：
>
> 描述：一组 webpack 插件。详情请查看plugin.md。
>| value： Array                                                |
>| :----------------------------------------------------------- |
>| **[`[Plugin]`](https://webpack.docschina.org/plugins/)**    |

> **performance**：
>
> 描述：这些选项可以控制 webpack 如何通知「资源(asset)和入口起点超过指定文件限制」。
>`value： object \| boolean  `

> **DevServer**：
>
> 描述：[webpack-dev-server](https://github.com/webpack/webpack-dev-server) 可用于快速开发应用程序。详情请查看web-dev-server-config.md