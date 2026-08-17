---
name: 16-resources菜单内容更新
overview: 将 public/content/16-resources/ 下全部 33 篇文章的 [!example] 完整示例占位符替换为真实可运行、贴合上位机/工控场景的 WPF 示例代码（XAML+C# 两段代码块），遵循已确立的模板规范。
todos:
  - id: ch16-comm-industrial
    content: 替换通信与工控项目类 6 篇 [!example] 占位符（开源plc通信库、开源scada项目、工控看板模板项目、mqttnet、nmodbus、通信调试工具），主题与文章对应
    status: completed
  - id: ch16-ui-chart-libs
    content: 替换 UI 控件与图表库类 8 篇 [!example] 占位符（handycontrol、materialdesigninxaml、livecharts2、oxyplot、ui-类-nuget-包、mvvm-与通信类-nuget-包、数据类-nuget-包、日志与工具类-nuget-包）
    status: completed
  - id: ch16-framework-tools
    content: 替换 MVVM/数据/日志/开发工具类 8 篇 [!example] 占位符（prism、communitytoolkitmvvm、propertychangedfody、dapper、serilog、visual-studio-2022-与-resharper、snoop-与-wpf-performance-suite、flaui）
    status: completed
  - id: ch16-learning-resources
    content: 替换教程与学习资源类 11 篇 [!example] 占位符（博客园与csdn、net-中文社区与知乎、youtube-与-b站-wpf-教程推荐、stack-overflow、microsoft-docs-wpf-官方文档、microsoft-learn-wpf-学习路径、深入浅出-wpf、wpf-编程宝典、c-高级编程、c-并发编程经典实例、完整学习路线图7个阶段）
    status: completed
  - id: ch16-verify
    content: 全量校验：占位符计数为0、[!example] 仍为33个、git diff --stat 仅动 16-resources、无 ^\+ 残留
    status: completed
    dependencies:
      - ch16-comm-industrial
      - ch16-ui-chart-libs
      - ch16-framework-tools
      - ch16-learning-resources
---

## 用户需求

完成菜单第16章"开源项目与学习资源"的代办事项：将 `public/content/16-resources/` 下全部 33 篇文章中 `[!example] 完整示例` 卡片的占位符（"// 📝 待补充实际示例代码"）替换为真实可运行、贴合上位机/工控场景的 WPF 示例代码（XAML + C# 两段代码块）。

## 功能内容

- 共 33 个 Markdown 文件、33 个占位符，每篇 1 个，全部替换为完整示例
- 每篇示例主题与文章主题严格对应：通信库（MQTTnet→MQTT 客户端、nmodbus→Modbus RTU 读寄存器、开源 PLC 通信库→HslCommunication 风格通信演示）、SCADA/看板（监控画面、看板布局）、图表库（LiveCharts2→实时折线图、OxyPlot→曲线图）、UI 库（HandyControl、MaterialDesignInXaml→主题控件）、框架（Prism→模块导航、CommunityToolkit.Mvvm→MVVM 绑定、PropertyChanged.Fody→属性通知）、数据/日志（Dapper→SQLite 查询、Serilog→文件日志）、工具（Visual Studio/Snoop/FLaui→调试与测试最小演示）、学习资源类（书籍/社区/视频→主题相关最小演示）
- 只改 `[!example]` 卡片，其余 9 种 Callout（plain/def/origin/essentials/scene/pitfall/best/practice/related）及 meta.json、src、styles、index.html 一律不动

## 模板规范（强制）

- 命名空间 `HmiDemo`、类 `MainWindow`（工具/框架类可用贴切子类名）
- 暗色配色：窗口 Background="#0D1117"、面板 #161B22、按钮 #21262D、强调蓝 #58A6FF、文本 #8B949E、成功 #238636、危险 #DA3633
- 中文注释；XAML 事件与 x:Name 和 C# 代码严格一一对应；概念性/资源介绍类文章也给出最小可运行演示
- 格式参照 `04-controls/button-按钮.md` 与 `06-graphics/wpf-图形渲染概述.md`：`[!example]` 内为"主题描述 + **MainWindow.xaml：** ```xml 块 + **MainWindow.xaml.cs —— 后台代码：** ```csharp 块"

## 边界

- 仅处理 16-resources 章节，不触碰 14-projects、15-deployment（工作区已有并行会话未提交修改）、11-advanced-ui（并行会话进行中）等其他章节；不主动 git 提交，除非用户另行要求

## 技术选型

- 本任务为纯 Markdown 内容更新，不新增/修改任何工程代码；示例代码面向 WPF（.NET）上位机场景，使用 XAML + C# 编写
- 使用文件读写工具逐篇替换，保持文件 UTF-8 编码（防止 PowerShell 中文乱码）

## 实现方案

