---
title: CommunityToolkit.Mvvm（推荐）
section: 07-mvvm
parent: 7.5 主流 MVVM 框架
---

# CommunityToolkit.Mvvm（推荐）

> [!plain] 白话理解
> 手写 MVVM 时最烦的不是业务，而是**样板代码**：每个属性都要"字段 + 属性 + setter 通知"三件套，每个命令都要 `new RelayCommand(...)`。CommunityToolkit.Mvvm 用**源生成器**把这些样板"变出来"：你只写 `[ObservableProperty] private double temperature;`，编译器自动生成 `Temperature` 属性及完整通知代码——**你写的是字段，用的是属性**。
> 类比车间：以前每个报表都要手工排版（写通知代码），现在只要填数据（声明字段），打印模板自动套用（源生成器生成）。它是 .NET Foundation 维护的官方 MVVM 库，也是目前 .NET 生态最推荐的选择。

> [!def] 官方定义
> CommunityToolkit.Mvvm 是 .NET Foundation 维护的**官方 MVVM 工具库**（NuGet 包 `CommunityToolkit.Mvvm`，前身 `Microsoft.Toolkit.Mvvm`），核心 API：
> - `ObservableObject`：通知基类，提供 `SetProperty`/`OnPropertyChanged`
> - `[ObservableProperty]`：**源生成器特性**，作用于字段，编译期自动生成对应属性及通知（含 `partial void OnXxxChanged/OnXxxChanging` 钩子）
> - `[RelayCommand]`：**源生成器特性**，作用于方法，自动生成 `ICommand` 属性（支持泛型、异步 `[RelayCommand] async Task`、`[NotifyCanExecuteChangedFor]`、`[NotifyPropertyChangedFor]`）
> - `WeakReferenceMessenger` / `IMessenger`：弱引用消息总线（`Register`/`Send`/`Unregister`），自动防泄漏
> - `ObservableValidator`：基于 `INotifyDataErrorInfo` 的验证基类（见「数据验证逻辑」）
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/

> [!origin] 由来背景
> 2018 年前后，.NET 社区 MVVM 库呈现碎片化：MVVM Light 进入维护模式、Prism 太重、ReactiveUI 门槛高。微软在 Windows Community Toolkit 旗下孵化出 `Microsoft.Toolkit.Mvvm`，2022 年随社区工具包整体并入 CommunityToolkit，成为 **.NET Foundation 官方维护的 MVVM 库**。
> 它最大的突破是 C# 9 的**源生成器**（Source Generator）：在编译期根据 `[ObservableProperty]` 字段生成属性与通知代码，把"样板代码"从"运行时反射/基类"推进到"编译期生成"——零反射、零运行时开销，智能提示、重命名重构全部可用。从此写 MVVM 从"写三件套"变成"写字段 + 特性"。

> [!essentials] 核心要点
> - **源生成器语法（字段 + 特性）**：`[ObservableProperty] private double temperature;` → 自动生成 `Temperature` 属性；命名规则：小驼峰字段 → 帕斯卡属性
> - **派生属性用 `[NotifyPropertyChangedFor(nameof(...))]`**：温度字段变化时自动通知 `TemperatureText`，不用手写钩子
> - **命令生成 `[RelayCommand]`**：`private void Save()` → 自动生成 `SaveCommand`；`private bool CanSave()` → 自动作为 CanExecute；`[RelayCommand] async Task` → 异步命令
> - **`partial` 关键字必需**：源生成器要求 VM 类与源文件都声明 `partial`（`partial class MainViewModel`），漏了编译报错
> - **弱引用消息**：`WeakReferenceMessenger.Default.Send(new XxxMessage())` + `Register`，订阅者被弱引用，GC 自动回收
> - **验证基类 `ObservableValidator`**：继承后 `ValidateProperty` 触发 `INotifyDataErrorInfo`，配 `[Required]/[Range]` 数据注解（见「数据验证逻辑」）

