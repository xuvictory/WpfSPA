---
title: ScrollViewer 滚动容器
section: 03-layout
parent: 3.8 辅助容器
---

# ScrollViewer 滚动容器

> [!plain] 白话理解
> 你的内容太多了，屏幕装不下怎么办？**ScrollViewer 就是一个"视口"**——它只显示内容的一部分，同时提供滚动条让你查看其余部分。就像你透过一个放大镜看一张大地图，地图本身很大，但你只能看到镜头对准的那一小块区域。在企业上位机中，ScrollViewer 几乎是标配：设备列表可能上百行、日志可能有几千条、工艺流程图可能远超一个屏幕——这些都需要滚动。

> [!def] 官方定义
> ScrollViewer 是 WPF 中的一个内容控件，继承自 ContentControl，用于给内容提供水平和垂直滚动功能。它本身不可见，只呈现子内容和一个或两个 ScrollBar。核心属性包括 `HorizontalScrollBarVisibility` / `VerticalScrollBarVisibility`（控制滚动条显示策略）、`CanContentScroll`（逻辑滚动 vs 物理滚动）、`PanningMode`（触摸平移模式）、`ScrollChanged` 事件等。默认情况下滚动条不显示，只有当内容超出可见区域时才会出现（Auto 模式）。

> [!origin] 由来背景
> 在 WinForms 中，每个控件自己决定是否支持滚动（`AutoScroll = true`），滚动行为和控件耦合在一起。WPF 的 ScrollViewer 采用了"分离关注点"的设计：滚动是一个独立的服务，通过包裹（Decorator 模式）任何内容来实现。这意味着相同的滚动行为可以应用于任何内容——不管是 TextBlock、ItemsControl，还是自定义绘图 Canvas。这种设计非常灵活，但也带来一个问题：嵌套滚动时谁优先？WPF 通过 `CanContentScroll` 和 ScrollViewer 的层级关系来管理。

> [!essentials] 核心要点
> - **四种滚动条显示策略**：`Disabled`（永不显示）、`Auto`（需要时显示，默认）、`Hidden`（不显示但仍可触摸/鼠标滚轮滚动）、`Visible`（始终显示）
> - **CanContentScroll**：`true`=逻辑滚动（按 Item 滚动，适合列表）；`false`=物理滚动（按像素滚动，适合文档/图片）
> - **PanningMode**：控制触摸屏上的平移行为——`None`（禁用）、`HorizontalOnly`、`VerticalOnly`、`Both`、`HorizontalFirst`、`VerticalFirst`
> - **只能包含一个子元素**：和 Border、Viewbox 一样
> - **ScrollChanged 事件**：在滚动偏移变化时触发，常用于"滚动到底部自动加载更多数据"
> - **嵌套 ScrollViewer**：外层的 `CanContentScroll="True"` + 内层的 `CanContentScroll="False"` 可以实现"外层按项滚、内层按像素滚"

