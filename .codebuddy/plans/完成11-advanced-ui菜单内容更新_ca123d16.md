---
name: 完成11-advanced-ui菜单内容更新
overview: 将 public/content/11-advanced-ui/ 下全部 31 篇文章的 [!example] 完整示例占位符替换为真实可运行、贴合上位机/工控场景的 WPF 示例（XAML + C# 两段代码块），沿用已完成章节的 HmiDemo 标准模板与配色规范。
todos:
  - id: sec-11-1
    content: 完成 11.1 自定义控件深度开发 5 篇文章示例填充
    status: completed
  - id: sec-11-2
    content: 完成 11.2 数据模板高级应用 4 篇文章示例填充
    status: completed
  - id: sec-11-3
    content: 完成 11.3 主题与换肤 3 篇文章示例填充
    status: completed
  - id: sec-11-4-5
    content: 完成 11.4 多语言与 11.5 拖拽 5 篇文章示例填充
    status: completed
  - id: sec-11-6
    content: 完成 11.6 Win32 API 交互 2 篇文章示例填充
    status: completed
  - id: sec-11-7
    content: 完成 11.7 第三方 UI 控件库 5 篇文章示例填充
    status: completed
  - id: sec-11-8-9
    content: 完成 11.8 响应式布局与 11.9 高 DPI 5 篇示例填充
    status: completed
  - id: sec-11-10
    content: 完成 11.10 触控与手势 2 篇文章示例填充
    status: completed
  - id: verify
    content: 全局校验占位符清零、git diff 范围与 ^+ 前缀残留检查
    status: completed
    dependencies:
      - sec-11-1
      - sec-11-2
      - sec-11-3
      - sec-11-4-5
      - sec-11-6
      - sec-11-7
      - sec-11-8-9
      - sec-11-10
  - id: commit
    content: git 提交 11.WPF高级UI开发菜单内容更新
    status: completed
    dependencies:
      - verify
---

## 产品概述

完成 WPF 上位机开发学习平台菜单第 11 章"WPF 高级 UI 开发"的代办事项：将 public/content/11-advanced-ui/ 下 31 篇文章中 [!example] 完整示例卡片的占位符替换为真实可运行的 WPF 示例代码（XAML + C# 两段代码块），示例须贴合上位机/工控场景，遵循既定模板规范。

## 核心功能

- 覆盖全部 31 篇：11.1 自定义控件深度开发（5 篇）、11.2 数据模板高级应用（4 篇）、11.3 主题与换肤（3 篇）、11.4 多语言与国际化（2 篇）、11.5 拖拽功能（3 篇）、11.6 WPF 与 Windows API 交互（2 篇）、11.7 第三方 UI 控件库（5 篇）、11.8 响应式布局与自适应（3 篇）、11.9 高 DPI 适配（2 篇）、11.10 触控与手势（2 篇）
- 每篇示例：命名空间 HmiDemo、类 MainWindow、既定深色配色（#0D1117 等）、中文注释、XAML 事件/x:Name 与 C# 严格对应；概念性文章也提供最小可运行演示
- 仅替换 [!example] 卡片内部内容，其余 9 个 Callout（plain/def/origin/essentials/scene/pitfall/best/practice/related）及 meta.json、src/、styles/ 一律不动
- 全局校验：占位符计数为 0、git diff 仅涉及 11-advanced-ui 目录、无 "^+" 前缀残留
- git 提交，提交信息"11.WPF高级UI开发菜单内容更新"

## 技术栈

- 内容载体：Markdown（Vite + 原生 JS + marked 的纯前端 SPA，构建与渲染层零改动）
- 示例代码：WPF / XAML + C#（命名空间 HmiDemo，类 MainWindow，.NET 桌面开发）

## 实现方案

沿用已完成章节（04/06）的成熟模式：逐篇读取文章理解知识点，将占位符替换为标准模板结构——中文场景描述标题行 → **MainWindow.xaml：** + ```xml 代码块 → **MainWindow.xaml.cs —— 后台代码：** + ```csharp 代码块。标准参照 public/content/04-controls/button-按钮.md 与 public/content/06-graphics/wpf-图形渲染概述.md。

### 模板规范（硬性）

- 窗口 Background="#0D1117"，面板 #161B22，按钮 #21262D，强调蓝 #58A6FF，文本 #8B949E，成功 #238636，危险 #DA3633
- XAML 中所有 x:Name 与事件处理器必须在 C# 中一一对应，中文注释说明意图
- 每个示例贴合上位机/工控场景（设备启停、参数录入、看板、数据采集等）

