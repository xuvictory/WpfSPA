---
title: UI 虚拟化
section: 13-performance
parent: 13.2 UI 性能优化
---

# UI 虚拟化

> [!plain] 白话理解
> 把 `ListView` 想象成一台"纸质台账"：10 万条报警记录，人一次只能看见一页。**不虚拟化**，就是把 10 万条全部打印出来再翻页，纸堆成山、翻起来卡手；**虚拟化**，就是只打印当前"看得见的那几页"，翻到哪打到哪，台账永远是薄薄一摞。WPF 的 `VirtualizingStackPanel` 就是这台"按需打印"的机器——它只为滚动窗口内可见的条目创建控件，滚走的条目控件被回收复用，所以示例里 10 万条数据滚动依然顺滑。关掉虚拟化试试：一瞬间创建 10 万个控件，内存飙升、滚动像拖着一块铁板。

> [!def] 官方定义
> UI 虚拟化是 WPF 中由 `VirtualizingPanel`（`System.Windows.Controls`）体系提供的列表性能机制：列表容器（`ItemsControl` 及其派生类，如 `ListView`、`ListBox`）只为当前可见范围内的项生成 UI 容器（`ListBoxItem`），并为被滚出视野的项回收/复用容器，使大数据量列表的内存与渲染成本与可见项数量成正比，而非与数据总量成正比。核心 API：`VirtualizingStackPanel.IsVirtualizing`（附加属性，开关虚拟化）、`VirtualizingStackPanel.VirtualizationMode`（`Standard` 逐项回收 / `Recycling` 复用容器）、`ScrollViewer.CanContentScroll`（须为 True 才能启用虚拟化）。注意：`ItemsControl` 默认开启虚拟化，但 `StackPanel`、`WrapPanel`、`Grid` 等普通布局面板不具备虚拟化能力。详见官方文档：[优化 WPF 应用程序性能](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/optimizing-performance-taking-advantage-of-hardware)、[VirtualizingStackPanel](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.virtualizingstackpanel)、[VirtualizingPanel](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.virtualizingpanel)。

> [!origin] 由来背景
> 早期的 WinForms `ListBox` 是"有多少条就建多少行控件"，条目上千就开始明显卡顿，上万直接假死，这是当年做数据列表最头疼的问题之一。WPF 在设计 `ItemsControl` 时吸取教训，引入"容器虚拟化"：只有可见项才创建 `ListBoxItem`，数据量大到 10 万也只是一屏控件的成本。但第一版虚拟化是"滚出视野就销毁容器"，来回滚动频繁创建销毁仍会卡顿，于是后续版本又加入 `VirtualizationMode.Recycling`——滚出去的容器不销毁、直接复用给滚进来的新数据。上位机的报警记录、点位列表动辄十万条，这项机制直接决定了列表页"能用"还是"不能用"。

> [!essentials] 核心要点
> - **前提三件套**：`ScrollViewer.CanContentScroll="True"` + 面板为 `VirtualizingStackPanel` + `IsVirtualizing="True"`，缺一个虚拟化都可能失效
> - **Recycling 优于 Standard**：`Recycling` 复用滚出容器（只换数据），`Standard` 销毁重建，长列表优先选 Recycling
> - **仅 ItemsControl 系有效**：`ListView`/`ListBox`/`DataGrid` 等条目控件才有虚拟化，`StackPanel` 直接放 10 万个子元素照样卡
> - **数据源用集合**：绑定 `List<T>`、`ObservableCollection<T>` 等集合，不要一个元素一个控件地手写
> - **虚拟化只省控件不省数据**：10 万条数据对象本身仍在内存，只是不生成 10 万个 UI 容器

