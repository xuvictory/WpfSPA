---
title: ICommand 接口
section: 05-core-concepts
parent: 5.3 命令系统
---

# ICommand 接口

> [!plain] 白话理解
> `ICommand` 接口就像一个**带锁的按钮**。锁的钥匙是 `CanExecute`——只有满足条件（锁打开）时，按钮才能被按下。按下之后做什么？`Execute` 来定义。最后一个 `CanExecuteChanged` 事件就像"锁状态变了"的通知——当条件从"不满足 → 满足"时，系统喊一声"锁开了！"，所有绑定的按钮自动从灰色变亮。这三个成员就构成了 WPF 命令系统的全部 DNA。

> [!def] 官方定义
> `ICommand` 接口定义在 `System.Windows.Input` 命名空间中，包含三个成员：`bool CanExecute(object? parameter)`——判断命令当前是否可以执行；`void Execute(object? parameter)`——执行命令的业务逻辑；`event EventHandler? CanExecuteChanged`——当 CanExecute 的返回值可能发生变化时触发，UI 元素（如 Button）监听此事件自动更新 `IsEnabled` 状态。ICommand 是纯接口，与 UI 框架解耦——同一个命令对象可以在 WPF、MAUI、Web 项目中复用。

> [!origin] 由来背景
> WPF 的 `ICommand` 接口比 WPF 本身更老——它最早出现在 2005 年 .NET Framework 3.0 的 System.Windows.Input.dll 中。最初的 WPF 设计更多使用 `RoutedCommand`（继承自 ICommand），但 MVVM 模式普及后，开发者发现 RoutedCommand 太重（需要 CommandBinding + RoutedUICommand），于是社区创造了 RelayCommand / DelegateCommand 模式——直接用委托实现 ICommand，零 UI 依赖。这种轻量级 Pattern 后来被微软官方采纳，成为 MVVM 的标准实践。

> [!essentials] 核心要点
> - **三个成员**：Execute、CanExecute、CanExecuteChanged——缺一不可
> - **CanExecute 被频繁调用**：每次 UI 交互后 WPF 都会重新查询
> - **Execute 只做业务逻辑**：不要在里面操作 UI 控件
> - **parameter 来自 CommandParameter**：XAML 中通过 `CommandParameter="..."` 传入
> - **CanExecuteChanged 触发机制**：手动调用 + 自动通过 CommandManager.RequerySuggested

> [!example] 完整示例
>
> 下面是一个对上位机场景的"设备启动命令"——手动实现 ICommand，演示 CanExecute 的状态驱动能力：
>
> **DeviceCommand.cs**——手动实现 ICommand：
 ```csharp
using System;
using System.Windows.Input;

namespace HmiDemo;

/// <summary>
/// 设备操作命令——完整实现 ICommand
/// </summary>
public class DeviceCommand : ICommand
{
    private readonly Func<object?, bool>? _canExecute;
    private readonly Action<object?> _execute;

    public DeviceCommand(Action<object?> execute,
        Func<object?, bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object? parameter)
        => _canExecute?.Invoke(parameter) ?? true;

    public void Execute(object? parameter)
    {
        if (CanExecute(parameter))
            _execute(parameter);
    }

    // 核心：手动触发 CanExecuteChanged，让 UI 刷新
    public event EventHandler? CanExecuteChanged;

    /// <summary>
    /// 当条件变化时，调用此方法通知 UI 重新查询 CanExecute
    /// </summary>
    public void RaiseCanExecuteChanged()
        => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}
 ```
