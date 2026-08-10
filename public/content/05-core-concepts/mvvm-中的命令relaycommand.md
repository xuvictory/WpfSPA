---
title: MVVM 中的命令（RelayCommand）
section: 05-core-concepts
parent: 5.3 命令系统
---

# MVVM 中的命令（RelayCommand）

> [!plain] 白话理解
> `RelayCommand` 是 WPF MVVM 开发的"瑞士军刀"——它把 `ICommand` 接口的实现压缩到了**一个类**，你只需要在建构造时传入两个委托：`() => { /* 执行逻辑 */ }` 和 `() => { return /* 能不能执行 */; }`。然后把它作为 ViewModel 的 `public` 属性暴露出去，XAML 中 `<Button Command="{Binding SaveCommand}"/>` 就搞定了。整个 WPF 社区 99% 的 MVVM 项目都在用这个模式，只不过不同项目会根据自己的细微需求给类取不同的名字：RelayCommand、DelegateCommand、ActionCommand、ViewModelCommand——本质完全一样。

> [!def] 官方定义
> `RelayCommand`（又称 `DelegateCommand`）是一个实现了 `ICommand` 接口的通用可复用类。它通过委托（Delegate）来提供 `Execute` 和 `CanExecute` 的实现，避免了为每个命令单独创建子类的繁琐。参数类型可以为泛型 `RelayCommand<T>` 以支持带参数的命令。`CanExecuteChanged` 事件通过订阅 `CommandManager.RequerySuggested` 自动化触发。这个模式最初由 Josh Smith 在 2008 年提出，后来被 Prism、MVVM Light、CommunityToolkit.Mvvm 等主流框架标准化。

> [!origin] 由来背景
> 2008 年 Josh Smith 在 MSDN Magazine 上发表《WPF Apps With The Model-View-ViewModel Design Pattern》，首次提出 RelayCommand 的概念。当时 WPF 社区正苦恼：每个自定义操作都要写一个 `RoutedUICommand` + `CommandBinding` + 两个事件处理器——代码量爆炸。Josh 的方案堪称简洁优雅：一个可以用委托配置的通用 ICommand 类。这个模式很快被 Prism 框架的 `DelegateCommand` 采纳，随后 MVVM Light 的 `RelayCommand` 流行起来，最终微软在 CommunityToolkit.Mvvm（2022）中内置了 `RelayCommandAttribute` 源代码生成器——从手写进化到了自动生成。

> [!essentials] 核心要点
> - **三个变体**：`RelayCommand`（无参数）、`RelayCommand<T>`（带参数）、`AsyncRelayCommand`（异步版）
> - **构造函数注入**：`new RelayCommand(execute, canExecute?)`
> - **CanExecuteChanged 自动监听**：通过 `CommandManager.RequerySuggested` 智能轮询
> - **MVVM 支柱**：命令是 ViewModel → View 的"动作桥接"
> - **CommunityToolkit.Mvvm 内置**：用 `[RelayCommand]` 特性自动生成命令代码

> [!example] 完整示例
>
> 用 RelayCommand 重构一个上位机数据采集面板：
>
> **RelayCommand.cs**——通用实现：
 ```csharp
using System;
using System.Windows.Input;

namespace HmiDemo;

public class RelayCommand : ICommand
{
    private readonly Action<object?> _execute;
    private readonly Func<object?, bool>? _canExecute;

    public RelayCommand(Action<object?> execute,
        Func<object?, bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object? parameter)
        => _canExecute?.Invoke(parameter) ?? true;

    public void Execute(object? parameter) => _execute(parameter);

    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public void RaiseCanExecuteChanged()
        => CommandManager.InvalidateRequerySuggested();
}
 ```
