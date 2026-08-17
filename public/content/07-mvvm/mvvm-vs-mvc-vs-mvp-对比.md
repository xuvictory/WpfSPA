---
title: MVVM vs MVC vs MVP 对比
section: 07-mvvm
parent: 7.1 MVVM 基础概念
---

# MVVM vs MVC vs MVP 对比

> [!plain] 白话理解
> 三种模式都是"界面、逻辑、数据"的分工方式，区别在"谁说了算"：
> - **MVC**：控制器（Controller）收到用户操作后，去改 Model 再刷新 View。View 是被动展示，Controller 是"指挥员"，但 View 往往还是攥着控件对象不放；
> - **MVP**：Presenter 像"中间人"，View 把事件交给 Presenter 处理，Presenter 再把结果写回 View 的接口。分工比 MVC 清楚，但每对 View/Presenter 都要写接口，样板多；
> - **MVVM**：View 直接"订阅" ViewModel——靠数据绑定和命令自动同步，连"更新 View"这步都省了。ViewModel 完全不认识 View，测试最方便。
> 一句话：**MVC 用代码推数据，MVP 用接口喊话，MVVM 用绑定自动同步。** WPF 自带绑定和命令，所以 MVVM 最省力。

> [!def] 官方定义
> 三种都是**UI 架构模式**（非控件、非框架），核心差异在于"谁负责把 Model 展示到 View"以及"View 与逻辑的耦合方式"：
> - **MVC（Model-View-Controller）**：用户操作 → Controller 修改 Model → Controller 刷新 View。View 可持有 Model，适合 Web 请求-响应模型；
> - **MVP（Model-View-Presenter）**：View 定义接口，Presenter 实现交互逻辑并通过接口驱动 View。View 完全被动，可 mock 接口测试 Presenter；
> - **MVVM（Model-View-ViewModel）**：View 通过数据绑定（`{Binding}`）与命令（`ICommand`）自动同步 ViewModel，无显式"刷新"调用，适合 WPF 等 XAML 技术栈。
> 参考：https://learn.microsoft.com/zh-cn/dotnet/architecture/maui/ 与 Martin Fowler 的 UI 架构模式说明。

> [!origin] 由来背景
> MVC 最早源于 1979 年 Trygve Reenskaug 在 Xerox PARC 为 Smalltalk 提出的思想，是图形界面时代的第一个分层模式，后在 Web 领域发扬光大。MVP 出现在 1990 年代，针对 MVC 中 View 与 Model 纠缠的问题，让 View 只实现接口、逻辑全归 Presenter。2005 年 John Gossman 提出 MVVM，则是借 WPF 数据绑定与命令的东风：既然绑定能自动同步属性、命令能封装行为，干脆让 ViewModel 完全脱离 View 存在，测试性与复用性达到三者最高。**演进主线就是一条：把"界面"与"逻辑"的耦合一层层剥开。**

> [!essentials] 核心要点
> - **MVC 数据流**：用户操作 → Controller → Model → 刷新 View；Controller 常与 View 一一对应，View 可读 Model
> - **MVP 数据流**：View 抛事件 → Presenter 处理 → 调 View 接口更新；View 完全被动，适合需要强测试的场景（如桌面工具）
> - **MVVM 数据流**：View 绑定 ViewModel 属性/命令，INPC 事件驱动刷新，无显式刷新调用
> - **WPF 选型结论**：WPF 自带绑定与命令，MVVM 最贴合；MVP 在无绑定框架（WinForms）下是折中；MVC 更适合 Web
> - **测试性排序**：MVVM ≥ MVP > MVC；View 与 Model 纠缠越少越容易测试