### 各小节示例设计要点

- 11.1：控件生命周期用 TextBox 输出 构造→OnInitialized→OnApplyTemplate→Loaded 日志；自定义依赖属性用指示灯控件 Register + PropertyChangedCallback 变色；自定义路由事件用 EventManager.RegisterRoutedEvent + RaiseEvent 冒泡；控件重绘重写 OnRender(DrawingContext) 画仪表 + InvalidateVisual；焦点管理做参数录入界面（TabIndex/Focus()/GotFocus 日志）
- 11.2：DataTemplateSelector 按 IsRunning 选模板；DataTemplate 内按钮用 RelativeSource AncestorType 触发事件；HierarchicalDataTemplate 绑定 站点→产线→设备 三层 TreeView；ItemContainerStyle 交替颜色 + 选中高亮
- 11.3：资源字典组织主题用 MergedDictionaries 合并；动态切换主题运行时 Remove/Add 资源字典实现 Light/Dark；MaterialDesignInXAML + HandyControl 主题定制注明 NuGet 包名
- 11.4：resx 资源文件 + ResourceManager.GetString + CultureInfo 实现中英文切换
- 11.5：AllowDrop + DoDragDrop 设备列表项拖拽；Drop 事件取 DataFormats.FileDrop 显示文件路径；自定义拖拽数据格式用 DataObject 自定义格式
- 11.6：DllImport user32（MessageBox/GetSystemMetrics/SetWindowPos/GetForegroundWindow）封装类，按钮调用演示
- 11.7：materialdesigninxaml、handycontrol（Gauge/StepBar/Tag/Growl）、modernwpf、livecharts2（CartesianChart 实时曲线）、extended-wpf-toolkit（ColorPicker/PropertyGrid），均注明需 NuGet 安装的包名、正确 xmlns 与资源字典引用
- 11.8：Grid 星号（*）比例百分比布局自适应拉伸；Viewbox 整体缩放 Canvas；多屏拼接枚举屏幕分辨率与位置
- 11.9：app.manifest DPI 感知说明 + GetDpiForWindow 显示缩放因子；PerMonitorV2 + DpiChanged 事件动态换算
- 11.10：IsManipulationEnabled + ManipulationStarting/Delta/Completed 平移旋转缩放，方块移动用 TranslateTransform（避免 Canvas.Left 在 StackPanel 失效的坑）

### 执行环境坑位规避

- PowerShell 中文路径乱码：先执行 chcp 65001，不用管道 cat
- 替换内容不得混入 "+" 前缀；meta.json 等大文件用 search_content 而非 read_file
- 每篇完成后 read_lints 确认无新增问题

## 架构设计

本项目为纯前端静态内容站，无后端与运行时架构改动。本次为内容层批量更新，沿用既有文件组织与渲染管线；31 个 Markdown 文件相互独立，按小节目录顺序分批处理，最后统一校验与提交。

## 目录结构

全部为 [MODIFY]，仅替换 [!example] 卡片内部内容，位于 public/content/11-advanced-ui/ 下：

- 11.1（5）：控件生命周期.md、自定义依赖属性.md、自定义路由事件.md、控件重绘onrender.md、焦点管理.md
- 11.2（4）：datatemplateselector-选择器.md、datatemplate-中的事件绑定.md、hierarchicaldatatemplate-层级数据.md、itemcontainerstyle-列表项样式.md
- 11.3（3）：资源字典组织主题.md、动态切换主题.md、materialdesigninxaml-与-handycontrol-主题定制.md
- 11.4（2）：wpf-本地化方案.md、资源文件resx与动态读取.md
- 11.5（3）：控件间拖拽.md、文件拖入.md、自定义拖拽数据格式.md
- 11.6（2）：p-invoke-基础.md、常用-win32-api-封装.md
- 11.7（5）：materialdesigninxaml.md、handycontrol.md、modernwpf.md、livecharts2-图表.md、extended-wpf-toolkit.md
- 11.8（3）：百分比布局策略.md、viewbox-缩放适配.md、多屏适配拼接屏场景.md
- 11.9（2）：dpi-感知模式设置.md、per-monitor-dpi-awareness.md
- 11.10（2）：manipulation-事件.md、触控旋转缩放平移.md

## 校验流程

1. search_content 全局查"待补充实际示例代码"计数为 0
2. git diff --stat 确认仅动 public/content/11-advanced-ui/
3. 检查替换内容无 "^+" 前缀残留
4. read_lints 确认无新增问题
5. 提交信息："11.WPF高级UI开发菜单内容更新"