>
> **DataAcquisitionViewModel.cs**——RelayCommand 的使用：
 ```csharp
using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows.Input;

namespace HmiDemo;

public class DataAcquisitionViewModel : INotifyPropertyChanged
{
    private bool _isAcquiring;
    public bool IsAcquiring
    {
        get => _isAcquiring;
        set { _isAcquiring = value; OnPropertyChanged(); }
    }

    private double _temperature;
    public double Temperature
    {
        get => _temperature;
        set { _temperature = value; OnPropertyChanged(); }
    }

    private double _pressure;
    public double Pressure
    {
        get => _pressure;
        set { _pressure = value; OnPropertyChanged(); }
    }

    private string _log = "就绪";
    public string Log
    {
        get => _log;
        set { _log = value; OnPropertyChanged(); }
    }

    // ═══ RelayCommand 用法 ═══
    public ICommand StartAcquireCommand { get; }
    public ICommand StopAcquireCommand { get; }
    public ICommand ClearDataCommand { get; }
    public ICommand CustomParamCommand { get; }

    public DataAcquisitionViewModel()
    {
        // 用法1：简单命令，永不可用时为 null canExecute
        ClearDataCommand = new RelayCommand(_ =>
        {
            Temperature = 0;
            Pressure = 0;
            Log = "[清除] 数据已归零";
        });

        // 用法2：带 CanExecute 条件——采集未运行时才能启动
        StartAcquireCommand = new RelayCommand(_ =>
        {
            IsAcquiring = true;
            Log = "[启动] 开始数据采集...";
            SimulateAcquisition();
        }, _ => !IsAcquiring);  // ← 条件：未在采集中

        // 用法3：条件互补——正在采集中才能停止
        StopAcquireCommand = new RelayCommand(_ =>
        {
            IsAcquiring = false;
            Log = "[停止] 数据采集已终止";
        }, _ => IsAcquiring);  // ← 条件：正在采集中

        // 用法4：带参数的命令
        CustomParamCommand = new RelayCommand(param =>
        {
            string deviceId = param?.ToString() ?? "未知";
            Log = $"[参数化命令] 操作设备: {deviceId}";
        });
    }

    private async void SimulateAcquisition()
    {
        var rng = new Random();
        while (IsAcquiring)
        {
            Temperature = 25 + rng.NextDouble() * 30;
            Pressure = 80 + rng.NextDouble() * 40;
            await Task.Delay(500);
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? n = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
}
 ```
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:HmiDemo"
        Title="RelayCommand — 数据采集面板" Height="450" Width="600"
        WindowStartupLocation="CenterScreen">

    <Window.DataContext>
        <local:DataAcquisitionViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <TextBlock Text="数据采集面板 — RelayCommand 演示"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,12"/>

        <StackPanel Grid.Row="1">
            <!-- 数据显示 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel Orientation="Horizontal">
                    <StackPanel Margin="0,0,30,0">
                        <TextBlock Text="温度" Foreground="#999" FontSize="11"/>
                        <TextBlock Text="{Binding Temperature, StringFormat='{0:F1} °C'}"
                                   Foreground="White" FontSize="24"
                                   FontWeight="Bold" FontFamily="Consolas"/>
                    </StackPanel>
                    <StackPanel>
                        <TextBlock Text="压力" Foreground="#999" FontSize="11"/>
                        <TextBlock Text="{Binding Pressure, StringFormat='{0:F1} bar'}"
                                   Foreground="White" FontSize="24"
                                   FontWeight="Bold" FontFamily="Consolas"/>
                    </StackPanel>
                    <StackPanel Margin="20,0,0,0" VerticalAlignment="Center">
                        <TextBlock Text="状态" Foreground="#999" FontSize="11"/>
                        <TextBlock Foreground="#3FB950" FontWeight="Bold"
                                   Text="{Binding IsAcquiring, StringFormat='采集: {0}'}"/>
                    </StackPanel>
                </StackPanel>
            </Border>

            <!-- 命令按钮 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel>
                    <TextBlock Text="RelayCommand 绑定" Foreground="#AAA"
                               FontSize="12" Margin="0,0,0,8"/>
                    <WrapPanel>
                        <Button Content="▶ 开始采集"
                                Width="100" Height="34" Margin="3"
                                Background="#3FB950" Foreground="White"
                                Command="{Binding StartAcquireCommand}"/>
                        <Button Content="■ 停止采集"
                                Width="100" Height="34" Margin="3"
                                Background="#CC2222" Foreground="White"
                                Command="{Binding StopAcquireCommand}"/>
                        <Button Content="🗑 清除数据"
                                Width="100" Height="34" Margin="3"
                                Background="#161B22" Foreground="#999"
                                BorderBrush="#555"
                                Command="{Binding ClearDataCommand}"/>
                    </WrapPanel>
                </StackPanel>
            </Border>

            <!-- 参数化命令演示 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel>
                    <TextBlock Text="CommandParameter 参数传递"
                               Foreground="#AAA" FontSize="12"
                               Margin="0,0,0,8"/>
                    <WrapPanel>
                        <Button Content="查询 M-101" Width="100" Height="28"
                                Margin="3" Background="#161B22"
                                Foreground="#3FB950" BorderBrush="#3FB950"
                                Command="{Binding CustomParamCommand}"
                                CommandParameter="M-101"/>
                        <Button Content="查询 VFD-01" Width="100" Height="28"
                                Margin="3" Background="#161B22"
                                Foreground="#D4A017" BorderBrush="#D4A017"
                                Command="{Binding CustomParamCommand}"
                                CommandParameter="VFD-01"/>
                        <Button Content="查询 CPU2" Width="100" Height="28"
                                Margin="3" Background="#161B22"
                                Foreground="#CC2222" BorderBrush="#CC2222"
                                Command="{Binding CustomParamCommand}"
                                CommandParameter="CPU2"/>
                    </WrapPanel>
                </StackPanel>
            </Border>
        </StackPanel>

        <Border Grid.Row="2" Background="#161B22" CornerRadius="6"
                Padding="10" Margin="0,8,0,0">
            <TextBlock Text="{Binding Log}" Foreground="#3FB950"
                       FontFamily="Consolas" FontSize="12"/>
        </Border>
    </Grid>