> [!example] 完整示例
>
> 下面是一个上位机中典型的**报警日志查看器**：用 ScrollViewer 包裹一个 ItemsControl，实现长列表的物理像素滚动和"滚动到底部自动加载"。
>
> **MainWindow.xaml** — ScrollViewer 报警日志
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="报警日志查看器" Height="500" Width="650"
>         WindowStartupLocation="CenterScreen">
>     
>     <Grid Background="#0D1117">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 标题栏 -->
>         <Border Grid.Row="0" Background="#161B22" Padding="12,10"
>                 BorderBrush="#2A4A6C" BorderThickness="0,0,0,1">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="📋 报警日志"
>                            Foreground="#FF6B35" FontSize="15"
>                            FontWeight="Bold"
>                            VerticalAlignment="Center"/>
>                 <TextBlock x:Name="txtLogCount"
>                            Text=" | 共 0 条"
>                            Foreground="#999" FontSize="12"
>                            VerticalAlignment="Center"
>                            Margin="10,0,0,0"/>
>                 <Button x:Name="btnAddLog"
>                         Content="+ 模拟报警"
>                         Click="BtnAddLog_Click"
>                         Width="90" Height="26"
>                         Background="#FF6B35" Foreground="White"
>                         BorderThickness="0" FontSize="11"
>                         HorizontalAlignment="Right"
>                         Margin="Auto,0,0,0"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- ScrollViewer 包裹日志列表 -->
>         <ScrollViewer x:Name="logScrollViewer"
>                       Grid.Row="1"
>                       VerticalScrollBarVisibility="Auto"
>                       HorizontalScrollBarVisibility="Disabled"
>                       CanContentScroll="False"
>                       PanningMode="VerticalOnly"
>                       ScrollChanged="LogScrollViewer_ScrollChanged">
>             
>             <StackPanel x:Name="logPanel" Margin="8">
>                 <!-- 日志条目由后台动态添加 -->
>             </StackPanel>
>         </ScrollViewer>
>         
>         <!-- 底部工具栏 -->
>         <Border Grid.Row="2" Background="#161B22" Padding="10,6"
>                 BorderBrush="#2A4A6C" BorderThickness="0,1,0,0">
>             <StackPanel Orientation="Horizontal">
>                 <Ellipse x:Name="statusDot" Width="8" Height="8"
>                          Fill="#3FB950" VerticalAlignment="Center"/>
>                 <TextBlock x:Name="txtScrollStatus"
>                            Text=" 准备就绪"
>                            Foreground="#999" FontSize="11"
>                            VerticalAlignment="Center"
>                            Margin="5,0,0,0"/>
>                 <Button x:Name="btnClear" Content="清空日志"
>                         Click="BtnClear_Click"
>                         Width="70" Height="24"
>                         Background="#555" Foreground="White"
>                         BorderThickness="0" FontSize="11"
>                         HorizontalAlignment="Right"
>                         Margin="Auto,0,0,0"/>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```

> **MainWindow.xaml.cs** — 日志动态生成 + 滚动监听
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     private int _logCount;
>     private readonly Random _random = new();
> 
>     public MainWindow()
>     {
>         InitializeComponent();
>         // 启动时预生成几条日志
>         for (int i = 0; i < 5; i++)
>             AddLogEntry();
>     }
> 
>     /// <summary>
>     /// 模拟报警：点击按钮添加一条随机报警日志
>     /// </summary>
>     private void BtnAddLog_Click(object sender, RoutedEventArgs e)
>     {
>         AddLogEntry();
>     }
> 
>     /// <summary>
>     /// 添加一条随机日志到面板
>     /// </summary>
>     private void AddLogEntry()
>     {
>         _logCount++;
> 
>         // 随机报警类型和等级
>         string[] types = { "温度过高", "压力异常", "通信中断", "过载保护",
>                           "急停触发", "液位超限", "振动超标" };
>         string[] levels = { "Info", "Warning", "Error" };
> 
>         string type = types[_random.Next(types.Length)];
>         string level = levels[_random.Next(levels.Length)];
>         DateTime time = DateTime.Now.AddMinutes(-_random.Next(1440));
> 
>         // 根据等级选颜色
>         var levelColor = level switch
>         {
>             "Error" => new SolidColorBrush(Color.FromRgb(204, 34, 34)),   // 红
>             "Warning" => new SolidColorBrush(Color.FromRgb(255, 107, 53)),// 橙
>             _ => new SolidColorBrush(Color.FromRgb(153, 153, 153))        // 灰
>         };
> 
>         // 创建日志条目
>         var border = new Border
>         {
>             Background = new SolidColorBrush(Color.FromRgb(22, 27, 34)),
>             BorderBrush = new SolidColorBrush(Color.FromRgb(42, 74, 108)),
>             BorderThickness = new Thickness(0, 0, 0, 1),
>             Padding = new Thickness(8, 6)
>         };
> 
>         var stack = new StackPanel { Orientation = Orientation.Horizontal };
> 
>         // 时间戳
>         stack.Children.Add(new TextBlock
>         {
>             Text = time.ToString("HH:mm:ss"),
>             Foreground = new SolidColorBrush(Color.FromRgb(136, 136, 136)),
>             FontSize = 12,
>             Width = 70
>         });
> 
>         // 等级标签
>         var levelBorder = new Border
>         {
>             Background = levelColor,
>             CornerRadius = new CornerRadius(2),
>             Padding = new Thickness(6, 1),
>             Margin = new Thickness(6, 0, 6, 0)
>         };
>         levelBorder.Child = new TextBlock
>         {
>             Text = level,
>             Foreground = Brushes.White,
>             FontSize = 10,
>             FontWeight = FontWeights.Bold
>         };
>         stack.Children.Add(levelBorder);
> 
>         // 报警类型
>         stack.Children.Add(new TextBlock
>         {
>             Text = type,
>             Foreground = new SolidColorBrush(Color.FromRgb(224, 224, 224)),
>             FontSize = 12
>         });
> 
>         border.Child = stack;
> 
>         // 添加到面板（最新在上方）
>         logPanel.Children.Insert(0, border);
> 
>         txtLogCount.Text = $" | 共 {_logCount} 条";
>     }
> 
>     /// <summary>
>     /// 监听滚动位置变化
>     /// </summary>
>     private void LogScrollViewer_ScrollChanged(object sender,
>         ScrollChangedEventArgs e)
>     {
>         // 判断是否滚动到底部（容差 5px）
>         bool atBottom = logScrollViewer.VerticalOffset >=
>             logScrollViewer.ScrollableHeight - 5;
> 
>         txtScrollStatus.Text = atBottom
>             ? " 已滚动到底部"
>             : $" 滚动位置: {logScrollViewer.VerticalOffset:F0}px";
>     }
> 
>     /// <summary>
>     /// 清空所有日志
>     /// </summary>
>     private void BtnClear_Click(object sender, RoutedEventArgs e)
>     {
>         logPanel.Children.Clear();
>         _logCount = 0;
>         txtLogCount.Text = " | 共 0 条";
>         txtScrollStatus.Text = " 日志已清空";
>     }
> }
> ```
>
> 这个示例演示了 ScrollViewer 在工业上位机中最核心的用法：
> 1. **物理像素滚动**：`CanContentScroll="False"` 实现平滑像素级滚动
> 2. **滚动事件监听**：`ScrollChanged` 事件实时获取滚动位置
> 3. **滚动条显示策略**：`VerticalScrollBarVisibility="Auto"` 需要时显示，`HorizontalScrollBarVisibility="Disabled"` 禁用水平滚动
> 4. **动态内容**：日志由后台代码动态添加，滚动条自动适应
>
> [!scene] 适用场景
> - ✅ 长列表（报警日志、操作记录、数据归档）
> - ✅ 大图片/大文档的查看器
> - ✅ 超出窗口范围的工艺流程图
> - ✅ 参数配置面板（参数超出窗口高度时自动滚）
> - ✅ 聊天/消息面板（新消息自动滚到底部）
> - ✅ 触摸屏上的平移查看（PanningMode）
> - ❌ 固定高度的一屏内容——滚动条是冗余的
> - ❌ 需要分页而非连续滚动——考虑 DataGrid 的分页模式

