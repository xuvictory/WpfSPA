---
name: 完成04-controls章节示例代码待办
overview: 为"4. 控件体系"章节（public/content/04-controls/）下全部 48 篇文章补齐 [!example] 完整示例中的实际 WPF 示例代码，替换"📝 待补充实际示例代码"占位，使每篇文章都包含可运行的 XAML + C# 示例。
todos:
  - id: fill-controls-4-1-to-4-3
    content: 补齐 4.1-4.3 子分组 16 篇文章的[!example]块：内容模型、按钮类、文本类控件示例
    status: completed
  - id: fill-controls-4-4-to-4-6
    content: 补齐 4.4-4.6 子分组 13 篇文章的[!example]块：选择类、范围类、日期与信息显示控件示例
    status: completed
  - id: fill-controls-4-7-to-4-9
    content: 补齐 4.7-4.9 子分组 12 篇文章的[!example]块：容器分组、菜单工具栏、装饰辅助控件示例
    status: completed
  - id: fill-controls-4-10-to-4-11
    content: 补齐 4.10-4.11 子分组 7 篇文章的[!example]块：对话框交互、用户控件与自定义控件示例
    status: completed
  - id: verify-controls-chapter
    content: 校验 04-controls 全部 48 篇无"待补充实际示例代码"占位残留，示例格式与已完成章节一致
    status: completed
    dependencies:
      - fill-controls-4-1-to-4-3
      - fill-controls-4-4-to-4-6
      - fill-controls-4-7-to-4-9
      - fill-controls-4-10-to-4-11
---

## 用户需求

完成目录"4. 控件体系"菜单下的待办事项，即补齐该章节全部文章的示例代码内容。

## 产品概述

本项目为 WPF 上位机开发学习平台（Vite 静态站点），课程文章存放在 `public/content/04-controls/` 下。经核查，"4. 控件体系"共 10 个子分组、48 篇文章，每篇文章的 `[!example] 完整示例` 块均为同一占位模板（"待补充实际示例代码"），属于未完成的待办项；其他已完成章节（如 02-xaml、03-layout）的同类占位均已填充完毕。

## 核心功能

- 为 48 篇文章逐一填充完整示例代码，覆盖：控件内容模型、按钮类、文本类、选择类、范围类、日期与信息显示、容器与分组、菜单与工具栏、装饰与辅助、对话框与交互、用户控件与自定义控件 11 类主题
- 每篇示例贴合 WPF 上位机开发/设备监控/工业自动化场景，包含可运行的 XAML（MainWindow.xaml）与 C# 后台代码（MainWindow.xaml.cs）
- 保持文章其余 9 个 Callout 块（白话理解、官方定义、由来背景、核心要点、适用场景、常见踩坑、最佳实践、上手练习、相关知识链接）不变，仅替换 `[!example]` 块内容
- 最终确保 04-controls 目录下无"待补充实际示例代码"占位残留，格式与已完成章节保持一致

## 技术栈说明

- 本任务为纯内容编写任务，无需修改站点代码（src/、styles/、meta.json 均不动）
- 只操作 `public/content/04-controls/` 下的 48 个 Markdown 文件，仅替换 `[!example] 完整示例` 块

## 示例编写规范

### 内容结构（对齐已完成章节，如 02-xaml/mainwindowxaml-详解.md）

```
> [!example] 完整示例
> **<结合上位机场景的一句话描述>：**
>
> **MainWindow.xaml：**
> ```xml
> <Window ...> ... </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows; ...
> ```
```

### 各主题示例要点

- **内容模型类**（ContentControl/HeaderedContentControl/ItemsControl 等）：演示 Content 可放任意对象、Header+Content 组合、Items/ItemsSource 数据源绑定，用设备列表、设备详情面板作场景
- **按钮类**：Click 事件、IsDefault/IsCancel、Command、IsChecked、GroupName 三态，场景如设备启停、模式切换、报警确认
- **文本类**：Text/TextWrapping/Inlines、AcceptsReturn/MaxLength/Selection、PasswordChar/SecurePassword、FlowDocument，场景如日志显示、参数输入、登录窗口
- **选择类**：ItemsSource、SelectedItem/SelectedValue、SelectionMode、DisplayMemberPath、ItemTemplate、GridView 列定义与排序，场景如设备/通道/参数下拉选择、报警列表
- **范围类**：Minimum/Maximum/Value、TickFrequency、IsSnapToTickEnabled、IsIndeterminate，场景如参数调节滑块、采集进度、批量处理进度
- **日期信息显示**：SelectedDate、BlackoutDates、Stretch、MediaElement 控制、Popup 放置、ToolTip 自定义，场景如生产计划日期、媒体回放、弹窗提示
- **容器分组类**：TabControl 多标签、GroupBox 参数分组、Expander 折叠、Frame 导航，场景如设备配置页、多页面导航
- **菜单工具栏类**：MenuItem/Icon/InputGestureText/Command、ContextMenu 右键、ToolBarTray、StatusBarItem，场景如主菜单、数据网格右键、状态栏实时信息
- **装饰辅助类**：Separator、GridSplitter 拖拽分栏、InkCanvas 手写签名、WebBrowser（注明需 .NET Framework 或 WPF 兼容模式）
- **对话框类**：MessageBox.Show 重载、OpenFileDialog/SaveFileDialog 的 Filter/InitialDirectory/ShowDialog 返回值判断、选择文件夹（注明 WPF 原生无此控件，需 WinForms 或第三方库）
- **自定义控件类**：UserControl 创建步骤与依赖属性暴露、CustomControl 的 Themes/Generic.xaml 与 OnApplyTemplate、UserControl vs CustomControl 综合对比示例

### 质量要求

- 代码语法正确、可直接编译运行；使用 WPF 标准命名空间与 API
- 每个示例必须有 XAML 与 C# 后台代码两部分（对话框类以 C# 为主、配少量 XAML）
- 保留 Markdown 引用前缀 `> ` 与代码围栏缩进，与原文格式一致；不动文章其他内容