> [!example] 完整示例
> **CommunityToolkit.Mvvm 风格演示：用 [ObservableProperty] 源生成器风格编写（此例为教学模拟，生产环境请引入 CommunityToolkit.Mvvm 包，属性自动生成通知），设备参数修改即时反映到界面：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="CommunityToolkit.Mvvm 推荐" Height="360" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备参数设置" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="加热温度（℃）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <!-- 使用源生成器风格时，只需绑定 "Temperature"（由 Temperature 字段生成） -->
>         <Slider Minimum="0" Maximum="300" Value="{Binding Temperature}" Margin="0,4"/>
>         <TextBlock Text="{Binding TemperatureText}" Foreground="White" FontSize="22"
>                    FontWeight="Bold" HorizontalAlignment="Center"/>
>         <TextBlock Text="保温时间（分钟）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <Slider Minimum="1" Maximum="120" Value="{Binding KeepMinutes}" Margin="0,4"/>
>         <TextBlock Text="{Binding KeepMinutesText}" Foreground="White" FontSize="22"
>                    FontWeight="Bold" HorizontalAlignment="Center"/>
>         <Button Content="保存参数" Command="{Binding SaveCommand}" Padding="8"
>                 Margin="0,18,0,0" Background="#21262D" Foreground="White"
>                 HorizontalAlignment="Center"/>
>         <TextBlock Text="{Binding SaveText}" Foreground="#238636" Margin="0,10,0,0"
>                    HorizontalAlignment="Center"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— ObservableObject 风格 ViewModel：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // 模拟 CommunityToolkit.Mvvm 的 ObservableObject 基类
>     public abstract class ObservableObject : INotifyPropertyChanged
>     {
>         public event PropertyChangedEventHandler PropertyChanged;
>         protected void SetProperty<T>(ref T field, T value, string name)
>         {
>             field = value;
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>         }
>     }
>
>     public class MainViewModel : ObservableObject
>     {
>         // 生产环境写法：
>         // [ObservableProperty]
>         // private double temperature;      ← 源生成器自动生成 Temperature 属性
>         // [ObservableProperty]
>         // private int keepMinutes;         ← 自动生成 KeepMinutes 属性
>         // [RelayCommand] private void Save() {...}  ← 自动生成 SaveCommand
>         private double _temperature;
>         private int _keepMinutes;
>         private string _saveText = "参数未保存";
>
>         public double Temperature
>         {
>             get => _temperature;
>             set
>             {
>                 SetProperty(ref _temperature, value, nameof(Temperature));
>                 OnPropertyChanged(nameof(TemperatureText));
>             }
>         }
>
>         public int KeepMinutes
>         {
>             get => _keepMinutes;
>             set
>             {
>                 SetProperty(ref _keepMinutes, value, nameof(KeepMinutes));
>                 OnPropertyChanged(nameof(KeepMinutesText));
>             }
>         }
>
>         public string TemperatureText => "加热温度：" + (int)Temperature + " ℃";
>         public string KeepMinutesText => "保温时间：" + KeepMinutes + " 分钟";
>         public string SaveText { get; private set; }
>         public ICommand SaveCommand { get; }
>
>         public MainViewModel() => SaveCommand = new RelayCommand(Save);
>
>         private void Save()
>         {
>             SaveText = "已保存：" + (int)Temperature + " ℃ / " + KeepMinutes + " 分钟";
>             OnPropertyChanged(nameof(SaveText));
>         }
>
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
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 新 WPF 项目首选：官方维护、活跃更新、与 .NET 新特性同步
> ✅ 大量属性 + 派生显示的上位机页面：源生成器让每页省下几十行样板
> ✅ 需要跨 VM 通信且担心泄漏：`WeakReferenceMessenger` 弱引用开箱即用（见「viewmodel-间的通信」）
> ✅ 需要数据验证的窗体：`ObservableValidator` + 数据注解（见「数据验证逻辑」）
> ❌ 需要完整导航 + 模块化的企业级应用：框架不自带导航/容器，需配 `Microsoft.Extensions.DependencyInjection` 或换 Prism（见「prism-企业级框架」）
> ❌ 需要响应式（Rx）数据流：ReactiveUI 提供 `IObservable` 全链路（见「reactiveui-响应式框架」）

> [!pitfall] 常见踩坑
> 坑 1：**漏写 `partial`** → 源生成器要求 `partial class` + `partial` 源文件（C# 9 文件级 partial）。编译报"缺少 partial 修饰符"时先查这两处
>
> 坑 2：**特性加到属性上而不是字段上** → `[ObservableProperty]` 只能作用于字段；加到属性会报 CS0592。写 `[ObservableProperty] private double _temp;` 而不是 `public double Temp { get; set; }`
>
> 坑 3：**手动又写了一遍属性** → 对同一字段再手写同名属性，与生成器冲突（CS0111 重复成员）。要加逻辑就用 `partial void OnXxxChanged(T value)` 钩子，别自己再定义属性
>
> 坑 4：**`[ObservableProperty]` 字段命名混乱** → 生成的属性名按约定从字段名转换；命名不统一（`_temp`/`Temp`/`mTemp`）时属性名不可预期，绑定路径就错。保持 `_camelCase` 或 `camelCase`
>
> 坑 5：**忘了 `[NotifyPropertyChangedFor]`** → 派生属性不同步。用 `[ObservableProperty] [NotifyPropertyChangedFor(nameof(TemperatureText))] private double _temp;` 显式声明依赖

> [!best] 最佳实践
> - **字段全用 `[ObservableProperty]`，不再手写 setter**：让样板从代码里消失；需要联动时用 `partial void OnTemperatureChanged(double value)`
> - **派生依赖集中声明**：`[NotifyPropertyChangedFor]` 把"A 变化要通知 B"写在字段旁，可读性远超散落的 `OnPropertyChanged`
> - **异步命令标配 `[RelayCommand] async Task`**：自动处理执行中禁用与异常；需要取消时 `[RelayCommand] async Task Do(CancellationToken ct)` 自动接入取消令牌（见「icommand-实现relaycommand-系列」）
> - **消息用 `WeakReferenceMessenger` + 强类型消息类**：配合 `Deactivate` 中 `Unregister` 双保险（见「viewmodel-生命周期」）
> - **与 DI 结合**：`Ioc.Default.GetService<T>`（`CommunityToolkit.Mvvm.DependencyInjection`）或直接配 `Microsoft.Extensions.DependencyInjection`（见「di-在-mvvm-中的应用」）
> - **验证用 `ObservableValidator` 而非手写 IDataErrorInfo**：特性注解声明式校验，错误文本集中管理（见「数据验证逻辑」）

> [!practice] 上手练习
> **Lv.1 复现验证**：运行示例，拖动"加热温度"滑块，看大字号温度文本实时跟随；点"保存参数"看保存反馈——全程 VM 代码里没有手写一个 setter 通知（对比「inotifypropertychanged-实现」的手写版）
> **Lv.2 拓展演练**：引入 `CommunityToolkit.Mvvm` NuGet 包，把示例 VM 改为真正的源生成器写法：`[ObservableProperty]` 字段 + `[RelayCommand] Save()`，把 `SaveText` 的更新放进 `partial void OnKeepMinutesChanged` 钩子
> **Lv.3 综合实战**：用 `[RelayCommand]` 实现异步命令：`[RelayCommand] async Task DownloadAsync()` 模拟 2 秒 PLC 下发（`Task.Delay`），执行期间按钮自动禁用；加 `[NotifyCanExecuteChangedFor]` 让"连接未建立时下发置灰"
> **Lv.4 进阶挑战**：用 `WeakReferenceMessenger` 重构一个跨页通信场景（报警广播），验证窗口关闭后订阅 VM 被 GC 回收（弱引用不泄漏）；再用 `ObservableValidator` + `[Range]` 校验加热温度 0~300，写出完整可运行页面

> [!related] 相关知识链接
> - ← 前置知识：[inotifypropertychanged-实现](./inotifypropertychanged-实现.md)（源生成器就是通知样板自动化的产物）；[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（`[RelayCommand]` 生成的是同一接口实现）
> - → 后续必学：[数据验证逻辑](./数据验证逻辑.md)（ObservableValidator 的用法）；[di-在-mvvm-中的应用](./di-在-mvvm-中的应用.md)（VM 的依赖注入装配）
> - ⇄ 关联概念：[viewmodel-间的通信](./viewmodel-间的通信.md)（WeakReferenceMessenger）；[viewmodel-生命周期](./viewmodel-生命周期.md)（订阅退订时机）；[mvvm-light-toolkit](./mvvm-light-toolkit.md)（前代框架对比）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/ （含源生成器语法参考）