> [!example] 完整示例
> **ListView 大数据虚拟化：10 万条报警记录，开关 VirtualizingStackPanel 对比内存与速度：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="UI 虚拟化" Height="420" Width="620"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15" Background="#161B22" Padding="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <StackPanel Orientation="Horizontal">
>             <Button Content="加载 10 万条报警记录" Click="OnLoad" Padding="8"
>                     Background="#21262D" Foreground="White"/>
>             <CheckBox x:Name="VirtualCheck" Content="启用 UI 虚拟化" IsChecked="True"
>                       Checked="OnVirtualChanged" Unchecked="OnVirtualChanged"
>                       Foreground="#8B949E" Margin="12,0,0,0" VerticalAlignment="Center"/>
>         </StackPanel>
>         <ListView x:Name="AlertList" Grid.Row="1" Margin="0,10,0,10"
>                   ScrollViewer.CanContentScroll="True"
>                   VirtualizingStackPanel.IsVirtualizing="True"
>                   VirtualizingStackPanel.VirtualizationMode="Recycling"
>                   Background="#0D1117" Foreground="#8B949E" BorderBrush="#21262D">
>             <ListView.View>
>                 <GridView>
>                     <GridViewColumn Header="序号" Width="70" DisplayMemberBinding="{Binding Id}"/>
>                     <GridViewColumn Header="时间" Width="130" DisplayMemberBinding="{Binding Time}"/>
>                     <GridViewColumn Header="级别" Width="70" DisplayMemberBinding="{Binding Level}"/>
>                     <GridViewColumn Header="内容" Width="300" DisplayMemberBinding="{Binding Message}"/>
>                 </GridView>
>             </ListView.View>
>         </ListView>
>         <TextBlock x:Name="StatusText" Grid.Row="2" Foreground="#58A6FF" TextWrapping="Wrap"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Diagnostics;
> using System.Linq;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 生成 10 万条报警记录，验证虚拟化下滚动依旧流畅
>         private void OnLoad(object sender, RoutedEventArgs e)
>         {
>             var sw = Stopwatch.StartNew();
>             var alerts = Enumerable.Range(1, 100000).Select(i => new AlertItem
>             {
>                 Id = i,
>                 Time = DateTime.Now.AddSeconds(-i).ToString("HH:mm:ss"),
>                 Level = i % 5 == 0 ? "故障" : "警告",
>                 Message = $"设备 D-{i % 50 + 1} 报警，编号 {i}"
>             }).ToList();
>             sw.Stop();
>             AlertList.ItemsSource = alerts;
>             StatusText.Text = $"生成 100000 条记录耗时 {sw.Elapsed.TotalMilliseconds:F0} ms，" +
>                               "启用虚拟化后滚动时只实例化可见项，内存与渲染开销极小";
>         }
>
>         // 动态切换虚拟化开关
>         private void OnVirtualChanged(object sender, RoutedEventArgs e)
>         {
>             bool on = VirtualCheck.IsChecked == true;
>             VirtualizingStackPanel.SetIsVirtualizing(AlertList, on);
>             VirtualizingStackPanel.SetVirtualizationMode(AlertList, VirtualizationMode.Recycling);
>             StatusText.Text = on
>                 ? "已开启 UI 虚拟化：仅可见项被实例化，10 万条数据流畅滚动"
>                 : "已关闭 UI 虚拟化：将为全部 10 万条记录创建控件，内存剧增、滚动卡顿";
>         }
>     }
>
>     public class AlertItem
>     {
>         public int Id { get; set; }
>         public string Time { get; set; }
>         public string Level { get; set; }
>         public string Message { get; set; }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 报警记录列表：现场 PLC/仪表持续产生报警，一天可累积数万条，虚拟化保证任意时刻滚动流畅（示例即 10 万条）
> ✅ 点位管理界面：设备点位从几千到几十万，一次加载全部会卡死启动页，虚拟化后 10 万点位 1 秒内可滚动
> ✅ 历史曲线数据表格：按帧/按秒采样的历史数据明细查看
> ✅ 日志列表：运行日志长时间累积，几十万行也要能翻到任意位置
> ❌ 固定几十条的下拉选项（虚拟化反而增加复杂度，普通 `ComboBox`/`ListBox` 即可）
> ❌ 需要滚动时保留项状态的场景（虚拟化会回收容器，滚动距离过远时状态需自行保存）

> [!pitfall] 常见踩坑
> 坑 1：**在 Grid/StackPanel 里放大量子元素** → 现象：控件数量几千就开始卡顿，任务管理器内存暴涨 → 原因：普通面板会为每个子元素创建并布局控件，不提供虚拟化 → 解决：改用 `ListView`/`ListBox`/`DataGrid` 并绑定集合（`ItemsSource`）
> 
> 坑 2：**虚拟化"没生效"** → 现象：数据量大了照样卡 → 原因：`ScrollViewer.CanContentScroll` 为 False、或列表被套在自定义面板里，虚拟化静默失效 → 解决：确认三件套齐全（见核心要点），用 Snoop/`VisualTreeHelper` 观察滚动时 `ListBoxItem` 数量是否只有一屏左右
>
> 坑 3：**滚动后数据"串行"、状态错乱** → 现象：Recycling 模式下滚动，行内容闪现错误数据、选中状态错位 → 原因：容器复用后旧状态未清空，或未实现 `INotifyPropertyChanged` 导致绑定未刷新 → 解决：ItemTemplate 内的绑定属性全部走属性通知；`ItemContainerStyle` 里的临时状态在 `PrepareContainerForItemOverride` 中重置

> [!best] 最佳实践
> - 数据量超过 1 万条就直接上虚拟化，且 `VirtualizationMode` 用 `Recycling`，别等卡了再优化
> - 大列表的 `ItemTemplate` 尽量精简：模板越简单，容器创建/复用越快，滚动越跟手
> - 列表默认高度给足、避免列表容器自身频繁改变尺寸（改变尺寸会触发全部可见项重排）
> - 结合分页/按需加载：虚拟化省 UI 成本，分页省数据与传输成本，二者配合上限更高（见 `延迟加载与数据分页`）
> - 用 `VisualTreeHelper` 统计容器数量验证虚拟化是否真正生效（滚动中应始终只有一屏左右的 `ListBoxItem`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，加载 10 万条记录后上下快速滚动，对比"启用/关闭虚拟化"两种状态的流畅度与内存占用（任务管理器观察）
> **Lv.2 小试牛刀**：把 `VirtualizationMode` 改成 `Standard` 再滚动对比，体会容器销毁重建与复用回收的性能差异；在状态栏实时显示当前实例化的 `ListBoxItem` 数量
> **Lv.3 融会贯通**：用 `ObservableCollection` 替代 `List` 作为数据源，实现"每秒追加一条实时报警"的流式列表，验证虚拟化下实时追加依然流畅，并给 ItemTemplate 添加序号、级别、时间的完整展示

> [!related] 相关知识链接
> - ← 前置知识：`listview-列表视图`（虚拟化的载体控件）、`itemscontrol-条目控件`（虚拟化所属体系）、`什么是数据绑定`（数据源绑定方式）
> - → 后续必学：`延迟加载与数据分页`（UI 之外的另一种大数据方案）、`减少视觉树复杂度`（容器更精简的通用手段）
> - ⇄ 关联概念：`大量控件同时可见`（放弃虚拟化的反面教材）、`视觉树与渲染线程`（用 VisualTreeHelper 验证虚拟化）
> - 📖 官方文档：[优化 WPF 应用程序性能](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/optimizing-performance-taking-advantage-of-hardware)、[VirtualizingStackPanel](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.virtualizingstackpanel)、[VirtualizingPanel](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.virtualizingpanel)
