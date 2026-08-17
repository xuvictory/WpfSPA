---
title: Manipulation 事件
section: 11-advanced-ui
parent: 11.10 触控与手势
---

# Manipulation 事件

> [!plain] 白话理解
> Manipulation 事件是 WPF 给多点触控配备的"**手势翻译官**"：你用手指在屏幕上拖、捏、转，系统把一堆底层触摸点（`Touch`）收进去，翻译成统一的手势增量——平移了多少、缩放了几倍、转了几度，再通过事件告诉你。如果不用它，你得自己跟踪每根手指的坐标去算手势，就像用手工记账代替收银机。对上位机来说，越来越多工位用触摸一体机代替鼠标键盘（车间环境防水防尘、戴手套也点得动），示例用 `IsManipulationEnabled="True"` 开启手势，订阅 `ManipulationStarting/Delta/Completed` 三个事件，用 `TranslateTransform` 让"1# 泵"设备方块跟着手指走，还顺手做了边界约束防止拖出触控区。

> [!def] 官方定义
> Manipulation 事件是 `UIElement` 上为处理多点触控手势定义的一组路由事件，前提是先设置 `IsManipulationEnabled="True"`。事件序列为：`ManipulationStarting`（手势开始，设置 `e.ManipulationContainer` 定义坐标容器）→ `ManipulationStarted` → `ManipulationDelta`（手势进行中，多次触发，`e.DeltaManipulation` 携带本次增量，`e.CumulativeManipulation` 携带累计值）→ `ManipulationInertiaStarting`（惯性阶段）→ `ManipulationCompleted`（结束）。`ManipulationDeltaEventArgs.DeltaManipulation` 为 `ManipulationDelta` 结构，含 `Translation`（Vector，平移）、`Scale`（Vector，缩放）、`Rotation`（double，旋转角度）、`Expansion`（Vector，缩放像素量）。各事件参数类型见 [ManipulationDeltaEventArgs](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.manipulationdeltaeventargs)（注意：官方 API 拼写为 Manipulation）。详见官方文档：[UIElement.ManipulationStarting](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.uielement.manipulationstarting)、[Manipulation 概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/manipulation-overview)。

> [!origin] 由来背景
> Windows 7 是首个系统级支持多点触控的桌面 Windows：驱动层提供 `WM_TOUCH`（原始触点）与 `WM_GESTURE`（系统预置手势）两类消息，前者信息全但计算量大、后者省事但只支持微软预置的平移/缩放/旋转，自定义性差。WPF 4（2010 年）在两者之上设计了 Manipulation 管线：把所有触点合成一个"流"，逐步累加平移/缩放/旋转增量，还内置惯性引擎（`ManipulationInertiaStarting`，松手后按初速度继续滑动并逐渐减速，源自 Windows Phone 的交互习惯）。对上位机而言，触控从"实验室玩具"变成"车间标配"发生在 Win8/Win10 触屏一体机普及之后——操作员戴手套、双手并用、不能依赖鼠标滚轮，Manipulation 提供的"单指拖、双指捏"正是这类场景的标准交互语言。

> [!essentials] 核心要点
> - **前提开关**：目标元素必须设 `IsManipulationEnabled="True"`，否则事件不触发（示例设备方块即开启）
> - **事件序列**：`ManipulationStarting` → `ManipulationStarted` → `ManipulationDelta`（多次）→ （可选 `ManipulationInertiaStarting`）→ `ManipulationCompleted`
> - **容器坐标**：`ManipulationStartingEventArgs.ManipulationContainer` 指定手势坐标参照物（示例设为 `this` 窗口），不设置则增量坐标会"漂"
> - **增量 vs 累计**：`e.DeltaManipulation`（本次增量）用于累加变换；`e.CumulativeManipulation`（手势累计）用于判断总量/阈值
> - **增量四件套**：`DeltaManipulation.Translation`（平移）、`Scale`（缩放）、`Rotation`（旋转度）、`Expansion`（缩放像素）
> - **位置记录**：示例用 `TranslateTransform.X/Y` 记录位置——`Canvas.Left/Top` 只在 Canvas 容器生效，Grid/Border 里必须用变换

