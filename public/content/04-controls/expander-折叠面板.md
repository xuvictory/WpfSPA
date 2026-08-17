---
title: Expander 折叠面板
section: 04-controls
parent: 4.7 容器与分组控件
---

# Expander 折叠面板

> [!plain] 白话理解
> Expander 就像设备维护手册里的「折叠附录」：平时收起来，界面只露出一行小标题，不占空间；需要时点一下，里面的高级参数才展开。上位机界面信息密度高，把不常用的「高级设置」「专家参数」收进折叠面板，主界面就清爽了，操作工也不用面对一大片不敢动的选项。

> [!def] 官方定义
> `Expander`（全限定名 `System.Windows.Controls.Expander`）是一个支持展开/收起的内容容器，继承自 `HeaderedContentControl`：`Header` 显示折叠条标题，`Content` 承载展开后显示的内容，`IsExpanded` 属性控制当前展开状态，`ExpandDirection` 指定展开方向（下 / 上 / 左 / 右），并提供 `Expanded` / `Collapsed` 事件。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.expander

> [!origin] 由来背景
> Expander 借鉴了 Windows 资源管理器左侧「展开/折叠」树节点的交互，以及 Office 软件「折叠功能区」的省空间思路。WPF 在 .NET Framework 3.0 中把它固化为独立控件，让开发者不必自己用 ToggleButton + Content 拼一套展开逻辑。上位机场景里「常用参数默认展开、高级参数默认收起」的分层配置界面，由此有了标准实现。

> [!essentials] 核心要点
> - `IsExpanded`：获取 / 设置展开状态，可绑定到 ViewModel 属性持久化用户选择
> - `Header`：折叠条上的标题，可为文本或任意内容
> - `ExpandDirection`：展开方向（`Down` / `Up` / `Left` / `Right`），默认 `Down`
> - `Expanded` / `Collapsed` 事件：状态切换时触发，适合在展开时才加载重量级内容
> - 收起时内容不占布局空间，但控件仍存活（状态不丢）

> [!example] 完整示例
> **高级设置折叠面板演示：Expander 展开/收起、IsExpanded 状态控制与事件：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="折叠面板 - Expander" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <!-- 基本设置：默认展开 -->
>         <Expander Header="基本设置" IsExpanded="True" ExpandDirection="Down"
>                   Background="#161B22" Foreground="White" Margin="0,0,0,10"
>                   BorderBrush="#2A4A6C" BorderThickness="1">
>             <StackPanel Margin="12">
>                 <CheckBox Content="开机自启动采集" IsChecked="True" Margin="0,2" Foreground="#C9D1D9"/>
>                 <CheckBox Content="声光报警" IsChecked="True" Margin="0,2" Foreground="#C9D1D9"/>
>             </StackPanel>
>         </Expander>
>
>         <!-- 高级设置：默认收起，展开时才显示 -->
>         <Expander Header="高级设置（专家模式）" ExpandDirection="Down"
>                   Expanded="OnExpanded" Collapsed="OnCollapsed"
>                   Background="#161B22" Foreground="White"
>                   BorderBrush="#2A4A6C" BorderThickness="1">
>             <StackPanel Margin="12">
>                 <TextBlock Text="采样间隔（ms）：" Foreground="#8B949E"/>
>                 <TextBox x:Name="txtInterval" Text="1000" Margin="0,4,0,0" Padding="4"/>
>                 <TextBlock x:Name="tipText" Foreground="#FF6B35" Margin="0,8,0,0"
>                            TextWrapping="Wrap"/>
>             </StackPanel>
>         </Expander>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnExpanded(object sender, RoutedEventArgs e)
>         {
>             tipText.Text = "提示：高级参数修改后需要重启采集任务生效";
>         }
>
>         private void OnCollapsed(object sender, RoutedEventArgs e)
>         {
>             tipText.Text = "";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 「基本设置」默认展开 + 「高级设置」默认收起的分层配置界面
> ✅ 专家模式参数、调试选项等低频功能收入折叠区，避免干扰日常操作
> ✅ 空间紧张的窗口里收纳辅助说明、操作日志等次要信息
> ✅ 向导式步骤中的「高级选项」：默认收起，需要时展开
> ❌ 需要同时对比多个分组内容时（收起后内容不可见，改用 [groupbox-分组框](groupbox-分组框)）
> ❌ 内容本身需要滚动、条目数量多时（折叠只是隐藏不是条目管理，改用 [listbox-列表框](listbox-列表框)）

> [!pitfall] 常见踩坑
> 坑 1：**Expander 收起后里面数据不刷新** → 现象：展开「高级设置」时输入框显示的还是旧值。原因：`IsExpanded` 只控制可见性，内容在窗口加载时已创建，不会因展开而重新求值。解决：把数据来源改成绑定（更新即同步），或需要「每次展开重新读取」时在 `Expanded` 事件里手动刷新。
> 
> 坑 2：**垂直空间不够，展开内容被挤出窗口** → 现象：Expander 展开后内容超出窗口，看不到下面的部分。原因：`ExpandDirection="Down"` 时内容向下扩展，而容器没有滚动能力。解决：把 Expander 放进 `ScrollViewer`，或限制 `MaxHeight` 让内容内部滚动。
>
> 坑 3：**IsExpanded 绑定后展开状态不受代码控制** → 现象：代码里设置 `expander.IsExpanded = true` 却无效。原因：`IsExpanded` 已绑定到 ViewModel 属性，界面状态被绑定源控制，代码直接赋值会被覆盖。解决：统一通过 ViewModel 属性修改，不要既绑定又直接赋值。

> [!best] 最佳实践
> - 默认展开「高频设置」，收起「低频高级设置」，让主界面一眼可见核心操作
> - 用 `IsExpanded` 绑定 ViewModel 属性，记住用户上次的展开选择
> - 展开方向优先用 `Down`（贴合阅读习惯），侧向展开用于横向空间充裕的场景
> - 折叠条标题写清楚内容用途（如「高级设置（专家模式）」），避免用户不敢点
> - 重量级内容（图表、大表格）等 `Expanded` 事件触发后再创建，提升启动速度

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，点击两个 Expander 的标题观察展开 / 收起动画与提示文字变化
> **Lv.2 小试牛刀**：新增第三个 Expander「报警参数」，默认 `IsExpanded="True"`，放入两个 CheckBox；把示例中 `tipText` 的提示改为在 `Collapsed` 时清空
> **Lv.3 融会贯通**：把 `IsExpanded` 绑定到 ViewModel 的 `bool` 属性，实现「重启程序后记住上次的展开状态」
> **Lv.4 挑战进阶**：实现「展开时才加载」：把重量级内容（如一个 ListBox 绑定 1000 条记录）放入 Expander，首次 `Expanded` 时才初始化数据源，对比直接加载的启动耗时

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[headeredcontentcontrol-带标题内容控件](headeredcontentcontrol-带标题内容控件)」，Expander 是它的子类
> - → 后续必学：本章「[tabcontrol-选项卡](tabcontrol-选项卡)」用页签组织多个分区
> - ⇄ 关联概念：静态分组用「[groupbox-分组框](groupbox-分组框)」，按钮状态见「[togglebutton-切换按钮](togglebutton-切换按钮)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.expander
