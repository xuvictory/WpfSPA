---
title: Command 绑定
section: 07-mvvm
parent: 7.3 View 层
---

# Command 绑定

> [!plain] 白话理解
> 按钮的常规写法是 `Click="Start_Click"`，事件代码里再操作控件。命令（Command）是更"高级"的按钮接线方式：**把"按钮被点了要做什么"封装成一个可复用、可判断、可测试的对象。**
> 以急停按钮为例：命令不仅定义"急停时做什么"，还能通过 `CanExecute` 决定"现在能不能按"——没有任何机组在运行时，急停按钮自动置灰；启动一台机组后自动恢复可用。**按钮可用性跟着业务状态走，而不是靠代码到处设置 `IsEnabled`。** 一个命令还能被多个按钮共用（启动 1 号/2 号机组都用 StartCommand），通过参数区分对象。

> [!def] 官方定义
> 命令（Command）是 `System.Windows.Input.ICommand` 接口定义的行为封装，三个成员构成完整语义：
> - **`Execute(object parameter)`**：执行命令的动作（如启动机组）；
> - **`CanExecute(object parameter)`**：返回当前是否可执行，WPF 用它自动控制按钮 `IsEnabled`；
> - **`CanExecuteChanged`**：事件，CanExecute 结果变化时通知界面刷新可用性。
> 常用实现：`RelayCommand`（手写 Action/Func 包装）、`RelayCommand<T>`（带参数）、CommunityToolkit.Mvvm 的 `[RelayCommand]` 源生成器。View 侧通过 `Command="{Binding StartCommand}"` 把按钮与命令关联，通过 `CommandParameter` 传参。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/commanding-overview

> [!origin] 由来背景
> 命令模式（Command Pattern）是 GoF 四大行为模式之一，1990 年代在桌面应用中被广泛用于"把操作封装为对象"（支持撤销、队列、宏）。WPF 设计者把它引入 UI 框架：既然按钮点击就是"操作对象"，何不让按钮直接绑定一个命令对象？于是 `ICommand` 与 `ButtonBase.Command` 应运而生——行为（Execute）、可用性（CanExecute）与触发源（按钮/菜单/快捷键）彻底解耦。MVVM 兴起后，命令成为 ViewModel 向 View 暴露行为的唯一通道，`RelayCommand` 作为极简实现成为事实标准。

> [!essentials] 核心要点
> - **三成员语义**：`Execute`（做什么）、`CanExecute`（能不能做）、`CanExecuteChanged`（可用性变化通知）
> - **绑定两件套**：`Command="{Binding StartCommand}"` + 需要传参时 `CommandParameter="{Binding SelectedDevice}"`
> - **按钮可用性自动化**：WPF 自动调用 `CanExecute` 并订阅 `CanExecuteChanged`，无需手工管理 `IsEnabled`
> - **刷新时机**：业务状态改变后必须触发 `CanExecuteChanged`（`CommandManager.InvalidateRequerySuggested()` 或手动 Raise），否则按钮"卡灰"
> - **命令可测试**：直接 `command.Execute(param)`、断言 `command.CanExecute(param)`，无需起窗口（示例的 EStopCommand 即验证场景）