> [!example] 完整示例
> **触控面板拖移演示：给方块设置 IsManipulationEnabled，订阅 ManipulationStarting / ManipulationDelta / ManipulationCompleted，用 TranslateTransform 实现手指拖动（注意：Canvas.Left 在非 Canvas 容器中不生效，故用变换实现）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Manipulation 事件 - 触控拖移" Height="440" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="触控拖移：在方块上按住并拖动（Manipulation 事件）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold" TextWrapping="Wrap"/>
>         <!-- 触控区域 -->
>         <Border Grid.Row="1" Margin="0,12,0,0" Background="#161B22"
>                 BorderBrush="#21262D" BorderThickness="1" CornerRadius="6" ClipToBounds="True">
>             <Grid>
>                 <!-- 可拖动的设备图标方块：IsManipulationEnabled 是触控手势的前提 -->
>                 <Border x:Name="DeviceBlock" Width="110" Height="70"
>                         Background="#1F3A5F" BorderBrush="#58A6FF" BorderThickness="1"
>                         CornerRadius="8" HorizontalAlignment="Left" VerticalAlignment="Top"
>                         RenderTransformOrigin="0.5,0.5"
>                         IsManipulationEnabled="True"
>                         ManipulationStarting="OnManipStarting"
>                         ManipulationDelta="OnManipDelta"
>                         ManipulationCompleted="OnManipCompleted">
>                     <Border.RenderTransform>
>                         <!-- 用变换记录位置：Canvas.Left/Top 只在 Canvas 里有效 -->
>                         <TranslateTransform x:Name="BlockMove"/>
>                     </Border.RenderTransform>
>                     <StackPanel HorizontalAlignment="Center" VerticalAlignment="Center">
>                         <TextBlock Text="1# 泵" Foreground="White" FontSize="16"
>                                    FontWeight="Bold" HorizontalAlignment="Center"/>
>                         <TextBlock Text="拖动我" Foreground="#8B949E" FontSize="11"
>                                    HorizontalAlignment="Center"/>
>                     </StackPanel>
>                 </Border>
>             </Grid>
>         </Border>
>         <TextBlock x:Name="StatusText" Grid.Row="2" Foreground="#8B949E" Margin="0,10,0,0"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Input;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 手势开始：把当前位移量作为累加的起始基准，避免跳变
>         private void OnManipStarting(object sender, ManipulationStartingEventArgs e)
>         {
>             e.ManipulationContainer = this;
>             e.Handled = true;
>         }
>
>         // 手势进行中：把累计位移写入 TranslateTransform，实现跟随手指移动
>         private void OnManipDelta(object sender, ManipulationDeltaEventArgs e)
>         {
>             BlockMove.X += e.DeltaManipulation.Translation.X;
>             BlockMove.Y += e.DeltaManipulation.Translation.Y;
>
>             // 边界约束：把方块限制在触控区域内
>             double maxX = ((FrameworkElement)((Border)sender).Parent).ActualWidth - ((Border)sender).ActualWidth;
>             double maxY = ((FrameworkElement)((Border)sender).Parent).ActualHeight - ((Border)sender).ActualHeight;
>             BlockMove.X = System.Math.Max(0, System.Math.Min(BlockMove.X, maxX));
>             BlockMove.Y = System.Math.Max(0, System.Math.Min(BlockMove.Y, maxY));
>
>             StatusText.Text = $"位置：({BlockMove.X:F0}, {BlockMove.Y:F0})";
>             e.Handled = true;
>         }
>
>         // 手势结束
>         private void OnManipCompleted(object sender, ManipulationCompletedEventArgs e)
>         {
>             StatusText.Text = $"拖移结束，落点：({BlockMove.X:F0}, {BlockMove.Y:F0})";
>             e.Handled = true;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 车间触摸一体机工位：操作员戴手套直接拖拽设备图标、调整工艺参数滑块（示例场景）
> ✅ 设备流程图画布：手指拖动设备节点改变布局，比鼠标滚轮+拖拽更直观
> ✅ 触屏点检 / 巡检程序：勾选、拖动、翻页全用手势，避免鼠标在防水屏上难操作
> ✅ 演示大屏 / 会议白板：多指手势快速缩放、平移视图
> ❌ 纯鼠标键盘的办公场景（Manipulation 只在触控输入下触发，鼠标拖动请用普通鼠标事件）
> ❌ 需要精确到像素的微调操作（手指粗，建议加磁性吸附或步进微调）

> [!pitfall] 常见踩坑
> 坑 1：**忘了 `IsManipulationEnabled="True"`，事件一个都不触发** → 现象：手指拖方块毫无反应，但鼠标拖动正常 → 原因：Manipulation 管线默认关闭，未开启则触摸被当作普通鼠标事件 → 解决：在要响应手势的元素（或其容器）上显式设置该属性（示例在 `DeviceBlock` 上）
> 
> 坑 2：**不设置 `ManipulationContainer`，位移量"漂移"** → 现象：方块拖到一半会突然跳一下，或越拖越慢 → 原因：容器默认是手势源自身，增量坐标基准随元素位置变化 → 解决：在 `ManipulationStarting` 里 `e.ManipulationContainer = this;`（示例即此写法），基准固定为窗口
>
> 坑 3：**用 `Canvas.Left/Top` 记录位置，在 Grid/Border 里不生效** → 现象：拖方块时 `Canvas.Left` 赋值了但视觉不动 → 原因：`Canvas.Left` 是附加属性，只有 Canvas 容器读取它 → 解决：用 `RenderTransform` 的 `TranslateTransform` 记录位置（示例 `BlockMove`），需要边界约束时读取 `ActualWidth/ActualHeight` 计算
>
> 坑 4：**手指与按钮点击冲突** → 现象：手势作用区域里的按钮，点击经常没反应或误触发 → 原因：手势与点击事件争抢输入，`Handled` 没设置好 → 解决：手势逻辑后设 `e.Handled = true;`（示例每个事件处理都设置），需要按钮响应的地方改挂手势到父容器而非按钮本身

> [!best] 最佳实践
> - 手势统一从"父容器"接收、把 `ManipulationContainer` 设为窗口或画布，子元素只负责展示，避免多个元素各自开手势互相抢
> - 位置一律用 `RenderTransform` 记录，配合 `ActualWidth` 做边界约束（示例模式），并处理 `ClipToBounds="True"` 防视觉溢出
> - 需要惯性时在 `ManipulationInertiaStarting` 里设置 `TranslationBehavior.InitialVelocity` 与 `DesiredDeceleration`（速度用 `e.InitialVelocities.LinearVelocity`）
> - 触控热区要够大：按钮、拖拽块尺寸建议 ≥ 48×48 DIP（手指点按），并预留误触撤销/复位入口
> - 手势阈值：`ManipulationStarted` 前可设最小移动距离，防止轻微抖动误触发拖动

> [!practice] 上手练习
> **Lv.1 照猫画虎**：触屏或触控模拟器运行示例，拖动"1# 泵"方块观察跟随与边界约束；把 `IsManipulationEnabled` 改成 False 对比事件失效现象
> **Lv.2 小试牛刀**：订阅 `ManipulationInertiaStarting`，设置 `TranslationBehavior.InitialVelocity = e.InitialVelocities.LinearVelocity; DesiredDeceleration = 0.002;`，实现松手后滑块惯性滑动
> **Lv.3 融会贯通**：把示例扩展成"设备列表拖拽排序"：多个设备方块纵向排列，拖动到某位置后交换数据源（结合 `datatemplate-中的事件绑定` 与 `itemcontainerstyle-列表项样式`）
> **Lv.4 拆层挑战**：封装 `DragCanvas` 用户控件（任意子元素可拖、自动边界、可选惯性、双击复位），把拖拽能力沉淀成可复用组件，并在 MVVM 中通过附加行为接入 ViewModel

> [!related] 相关知识链接
> - ← 前置知识：`datatemplate-中的事件绑定`（触控手势作用在数据模板内元素）、`自定义路由事件`（Manipulation 事件本质是路由事件）
> - → 后续必学：`触控旋转缩放平移`（在 Manipulation 基础上叠加双指缩放/旋转）
> - ⇄ 关联概念：`itemcontainerstyle-列表项样式`（拖拽排序的视觉反馈）、`p-invoke-基础`（底层 `WM_TOUCH`/`WM_GESTURE`）
> - 📖 官方文档：[Manipulation 概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/manipulation-overview)、[UIElement.ManipulationDelta](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.uielement.manipulationdelta)、[ManipulationDeltaEventArgs](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.manipulationdeltaeventargs)