> [!example] 完整示例
> **对比演示：同一个"电机调速"功能。左侧用 MVVM（Slider 绑定属性 + 命令），右侧模拟 MVC（事件处理器直接操作控件），直观体会两种模式的代码组织差异：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MVVM vs MVC vs MVP 对比" Height="380" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="*"/>
>             <ColumnDefinition Width="10"/>
>             <ColumnDefinition Width="*"/>
>         </Grid.ColumnDefinitions>
>
>         <!-- 左侧：MVVM 风格，无任何事件处理器，全靠绑定 -->
>         <Border Grid.Column="0" Background="#161B22" Padding="12" CornerRadius="6">
>             <StackPanel>
>                 <TextBlock Text="MVVM（绑定驱动）" Foreground="#58A6FF" FontWeight="Bold"/>
>                 <TextBlock Text="目标转速（RPM）" Foreground="#8B949E" Margin="0,12,0,4"/>
>                 <TextBlock Text="{Binding TargetRpm}" Foreground="White" FontSize="20" FontWeight="Bold"/>
>                 <Slider Minimum="0" Maximum="3000" Value="{Binding TargetRpm}" Margin="0,8"/>
>                 <Button Content="下发参数" Command="{Binding SendCommand}" Padding="8"
>                         Background="#21262D" Foreground="White" Margin="0,10,0,0"
>                         HorizontalAlignment="Left"/>
>                 <TextBlock Text="{Binding Feedback}" Foreground="#238636" Margin="0,8,0,0"
>                            TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>
>         <!-- 右侧：MVC 风格，控件事件直接由 Controller（此处为后台代码）处理 -->
>         <Border Grid.Column="2" Background="#161B22" Padding="12" CornerRadius="6">
>             <StackPanel>
>                 <TextBlock Text="MVC（事件驱动）" Foreground="#8B949E" FontWeight="Bold"/>
>                 <TextBlock Text="目标转速（RPM）" Foreground="#8B949E" Margin="0,12,0,4"/>
>                 <TextBlock x:Name="MvcRpmText" Foreground="White" FontSize="20" FontWeight="Bold"/>
>                 <Slider x:Name="MvcSlider" Minimum="0" Maximum="3000" Margin="0,8"
>                         ValueChanged="OnMvcSliderChanged"/>
>                 <Button Content="下发参数" Click="OnMvcSendClick" Padding="8"
>                         Background="#21262D" Foreground="White" Margin="0,10,0,0"
>                         HorizontalAlignment="Left"/>
>                 <TextBlock x:Name="MvcFeedback" Foreground="#DA3633" Margin="0,8,0,0"
>                            TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 两种模式的后台实现：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // MVVM 侧：ViewModel 承载状态，界面通过绑定自动同步
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private int _targetRpm;
>         private string _feedback = "等待下发";
>
>         public int TargetRpm
>         {
>             get => _targetRpm;
>             set { _targetRpm = value; OnPropertyChanged(nameof(TargetRpm)); }
>         }
>
>         public string Feedback
>         {
>             get => _feedback;
>             private set { _feedback = value; OnPropertyChanged(nameof(Feedback)); }
>         }
>
>         public ICommand SendCommand { get; }
>         public MainViewModel() => SendCommand = new RelayCommand(Send);
>
>         private void Send()
>         {
>             Feedback = "已下发：" + TargetRpm + " RPM（MVVM 命令执行）";
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         public RelayCommand(Action execute) => _execute = execute;
>         public bool CanExecute(object parameter) => true;
>         public void Execute(object parameter) => _execute();
>         public event EventHandler CanExecuteChanged;
>     }
>
>     public partial class MainWindow : Window
>     {
>         // MVC 侧：Controller 直接操作控件，界面与逻辑耦合在后台代码中
>         private void OnMvcSliderChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             MvcRpmText.Text = ((int)e.NewValue).ToString(); // 直接操作控件
>         }
>
>         private void OnMvcSendClick(object sender, RoutedEventArgs e)
>         {
>             MvcFeedback.Text = "已下发：" + MvcRpmText.Text + " RPM（MVC 事件处理）";
>         }
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel(); // 左侧挂载 ViewModel
>             MvcRpmText.Text = ((int)MvcSlider.Value).ToString();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **MVVM**：WPF/Silverlight/MAUI 等有数据绑定与命令的 XAML 技术栈，上位机界面（监控、控制、参数配置）
> ✅ **MVP**：WinForms 等无内置绑定的技术栈，又想获得可测试性；或团队对绑定不熟、习惯显式调用
> ✅ **MVC**：ASP.NET Web 项目，请求-响应模型天然匹配；WPF 中若只做展示不做交互也可退化为 View 直绑 Model
> ❌ 在 WPF 里硬套 MVC：Controller 手工刷新控件，等于放弃了绑定优势，纯增样板
> ❌ 逻辑极简的单窗体工具：三种模式都嫌重，直接用代码后台最快

> [!pitfall] 常见踩坑
> 坑 1：**WPF 里照搬 Web 的 MVC** → Controller 每步都要手工找控件刷新，绑定和命令全浪费。WPF 项目默认选 MVVM，MVC 只在展示型页面用
>
> 坑 2：**MVP 把 View 接口越写越肥** → 每加一个显示项就加一个接口方法，View/Presenter 同步改。MVP 要控制接口粒度，或改用 MVVM 让绑定承担同步
>
> 坑 3：**对比时把"类库依赖"当成"模式差距"** → 任何模式都能写好代码，关键看数据流方向与耦合点。选型依据是"技术栈是否提供绑定"，而不是"哪个更新潮"
>
> 坑 4：**三种模式混着用还互相纠缠** → 一个页面用 MVP、另一个用 MVVM，共享的 Model 与导航逻辑会变得难以统一。先定全项目基调，特殊情况单独评估

> [!best] 最佳实践
> - WPF 新项目默认 MVVM；只有界面展示（无交互逻辑）的页面可让 View 直接绑定 Model，别为懒而加 Controller
> - 迁移老项目时小步走：先把纯展示窗口改成 MVVM，交互密集的窗口最后处理，每步保持可编译可运行
> - 需要向团队解释模式差异时，画一张"用户操作 → 数据变化 → 界面刷新"的流向图比文字更有效
> - 若 MVP 用在 WinForms：View 接口只暴露"数据"而非"控件"，Presenter 测起来才有意义
> - 决策记录写进项目文档（为什么用 MVVM 而不用 MVP/MVC），避免后人边改边纠结

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，拖动左右两个滑杆，观察 MVVM 侧（绑定自动同步）与 MVC 侧（代码手工同步）在操作上的体感差异
> **Lv.2 小试牛刀**：给 MVC 侧"发送"按钮的反馈文字换个颜色，对比修改 View 与修改 Model/Controller 各自的改动点数量
> **Lv.3 融会贯通**：把示例的 MVC 侧重构为 MVP：定义 `IMvcView` 接口（含显示反馈），Presenter 实现逻辑，后台代码只实现接口
> **Lv.4 挑战**：画一张表，从"数据流方向、View 是否可测、样板代码量、WPF 适配度"四个维度打分，并写一段选型结论

> [!related] 相关知识链接
> - ← 前置知识：「什么是-mvvm」「为什么要用-mvvm」理解 MVVM 的三层结构与收益
> - → 后续必学：「mvvm-各层职责」按选定的 MVVM 落地各层写法
> - ⇄ 关联概念：「inotifypropertychanged-实现」「icommand-实现relaycommand-系列」是 MVVM 侧示例的技术基础
> - 📖 扩展阅读：Martin Fowler《GUI Architectures》与微软《Patterns for WPF Applications》
