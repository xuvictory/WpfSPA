---
title: INotifyPropertyChanged 接口
section: 05-core-concepts
parent: 5.4 数据绑定
---

# INotifyPropertyChanged 接口

> [!plain] 白话理解
> `INotifyPropertyChanged` 是数据绑定的"传声筒"。想象一下：你的 ViewModel 里有个 `Temperature` 属性，PLC 推送了新数据把它从 80 改成了 85。如果不通知 WPF，界面上还是显示 80——因为 WPF 不知道数据变了。`INotifyPropertyChanged` 就是一个约定：你实现了这个接口，每次属性值变化时调用 `PropertyChanged?.Invoke(this, new PropertyChangedEventArgs("Temperature"))`，WPF 收到通知后就自动刷新所有绑定到 `Temperature` 的 UI 元素。这个接口只有一个事件，但它是整个 MVVM 数据驱动架构的发动机。

> [!def] 官方定义
> `INotifyPropertyChanged` 接口定义在 `System.ComponentModel` 命名空间，包含唯一成员：`event PropertyChangedEventHandler? PropertyChanged`。当属性值改变时，需要触发此事件并传入属性名字符串。WPF 绑定系统监听此事件，收到通知后重新获取属性值并刷新 UI。配合 `[CallerMemberName]` 特性可以在 setter 中自动获取属性名，避免字符串硬编码。`ObservableCollection<T>` 是集合版的实现。

> [!origin] 由来背景
> 2002 年 .NET Framework 1.1 引入 `INotifyPropertyChanged`，当时主要用于 WinForms 的数据绑定。但 WinForms 的数据绑定存在致命缺陷——属性路径用字符串拼凑，修改属性名时编译器不报错。WPF 团队在开发 Avalon 时考虑过用 INotifyPropertyChanged 的"强类型版本"（如 `INotifyPropertyChanged<T>`），但为了兼容性和简洁性，仍沿用了字符串传属性名的方案。C# 5.0（2012 年）引入的 `[CallerMemberName]` 特性部分解决了字符串硬编码问题——编译器在编译时自动填入调用方法名。2022 年的 CommunityToolkit.Mvvm 用源代码生成器自动生成 INPC 代码，几乎消灭了样板代码。

> [!essentials] 核心要点
> - **一个事件**：`event PropertyChangedEventHandler? PropertyChanged`
> - **属性名用字符串**：`OnPropertyChanged("Temperature")` 或 `OnPropertyChanged(nameof(Temperature))`
> - **CallerMemberName 省事**：`OnPropertyChanged([CallerMemberName]string? n=null)` → set 中直接调用
> - **绑定自动监听**：WPF Binding 通过 WeakEvent 模式监听 PropertyChanged，防止内存泄漏
> - **依赖属性不需要 INPC**：依赖属性有独立的 `PropertyChangedCallback` 机制