- 逐篇读取目标文件，结合文件名与文章标题/场景段落确定示例主题，仅替换 `[!example]` 卡片内的两行占位注释为完整示例（保持 `> ` 引用前缀，代码块语言标记 `xml` 与 `csharp`）
- 示例统一采用 HmiDemo 命名空间 + MainWindow 类 + 暗色 GitHub 风格配色，中文注释，XAML 事件/x:Name 与 C# 严格对应；第三方库文章使用 NuGet 常规 API 写法（如 MQTTnet 的 MqttFactory、NModbus 的 ModbusFactory、Dapper 的 SqliteConnection 等），不引入额外依赖说明，仅作知识演示
- 学习资源/工具类文章（书籍、社区、视频、IDE 等）给"最小演示"：将资源主题映射到贴近上位机的 WPF 小示例（如官方文档篇演示文档中典型控件的用法、调试工具篇演示可视化树/性能面板相关的最小窗口、路线图篇演示阶段性学习成果的综合小看板）

## 实施细节

- 每篇替换前先读取全文，确认该文 `[!example]` 的唯一占位结构，避免误改其他 Callout；替换后立即检查该文件行数/结构完整性
- 性能与风险：纯文本替换无性能问题；重点防回归——不删除 `> ` 前缀、不在示例中混入 `+` 字符前缀、不破坏文件其余 9 个 Callout 与 YAML front-matter
- 校验清单（全部通过才算完成）：

1. `search_content` 搜"待补充实际示例代码"在 public/content 全库计数为 0（16-resources 的 33 个清零，其余章节已为 0）
2. `search_content` 统计 16-resources 中 `[!example]` 数量仍为 33（每篇保留且仅保留 1 个）
3. `git diff --stat` 确认仅改动 16-resources 目录下的 33 个文件，无其他章节/文件混入
4. 检查目标文件无 `^\+` 前缀残留（排除正常 diff 标记）

- 提交说明（仅当用户确认提交时执行）：`16.开源项目与学习资源菜单内容更新`

## 架构设计

- 无架构变更：不新增代码文件、不修改任何配置；33 个 Markdown 文件为唯一修改目标，示例代码遵循统一内容模板（XAML 界面块 + C# 后台逻辑块），保证跨文章风格一致、可复制运行

## 目录结构（修改目标，共 33 个文件）

```
public/content/16-resources/   # [MODIFY ×33] 仅替换各文件 [!example] 卡片
├── 通信与工控项目类（6 篇）：
│   ├── 开源-plc-通信库.md           # HslCommunication 风格 PLC 通信演示
│   ├── 开源-scada-项目.md           # SCADA 监控主画面最小演示
│   ├── 工控看板模板项目.md          # 工控看板布局与数据刷新演示
│   ├── mqttnet.md                   # MQTT 客户端连接/订阅/发布演示
│   ├── nmodbus.md                   # Modbus RTU 读取保持寄存器演示
│   └── 通信调试工具vspdmqttxmodbus-poll.md  # 调试工具联动的最小通信演示
├── UI 控件与图表库类（8 篇）：
│   ├── handycontrol.md              # HandyControl 卡片/抽屉控件演示
│   ├── materialdesigninxaml.md      # MaterialDesign 主题控件演示
│   ├── livecharts2.md               # LiveCharts2 实时折线图演示
│   ├── oxyplot.md                   # OxyPlot 曲线图演示
│   ├── ui-类-nuget-包.md            # UI 类库综合最小演示
│   ├── mvvm-与通信类-nuget-包.md    # MVVM 框架与通信组合演示
│   ├── 数据类-nuget-包.md           # 数据访问类库最小演示
│   └── 日志与工具类-nuget-包.md     # 日志工具类库最小演示
├── MVVM/数据/日志/开发工具类（8 篇）：
│   ├── prism.md                     # Prism 模块导航最小演示
│   ├── communitytoolkitmvvm.md      # CommunityToolkit.Mvvm 绑定演示
│   ├── propertychangedfody.md       # Fody 属性通知编译期织入演示
│   ├── dapper.md                    # Dapper SQLite 查询演示
│   ├── serilog.md                   # Serilog 文件日志演示
│   ├── visual-studio-2022-与-resharper.md  # IDE 调试功能最小演示
│   ├── snoop-与-wpf-performance-suite.md   # 可视化树检查工具最小演示
│   └── flaui.md                     # FLaui 自动化测试目标应用演示
└── 教程与学习资源类（11 篇）：
    ├── 博客园与-csdn.md             # 技术文章学习法最小演示
    ├── net-中文社区与知乎.md        # 社区问答场景最小演示
    ├── youtube-与-b站-wpf-教程推荐.md  # 教程跟学最小演示
    ├── stack-overflow.md            # 问题定位流程最小演示
    ├── microsoft-docs-wpf-官方文档.md  # 官方文档典型控件演示
    ├── microsoft-learn-wpf-学习路径.md # 学习路径阶段小演示
    ├── 深入浅出-wpf.md              # 书籍核心概念最小演示
    ├── wpf-编程宝典.md              # 宝典常见技巧最小演示
    ├── c-高级编程.md                # C# 高级特性 WPF 演示
    ├── c-并发编程经典实例.md        # async/await 与并发最小演示
    └── 完整学习路线图7个阶段.md     # 路线图综合成果小看板
```