---
title: Menu 菜单栏
section: 04-controls
parent: 4.8 菜单与工具栏
---

# Menu 菜单栏

> [!plain] 白话理解
> Menu 就是上位机窗口顶部的「命令总目录」：文件、操作、帮助，鼠标一点展开下拉列表，选中某项执行对应命令。和工具栏的一排按钮相比，菜单栏能收纳更多命令且分类清晰——就像设备操作台上的「功能标签页」，把几十个操作按类别归档，想用哪个都能快速找到。

> [!def] 官方定义
> `Menu`（全限定名 `System.Windows.Controls.Menu`）是一个水平放置的顶级菜单容器，继承自 `MenuBase`（`ItemsControl`）：其 `Items` 集合中的 `MenuItem` 可嵌套形成多级菜单，`MenuItem.Header` 显示命令文本，`Icon` 显示图标，`InputGestureText` 显示快捷键提示，命令执行触发 `Click` 事件或 `Command`。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.menu

> [!origin] 由来背景
> 菜单栏源于 20 世纪 80 年代的「下拉菜单」界面范式：苹果 Macintosh 与微软 Windows 都把菜单栏固定为应用窗口顶部的标准组件。WPF 在 .NET Framework 3.0 中提供 `Menu` / `MenuItem`，并引入 `Command` 命令绑定机制——菜单项可以绑定 `RoutedCommand`，与快捷键、工具栏共用同一套命令逻辑。上位机软件功能多、操作路径长，菜单栏正是「分类收纳命令」的行业惯例。

> [!essentials] 核心要点
> - `MenuItem.Header`：命令文本，下划线前缀（`_文件`）定义 Alt 助记键
> - `MenuItem.Click`：菜单项被点击时触发
> - `Command`：绑定 `RoutedCommand`，与快捷键、工具栏共享同一命令逻辑
> - `Icon` / `InputGestureText`：图标与快捷键提示（如 Ctrl+O）
> - `MenuItem` 可嵌套子项，`Separator` 分隔命令分组，`IsEnabled` 控制可用性

> [!example] 完整示例
> **主菜单演示：MenuItem 层级、Icon 图标、InputGestureText 快捷键提示、Click 事件：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="主菜单 - Menu" Height="400" Width="600"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel>
>         <Menu DockPanel.Dock="Top" Background="#161B22" Foreground="White">
>             <MenuItem Header="_文件">
>                 <MenuItem Header="打开工程" Click="OnOpen" InputGestureText="Ctrl+O"/>
>                 <MenuItem Header="保存工程" Click="OnSave" InputGestureText="Ctrl+S"/>
>                 <Separator/>
>                 <MenuItem Header="退出" Click="OnExit" InputGestureText="Alt+F4"/>
>             </MenuItem>
>             <MenuItem Header="_操作">
>                 <!-- 带图标（Emoji 简单示意） -->
>                 <MenuItem Header="启动采集" Click="OnStart">
>                     <MenuItem.Icon><TextBlock Text="▶"/></MenuItem.Icon>
>                 </MenuItem>
>                 <MenuItem Header="停止采集" Click="OnStop">
>                     <MenuItem.Icon><TextBlock Text="■"/></MenuItem.Icon>
>                 </MenuItem>
>             </MenuItem>
>             <MenuItem Header="帮_助">
>                 <MenuItem Header="关于" Click="OnAbout"/>
>             </MenuItem>
>         </Menu>
>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="15" TextWrapping="Wrap"
>                    VerticalAlignment="Top"/>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnOpen(object sender, RoutedEventArgs e) => tipText.Text = "打开工程…";
>         private void OnSave(object sender, RoutedEventArgs e) => tipText.Text = "工程已保存";
>         private void OnStart(object sender, RoutedEventArgs e) => tipText.Text = "数据采集已启动";
>         private void OnStop(object sender, RoutedEventArgs e) => tipText.Text = "数据采集已停止";
>         private void OnExit(object sender, RoutedEventArgs e) => Close();
>         private void OnAbout(object sender, RoutedEventArgs e)
>             => tipText.Text = "设备监控系统 V1.0";
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 主窗口顶部的「文件 / 操作 / 帮助」标准菜单结构
> ✅ 命令数量多、需要按类别收纳的上位机应用
> ✅ 需要快捷键提示与 Alt 助记键的桌面操作习惯
> ✅ 配合工具栏：菜单放全量命令，工具栏放高频命令
> ❌ 界面空间极小、命令只有三五个时（直接用 [button-按钮](button-按钮) 或 [toolbar-工具栏](toolbar-工具栏)）
> ❌ 需要随操作对象动态变化的命令集时（改用 [contextmenu-右键菜单](contextmenu-右键菜单)）

> [!pitfall] 常见踩坑
> 坑 1：**菜单项点击无效，事件不触发** → 现象：点了菜单命令没反应。原因：`MenuItem` 设置了 `Command` 但命令的 `CanExecute` 返回 false，或 `Click` 与 `Command` 混用导致只走命令。解决：二选一——要么用 `Command` + `CommandBinding`，要么用 `Click` 事件，不要同时使用造成混淆。
> 
> 坑 2：**快捷键提示写了但快捷键不生效** → 现象：`InputGestureText="Ctrl+O"` 显示了提示，但按 Ctrl+O 没反应。原因：`InputGestureText` 只是文字提示，真正绑定快捷键要用 `Command` 的 `InputGesture` 或 `KeyBinding`。解决：给命令配置 `KeyBinding`（`Key="O" Modifiers="Control"`），提示与绑定同时配置。
>
> 坑 3：**菜单命令与按钮重复，逻辑难以维护** → 现象：菜单「保存」和工具栏「保存」、Ctrl+S 各写一份代码，改一处忘一处。原因：没有用命令统一。解决：定义 `RoutedCommand`，菜单项、工具栏按钮、快捷键全部绑定同一命令，逻辑只写一处。

> [!best] 最佳实践
> - 菜单结构控制在两级以内，超过两级说明功能组织需要重新设计
> - 命令文本遵循行业习惯：「文件 / 编辑 / 视图 / 操作 / 帮助」
> - 所有菜单项走 `Command` 绑定，用 `CanExecute` 统一控制可用状态
> - 高频命令在菜单和工具栏各放一份，绑定同一命令；低频命令只放菜单
> - 用 `Separator` 把功能相关的命令分成 3~5 个一组，视觉上更易扫读

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，逐项点击各菜单命令观察提示文字变化；按 Alt 键观察下划线助记键
> **Lv.2 小试牛刀**：在「操作」菜单下新增「暂停采集」「恢复采集」两个命令；给「关于」菜单项加 `Icon` 图标
> **Lv.3 融会贯通**：用 `RoutedCommand` 重构「启动采集」：菜单项、工具栏按钮、Ctrl+Shift+S 快捷键绑定同一命令，验证三处入口执行同一逻辑
> **Lv.4 挑战进阶**：实现「最近打开工程」动态菜单：用 `ObservableCollection<string>` 绑定到二级菜单的 `ItemsSource`，程序记录最近打开的 5 个工程并动态生成菜单项

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[button-按钮](button-按钮)」理解点击交互，Menu 是命令的收纳容器
> - → 后续必学：本章「[toolbar-工具栏](toolbar-工具栏)」把高频命令做成快捷按钮
> - ⇄ 关联概念：对象上的右键命令见「[contextmenu-右键菜单](contextmenu-右键菜单)」，菜单项分隔线见「[separator-分隔线](separator-分隔线)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.menu