> [!example] 完整示例
>
> 一个数控机床参数面板——用最简洁的 INPC 实现实时数据绑定：
>
> **CncViewModel.cs**
 ```csharp
using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;

namespace HmiDemo;

public class CncViewModel : INotifyPropertyChanged
{
    private double _xAxis;
    public double XAxis
    {
        get => _xAxis;
        set { _xAxis = value; OnPropertyChanged(); }
    }

    private double _yAxis;
    public double YAxis
    {
        get => _yAxis;
        set { _yAxis = value; OnPropertyChanged(); }
    }

    private double _zAxis;
    public double ZAxis
    {
        get => _zAxis;
        set { _zAxis = value; OnPropertyChanged(); }
    }

    private double _spindleSpeed;
    public double SpindleSpeed
    {
        get => _spindleSpeed;
        set
        {
            _spindleSpeed = value;
            OnPropertyChanged();
            // 联动：转速变了，负载和状态跟着更新
            OnPropertyChanged(nameof(Load));
            OnPropertyChanged(nameof(Status));
        }
    }

    // 计算属性——依赖 SpindleSpeed 的变化通知
    public double Load => SpindleSpeed / 20000.0 * 100;
    public string Status => SpindleSpeed switch
    {
        0 => "待机",
        < 8000 => "低速",
        < 15000 => "中速",
        _ => "高速"
    };

    // 模拟数据刷新
    public CncViewModel()
    {
        XAxis = 125.0; YAxis = 80.0; ZAxis = 45.0;
        SpindleSpeed = 10000;
        _ = Simulate();
    }

    private async Task Simulate()
    {
        var rng = new Random();
        while (true)
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                XAxis += (rng.NextDouble() - 0.5) * 2;
                YAxis += (rng.NextDouble() - 0.5) * 1.5;
                ZAxis += (rng.NextDouble() - 0.5) * 1;
                SpindleSpeed += rng.Next(-200, 200);
                // ↑ 每个 setter 都调用 OnPropertyChanged → UI 自动刷新
            });
            await Task.Delay(300);
        }
    }

    // ═══ INotifyPropertyChanged 标准实现 ═══
    public event PropertyChangedEventHandler? PropertyChanged;

    /// <summary>
    /// CallerMemberName 自动获取调用者的属性名
    /// set { _x = value; OnPropertyChanged(); } → 自动传入 "XAxis"
    /// </summary>
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
        Title="INotifyPropertyChanged — CNC 面板" Height="450" Width="650"
        WindowStartupLocation="CenterScreen">

    <Window.DataContext>
        <local:CncViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <VerticalAligntext>
            <TextBlock Text="CNC 数控机床 — INPC 实时数据"
                       Foreground="#FF6B35" FontSize="18"
                       FontWeight="Bold" Margin="0,0,0,4"/>
            <TextBlock Text="{Binding Status, StringFormat='状态: {0}'}"
                       Foreground="#3FB950" FontSize="14"
                       Margin="0,0,0,12"/>
        </StackPanel>

        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="15"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <!-- 坐标轴 -->
            <Border Background="#161B22" CornerRadius="8"
                    Padding="15" Grid.Column="0">
                <StackPanel>
                    <TextBlock Text="坐标轴位置（mm）"
                               Foreground="#3FB950" FontWeight="Bold"
                               Margin="0,0,0,10"/>
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="Auto"/>
                            <ColumnDefinition Width="*"/>
                        </Grid.ColumnDefinitions>
                        <StackPanel>
                            <TextBlock Text="X:" Foreground="#CC2222"
                                       FontWeight="Bold" Margin="0,0,8,0"/>
                            <TextBlock Text="Y:" Foreground="#3FB950"
                                       FontWeight="Bold" Margin="0,0,8,0"/>
                            <TextBlock Text="Z:" Foreground="#D4A017"
                                       FontWeight="Bold"/>
                        </StackPanel>
                        <StackPanel Grid.Column="1">
                            <TextBlock Text="{Binding XAxis, StringFormat='{0:F3}'}"
                                       Foreground="White" FontSize="20"
                                       FontWeight="Bold" FontFamily="Consolas"/>
                            <TextBlock Text="{Binding YAxis, StringFormat='{0:F3}'}"
                                       Foreground="White" FontSize="20"
                                       FontWeight="Bold" FontFamily="Consolas"/>
                            <TextBlock Text="{Binding ZAxis, StringFormat='{0:F3}'}"
                                       Foreground="White" FontSize="20"
                                       FontWeight="Bold" FontFamily="Consolas"/>
                        </StackPanel>
                    </Grid>
                </StackPanel>
            </Border>

            <!-- 主轴 -->
            <Border Background="#161B22" CornerRadius="8"
                    Padding="15" Grid.Column="2">
                <StackPanel>
                    <TextBlock Text="主轴监控" Foreground="#D4A017"
                               FontWeight="Bold" Margin="0,0,0,10"/>
                    <TextBlock Text="转速" Foreground="#999" FontSize="11"/>
                    <TextBlock Text="{Binding SpindleSpeed, StringFormat='{0:F0} RPM'}"
                               Foreground="White" FontSize="28"
                               FontWeight="Bold" FontFamily="Consolas"/>
                    <!-- 计算属性：Load 和 Status 联动 -->
                    <ProgressBar Value="{Binding Load}" Height="14"
                                 Maximum="100" Margin="0,10"
                                 Foreground="#3FB950"
                                 Background="#0D1117"/>
                    <TextBlock Text="{Binding Load, StringFormat='负载: {0:F1}%'}"
                               Foreground="#999" FontSize="12"/>
                    <TextBlock Text="注意：X/Y/Z/SpindleSpeed 实时更新"
                               Foreground="#666" FontSize="11"
                               Margin="0,8,0,0" TextWrapping="Wrap"/>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>
</Window>
 ```
>
> 运行后：X/Y/Z 坐标和主轴转速持续变化——每一次 `OnPropertyChanged()` 调用都自动触发 UI 刷新。

> [!scene] 适用场景
> ✅ 所有 ViewModel 类必须实现 INotifyPropertyChanged——这是 MVVM 铁律
> ✅ PLC/传感器实时数据推到 UI 层——setter 中调用 PropertyChanged
> ✅ 计算属性联动——A 变了同时通知 B 也变了（如 SpindleSpeed → Load/Status）
> ✅ 任何需要"数据变即 UI 变"的场景
> ❌ 只读的静态数据——不需要通知机制

> [!pitfall] 常见踩坑
> 坑 1：**属性值没变也调用了 OnPropertyChanged** → 应加判断 `if (_xAxis == value) return;` 避免无意义的通知。
>
> 坑 2：**后台线程 set 属性 → 跨线程访问 UI 异常** → PropertyChanged 事件在调用线程触发，如果非 UI 线程 set 属性，UI 元素的绑定更新可能跨线程。解决方案：`Application.Current.Dispatcher.Invoke(() => OnPropertyChanged())`。
>
> 坑 3：**属性名写错了字符串** → `OnPropertyChanged("Tempereture")` 多了一个 e，编译通过但绑定不更新。解决方案：用 `nameof()` 或 `[CallerMemberName]`。

> [!best] 最佳实践
> - 用 `[CallerMemberName]` 消除字符串硬编码——`OnPropertyChanged()` 不需要参数
> - 用 CommunityToolkit.Mvvm 的 `[ObservableProperty]` 源代码生成器——连 OnPropertyChanged 都不用写
> - 属性 setter 中先用 `value != _field` 判断再赋值——避免不必要的通知
> - 计算属性联动时额外调用 `OnPropertyChanged(nameof(ComputedProp))`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的 CNC 面板，观察坐标和转速的实时更新
> **Lv.2 小试牛刀**：新增一个 `FeedRate` 属性，用 Slider 双向绑定控制进给率，验证 TwoWay + INPC 的效果
> **Lv.3 融会贯通**：实现一个"报警诊断"页面——5 个设备的诊断数据从后台 Task 持续推送，每个设备有一个 INPC 对象，绑定到独立的卡片的

> [!related] 相关知识链接
> - ← 前置知识：数据绑定基础、DataContext
> - → 后续必学：绑定表达式高级用法
> - ⇄ 关联概念：ObservableCollection、PropertyChangedEventArgs、CallerMemberName
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.inotifypropertychanged