>
> **DeviceViewModel.cs**
 ```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace HmiDemo;

public class DeviceViewModel : INotifyPropertyChanged
{
    private bool _isConnected;
    public bool IsConnected
    {
        get => _isConnected;
        set
        {
            _isConnected = value;
            OnPropertyChanged();
            // 连接状态变了 → CanExecute 可能变了 → 通知 UI
            StartCommand.RaiseCanExecuteChanged();
            StopCommand.RaiseCanExecuteChanged();
        }
    }

    private bool _isRunning;
    public bool IsRunning
    {
        get => _isRunning;
        set
        {
            _isRunning = value;
            OnPropertyChanged();
            StartCommand.RaiseCanExecuteChanged();
            StopCommand.RaiseCanExecuteChanged();
        }
    }

    private string _status = "未连接";
    public string Status
    {
        get => _status;
        set { _status = value; OnPropertyChanged(); }
    }

    // ═══ 两个命令 ═══
    public DeviceCommand StartCommand { get; }
    public DeviceCommand StopCommand { get; }

    public DeviceViewModel()
    {
        StartCommand = new DeviceCommand(
            _ => { IsRunning = true; Status = "运行中"; },
            _ => IsConnected && !IsRunning);
        //                                    ↑ 已连接 + 未运行 → 才能启动

        StopCommand = new DeviceCommand(
            _ => { IsRunning = false; Status = "已停机"; },
            _ => IsConnected && IsRunning);
        //                                    ↑ 已连接 + 运行中 → 才能停止
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
 ```
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:HmiDemo"
        Title="ICommand 接口 — 设备控制" Height="400" Width="550"
        WindowStartupLocation="CenterScreen">

    <Window.DataContext>
        <local:DeviceViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <StackPanel Grid.Row="0">
            <TextBlock Text="电机 M-201 — ICommand 控制"
                       Foreground="#FF6B35" FontSize="16"
                       FontWeight="Bold" Margin="0,0,0,8"/>
            <TextBlock Text="{Binding Status}" Foreground="White"
                       FontSize="20" FontWeight="Bold"
                       FontFamily="Consolas" Margin="0,0,0,8"/>
        </StackPanel>

        <StackPanel Grid.Row="1" Margin="0,10,0,0">
            <!-- IsConnected 切换 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="PLC 连接状态：" Foreground="#AAA"
                               VerticalAlignment="Center" Margin="0,0,10,0"/>
                    <CheckBox IsChecked="{Binding IsConnected}"
                              Content="{Binding IsConnected, StringFormat='已连接={0}'}"
                              Foreground="White"/>
                </StackPanel>
            </Border>

            <!-- 命令按钮——IsEnabled 自动管理 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel>
                    <TextBlock Text="操作命令" Foreground="#AAA"
                               FontSize="12" Margin="0,0,0,8"/>
                    <WrapPanel>
                        <Button Content="▶ 启动电机"
                                Width="120" Height="36" Margin="3"
                                Background="#3FB950" Foreground="White"
                                Command="{Binding StartCommand}"/>
                        <Button Content="■ 停止电机"
                                Width="120" Height="36" Margin="3"
                                Background="#CC2222" Foreground="White"
                                Command="{Binding StopCommand}"/>
                    </WrapPanel>
                </StackPanel>
            </Border>

            <!-- 状态说明 -->
            <Border Background="#0D1117" CornerRadius="6"
                    Padding="10" Margin="0,6">
                <StackPanel>
                    <TextBlock Text="CanExecute 自动控制" Foreground="#D4A017"
                               FontWeight="Bold" FontSize="12"/>
                    <TextBlock Text="• 未连接: 启动和停止都禁用"
                               Foreground="#999" FontSize="11"/>
                    <TextBlock Text="• 已连接 + 未运行: 启动启用, 停止禁用"
                               Foreground="#999" FontSize="11"/>
                    <TextBlock Text="• 已连接 + 运行中: 启动禁用, 停止启用"
                               Foreground="#999" FontSize="11"/>
                </StackPanel>
            </Border>
        </StackPanel>
    </Grid>
</Window>
 ```
>
> 勾选/取消"PLC 连接状态"后，两个按钮自动启用/禁用——这就是 ICommand.CanExecute + CanExecuteChanged 的威力。

> [!scene] 适用场景
> ✅ 所有需要"可用/不可用"状态的操作——通过 CanExecute 控制
> ✅ MVVM 架构中 ViewModel 和 View 的解耦桥梁
> ✅ 同一操作多种触发方式（按钮、菜单、快捷键）
> ✅ 需要根据多个条件动态判断可执行性的复杂操作
> ❌ 永远可用的简单操作——当然也可以用命令，但 Click 事件更直接

> [!pitfall] 常见踩坑
> 坑 1：**CanExecute 返回 false 但 UI 不自动变灰** → 如果没有订阅 `CommandManager.RequerySuggested`，WPF 不会自动重新查询 CanExecute。解决方案：在命令构造函数中订阅 `CommandManager.RequerySuggested += (s, e) => CanExecuteChanged?.Invoke(this, EventArgs.Empty)`。
>
> 坑 2：**在 CanExecute 中做复杂计算导致 UI 卡顿** → CanExecute 在每次鼠标移动、键盘输入后都可能被调用。解决方案：用缓存标志位，只在条件确实变化时才重新计算。
>
> 坑 3：**`RaiseCanExecuteChanged` 在非 UI 线程调用** → WPF 的 CommandManager 要求 CanExecuteChanged 在 UI 线程触发。解决方案：用 `Application.Current.Dispatcher.Invoke(...)` 封送。

> [!best] 最佳实践
> - 在新项目中优先用 RelayCommand/DelegateCommand 而非手动实现 ICommand
> - CanExecute 逻辑尽量用一个布尔属性缓存——如 `canExecute = IsConnected && !IsRunning`
> - 命令的 `Execute` 方法不要直接操作 UI 元素——通过修改 ViewModel 属性驱动 Binding
> - 如果 CanExecute 依赖的属性变化频繁，用 `RaiseCanExecuteChanged()` 手动触发，不要依赖自动轮询

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的设备控制，切换连接状态，观察按钮的自动启用/禁用
> **Lv.2 小试牛刀**：新增一个 `EmergencyStopCommand`——无论是否已连接都能执行，且设为正在运行后自动断开连接
> **Lv.3 融会贯通**：设计一个"多条件联合控制"的设备管理界面——3 个设备各有一个 ICommand，每个命令的 CanExecute 同时依赖连接状态、运行状态和用户权限三个条件

> [!related] 相关知识链接
> - ← 前置知识：什么是命令？
> - → 后续必学：内置命令（ApplicationCommands 等）
> - ⇄ 关联概念：RelayCommand、DelegateCommand、CommandManager
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.icommand