> [!example] 完整示例
> **Command 绑定演示：三个按钮绑定同一个 ViewModel 的三个命令，并通过 CommandParameter 把"操作对象"传给命令；急停按钮的可用性由 CanExecute 联动：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="Command 绑定" Height="320" Width="400"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Window.DataContext>
>         <local:MainViewModel/>
>     </Window.DataContext>
>     <StackPanel Margin="20">
>         <TextBlock Text="机组操作面板" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="{Binding StatusText}" Foreground="White" FontSize="20"
>                    FontWeight="Bold" Margin="0,15,0,15"/>
>         <!-- Command 绑定到 ViewModel 的命令属性；CommandParameter 传入被操作的设备 -->
>         <Button Content="启动 1 号机组" Command="{Binding StartCommand}"
>                 CommandParameter="1号机组" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White" HorizontalAlignment="Left"/>
>         <Button Content="启动 2 号机组" Command="{Binding StartCommand}"
>                 CommandParameter="2号机组" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White" HorizontalAlignment="Left"/>
>         <!-- CanExecute 返回 false 时按钮自动禁用，无需手动管理 IsEnabled -->
>         <Button Content="急停（停止全部）" Command="{Binding EStopCommand}" Padding="8"
>                 Background="#DA3633" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— ViewModel 与带参数命令：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private bool _anyRunning;
>         private string _statusText = "全部机组已停止";
>
>         public string StatusText
>         {
>             get => _statusText;
>             private set { _statusText = value; OnPropertyChanged(nameof(StatusText)); }
>         }
>
>         // 带参数的命令：RelayCommand<object> 把 CommandParameter 传给 Execute
>         public ICommand StartCommand { get; }
>         public ICommand EStopCommand { get; }
>
>         public MainViewModel()
>         {
>             StartCommand = new RelayCommand<object>(Start);
>             EStopCommand = new RelayCommand<object>(EStop, () => _anyRunning);
>         }
>
>         private void Start(object unit)
>         {
>             _anyRunning = true;
>             StatusText = unit + " 已启动";
>             EStopCommand.RaiseCanExecuteChanged(); // 急停按钮现在可用
>         }
>
>         private void EStop(object parameter)
>         {
>             _anyRunning = false;
>             StatusText = "急停！全部机组已停止";
>             EStopCommand.RaiseCanExecuteChanged();
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // 支持泛型参数的 RelayCommand<T>：Execute(T) 接收 CommandParameter
>     public class RelayCommand<T> : ICommand
>     {
>         private readonly Action<T> _execute;
>         private readonly Func<bool> _canExecute;
>         public RelayCommand(Action<T> execute, Func<bool> canExecute = null)
>         {
>             _execute = execute;
>             _canExecute = canExecute;
>         }
>         public bool CanExecute(object parameter) => _canExecute == null || _canExecute();
>         public void Execute(object parameter) => _execute((T)parameter);
>         public void RaiseCanExecuteChanged() =>
>             CanExecuteChanged?.Invoke(this, EventArgs.Empty);
>         public event EventHandler CanExecuteChanged;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 启停类按钮：启动/停止/急停，可用性跟随设备状态自动置灰/恢复
> ✅ 批量操作：一个命令 `StartCommand` 加 `CommandParameter`（机组编号/选中行）复用于多台设备
> ✅ 带确认的破坏性操作：删除记录、清空报警——命令里弹确认框，UI 层无感知
> ✅ 菜单/工具栏/快捷键三入口触发同一操作：都绑同一个命令，行为一致
> ❌ 纯展示页面：没有用户操作就无需命令，绑定属性即可
> ❌ 一次性的界面微调（如"切换 Tab"）：TabControl 自带事件更直接，为命令而命令是过度设计

> [!pitfall] 常见踩坑
> 坑 1：**CanExecute 结果变了但按钮不更新** → 忘记触发 `CanExecuteChanged`（或没调 `CommandManager.InvalidateRequerySuggested()`），按钮停留在旧状态。状态依赖的 setter 里必须 Raise
>
> 坑 2：**在 CanExecute 里做耗时/副作用操作** → `CanExecute` 会被 WPF 频繁调用（焦点变化、输入、失效刷新），放耗时逻辑会卡界面。CanExecute 应只读状态、快速返回
>
> 坑 3：**命令里直接 new 依赖** → `Execute` 里 `new SerialPort()`，测试无法替换。命令的依赖通过构造函数注入，与 ViewModel 同源（见「icommand-实现relaycommand-系列」）
>
> 坑 4：**参数类型不匹配** → XAML 传 `CommandParameter` 与命令的 `RelayCommand<T>` 泛型不一致时静默不执行。保持参数类型一致，必要时用 `Convert` 转换
>
> 坑 5：**异步命令忘了处理异常** → `async void` 里抛异常直接崩溃。用 `RelayCommand` 的 async 支持包 try/catch，或框架的 `AsyncRelayCommand`

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"Command 绑定"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Command 绑定"
> - → 后续必学：掌握"Command 绑定"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