> [!pitfall] 常见踩坑
> - **坑1：`CanContentScroll="True"`（默认）导致滚动卡顿感**。逻辑滚动是按"项"而非像素来滚动的，在 StackPanel 这种没有显式 Item 高度的场景下，滚动会跳跃一整行。解决方案：设 `CanContentScroll="False"` 改为物理像素滚动。
> - **坑2：嵌套 ScrollViewer 导致"鼠标滚轮被内层截胡"**。外层滚动到某处，鼠标不小心移到内层区域，滚轮就滚内层了。解决方案：捕获 `PreviewMouseWheel` 事件，手动将滚轮事件转发到外层 ScrollViewer。
> - **坑3：StackPanel 放 ScrollViewer 内所有元素会全部渲染**。10000 条日志 = 10000 个 UIElement，内存爆炸。解决方案：对于大量条目，用 `ItemsControl` + `VirtualizingStackPanel`（虚拟化）。

> [!best] 最佳实践
> - 内容数量 > 100 时，务必使用虚拟化（`VirtualizingStackPanel.IsVirtualizing="True"`）——ScrollViewer 直接嵌套 StackPanel 不会虚拟化，需用 ItemsControl 系列控件
> - 触摸屏场景务必设置 `PanningMode`，否则触摸拖拽无效
> - `HorizontalScrollBarVisibility="Disabled"` 前提是内容不会水平溢出——否则内容会被裁切
> - "滚动到底部"功能用 `ScrollViewer.ScrollToEnd()` 方法，比手动计算 `ScrollableHeight` 更可靠
> - ScrollViewer 内部的子元素应避免设置明确的 `Height`（用 `MaxHeight` 代替），让内容决定滚动范围

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：修改上面的示例，把日志条目的时间戳格式改成 `yyyy-MM-dd HH:mm:ss`，并让"Error"级别的日志条目背景变为深红色半透明
> - **Lv.2 小试牛刀**：实现"自动滚动到底部"功能——新增一个复选框"自动滚动"，勾选后每次添加日志时自动 `ScrollToEnd()`，取消勾选则保持在当前位置
> - **Lv.3 融会贯通**：实现一个高性能日志查看器——将 StackPanel 替换为 `ListBox` + `VirtualizingStackPanel`，用数据绑定（`ObservableCollection<LogEntry>`）驱动，支持 10000+ 条日志流畅滚动

> [!related] 相关知识链接
> - ← 前置：Border 边框容器
> - → 后续：Viewbox 缩放容器
> - ⇄ 关联：ItemsControl + VirtualizingStackPanel — 大量条目时的虚拟化方案
> - ⇄ 关联：PrintDialog — 打印时也可能出现滚动的考虑
> - 📖 官方文档：[ScrollViewer Class (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.scrollviewer)