</Window>
 ```
>

> [!scene] 适用场景
> ✅ MVVM 架构中所有操作——按钮点击、菜单选择、快捷键触发
> ✅ 需要 `CanExecute` 动态控制可用性的操作
> ✅ 需要传递参数的命令——`RelayCommand<T>` + `CommandParameter`
> ✅ 异步操作——`AsyncRelayCommand` + `Task`
> ❌ 不需要 MVVM 的简单原型——直接用 Click 事件更省事

> [!pitfall] 常见踩坑
> 坑 1：**用了 RelayCommand 但按钮不灰** → 必须让 `CanExecuteChanged` 被触发。标准做法是订阅 `CommandManager.RequerySuggested`，或用 `CommandManager.InvalidateRequerySuggested()` 手动触发。
>
> 坑 2：**CanExecute 中引用的属性变了但 CanExecute 没重新计算** → `CommandManager.RequerySuggested` 只在 UI 交互时触发。如果属性变化来自后台线程（如 PLC 数据到达），需要手动 `Dispatcher.Invoke(() => CommandManager.InvalidateRequerySuggested())`。
>
> 坑 3：**多个命令共享同一个 ViewModel 状态时 CanExecute 互相没更新** → 开发者在每个 Setter 中只调用了 `RaiseCanExecuteChanged()` 但只针对当前命令。解决方案：在状态变化的 setter 中统一调用 `CommandManager.InvalidateRequerySuggested()`。

> [!best] 最佳实践
> - 直接用 CommunityToolkit.Mvvm 的 `[RelayCommand]` 源代码生成器——不再手写命令类
> - CanExecute 逻辑保持简单——返回一个布尔表达式即可
> - 异步命令用 `AsyncRelayCommand`，自动处理 IsRunning 状态
> - 一个 ViewModel 文件中所有命令集中放在 `#region Commands` 中，便于查找和维护

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的采集面板，点击开始/停止，观察按钮和数据的联动
> **Lv.2 小试牛刀**：新增一个 `ExportCommand`，CanExecute 条件为"采集未运行且有数据"，Execute 中用 Clipboard 导出温度压力值
> **Lv.3 融会贯通**：把现有的所有 Click 事件处理器重构为 RelayCommand + MVVM 模式——View 层零代码

> [!related] 相关知识链接
> - ← 前置知识：自定义命令、ICommand 接口
> - → 后续必学：CommandParameter 参数传递
> - ⇄ 关联概念：AsyncRelayCommand、CommunityToolkit.Mvvm
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/relaycommand
