---
title: Binding 核心属性
section: 05-core-concepts
parent: 5.4 数据绑定
---

# Binding 核心属性

> [!plain] 白话理解
> `Binding` 标记扩展就像一个"管道工"——它要装一根管道把数据从源头引到目的地，所以要告诉它：**从哪来**（Source）、**取什么**（Path）、**怎么流**（Mode）、**何时接收**（UpdateSourceTrigger）、**格式是什么**（StringFormat）、**如果数据为空怎么办**（FallbackValue）。这六个属性是 Binding 最核心的配置项。理解了它们，你就能让数据像水一样在 UI 和数据层之间自由流动。

> [!def] 官方定义
> `Binding` 类的核心属性包括：`Path`（绑定路径，指源对象的哪个属性）、`Source`（显式指定绑定源对象）、`ElementName`（绑定到另一个 XAML 元素）、`RelativeSource`（相对源，如 Self/TemplatedParent/FindAncestor）、`Mode`（绑定模式，OneWay/TwoWay/OneTime/OneWayToSource/Default）、`UpdateSourceTrigger`（双向绑定中源更新的触发时机，Default/LostFocus/PropertyChanged/Explicit）、`StringFormat`（格式化输出）、`FallbackValue`（绑定失败时的默认值）、`TargetNullValue`（数据为 null 时的显示值）、`Delay`（延迟更新，适合搜索框防抖）。

> [!origin] 由来背景
> WPF 1.0 的 Binding 类只有 Path、Source、Mode 这几个核心属性。随着实际项目的使用，开发者提出了一系列需求：绑定失败时不要显示空字符串（FallbackValue）、格式化数字为百分比（StringFormat）、搜索框频繁变化要延迟处理（Delay）。微软在 .NET 3.5 SP1 中加入了 StringFormat 和 TargetNullValue，在 .NET 4.0 中加入了 Delay。这些属性看似零散，但每一个都解决了某个真实的开发痛点。

> [!essentials] 核心要点
> - **Path**：最核心的属性，`{Binding Speed}` 就是 `Path=Speed`
> - **Mode**：`TwoWay` 双向同步、`OneWay` 单向（默认值由目标属性的 FrameworkPropertyMetadata 决定）
> - **UpdateSourceTrigger**：控制何时把 UI 改变写回数据源，`PropertyChanged` 实时写，`LostFocus` 失焦写
> - **StringFormat**：XAML 端格式化，`{Binding Price, StringFormat='¥{0:F2}'}`
> - **FallbackValue**：绑定的安全网，`{Binding Value, FallbackValue=0}`
> - **Delay**：防抖利器，`{Binding SearchText, Delay=300}`

> [!example] 完整示例
>
> 一个上位机参数配置表，集中展示 Binding 的六个核心属性：
>
> **ConfigViewModel.cs**
 ```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace HmiDemo;

public class ConfigViewModel : INotifyPropertyChanged
{
    private string _deviceId = "M-101";
    public string DeviceId
    {
        get => _deviceId;
        set { _deviceId = value; OnPropertyChanged(); OnPropertyChanged(nameof(FullPath)); }
    }

    private double _targetTemp = 85.0;
    public double TargetTemp
    {
        get => _targetTemp;
        set { _targetTemp = value; OnPropertyChanged(); }
    }

    private double _alarmThreshold = 95.0;
    public double AlarmThreshold
    {
        get => _alarmThreshold;
        set { _alarmThreshold = value; OnPropertyChanged(); }
    }

    public string? _operator;
    public string? Operator
    {
        get => _operator;
        set { _operator = value; OnPropertyChanged(); }
    }

    public string FullPath => $"//Plant/Line2/{DeviceId}";

    private string _searchText = "";
    public string SearchText
    {
        get => _searchText;
        set { _searchText = value; OnPropertyChanged(); }
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
        Title="Binding 核心属性" Height="550" Width="700"
        WindowStartupLocation="CenterScreen">

    <Window.DataContext>
        <local:ConfigViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <TextBlock Text="Binding 核心属性演示 — 设备参数配置"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,12"/>

        <ScrollViewer Grid.Row="1">
            <StackPanel>

                <!-- 属性1：Path（最基本） -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="▶ Path — 绑定设备编号"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,4"/>
                        <TextBox Text="{Binding Path=DeviceId}"
                                 Width="200" Height="28"
                                 Foreground="White" Background="#0D1117"
                                 BorderBrush="#30363D" CaretBrush="White"/>
                        <TextBlock Text="{Binding Path=FullPath}"
                                   Foreground="#999" FontSize="11"
                                   Margin="0,4,0,0"/>
                    </StackPanel>
                </Border>

                <!-- 属性2：Mode + UpdateSourceTrigger -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="▶ Mode + UpdateSourceTrigger"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,4"/>

                        <TextBlock Text="TwoWay + LostFocus（默认）——失焦时才传回"
                                   Foreground="#999" FontSize="11"/>
                        <TextBox Text="{Binding TargetTemp, Mode=TwoWay}"
                                 Width="200" Height="28"
                                 Foreground="White" Background="#0D1117"
                                 BorderBrush="#30363D" CaretBrush="White"
                                 Margin="0,0,0,5"/>

                        <TextBlock Text="TwoWay + PropertyChanged —— 每次输入都传回"
                                   Foreground="#999" FontSize="11"/>
                        <TextBox Text="{Binding TargetTemp, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"
                                 Width="200" Height="28"
                                 Foreground="White" Background="#0D1117"
                                 BorderBrush="#30363D" CaretBrush="White"/>
                        <TextBlock Text="{Binding TargetTemp, StringFormat='当前值: {0:F1} °C'}"
                                   Foreground="#D4A017" FontSize="11"
                                   Margin="0,2,0,0"/>
                    </StackPanel>
                </Border>

                <!-- 属性3：StringFormat -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="▶ StringFormat — 格式化显示"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,4"/>
                        <WrapPanel>
                            <TextBlock Text="温度: "
                                       Foreground="#999" FontSize="13"/>
                            <TextBlock Text="{Binding TargetTemp, StringFormat='{0:F1} °C'}"
                                       Foreground="White" FontSize="13"
                                       FontWeight="Bold" FontFamily="Consolas"/>
                            <TextBlock Text=" | 运行率: "
                                       Foreground="#999" FontSize="13"
                                       Margin="15,0,0,0"/>
                            <TextBlock Text="{Binding TargetTemp, StringFormat='{0:P0}'}"
                                       Foreground="#3FB950" FontSize="13"
                                       FontWeight="Bold" FontFamily="Consolas"/>
                        </WrapPanel>
                    </StackPanel>
                </Border>

                <!-- 属性4：FallbackValue + TargetNullValue -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="▶ FallbackValue + TargetNullValue"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,4"/>
                        <TextBlock Text="操作员（可为空）："
                                   Foreground="#999" FontSize="11"/>
                        <TextBlock Text="{Binding Operator, TargetNullValue='未指定操作员'}"
                                   Foreground="White" FontSize="14"
                                   FontWeight="Bold" Margin="0,0,0,5"/>
                        <TextBlock Text="阈值（Fallback）："
                                   Foreground="#999" FontSize="11"/>
                        <TextBlock Text="{Binding AlarmThreshold, FallbackValue='--（数据不可用）'}"
                                   Foreground="#D4A017" FontSize="14"
                                   FontWeight="Bold"/>
                    </StackPanel>
                </Border>

                <!-- 属性5：Delay — 防抖 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="▶ Delay — 搜索防抖 (300ms)"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,4"/>
                        <TextBox Text="{Binding SearchText, Delay=300, UpdateSourceTrigger=PropertyChanged}"
                                 Width="250" Height="28"
                                 Foreground="White" Background="#0D1117"
                                 BorderBrush="#30363D" CaretBrush="White"/>
                        <TextBlock Text="{Binding SearchText, StringFormat='300ms 后才更新: {0}'}"
                                   Foreground="#D4A017" FontSize="11"
                                   Margin="0,4,0,0"/>
                        <TextBlock Text="快速输入文字，下面的值不会立即变化——Delay=300ms"
                                   Foreground="#666" FontSize="11"/>
                    </StackPanel>
                </Border>
            </StackPanel>
        </ScrollViewer>
    </Grid>
</Window>
 ```
>
> 运行后逐一测试：修改设备编号观察 FullPath 联动；两个 TextBox 的 Mode/UpdateSourceTrigger 差异；StringFormat 的格式化效果；FallbackValue/TargetNullValue 的兜底显示；Delay 的防抖效果。

> [!scene] 适用场景
> ✅ Mode：文本框用 TwoWay，只读标签用 OneWay
> ✅ UpdateSourceTrigger：实时校验用 PropertyChanged，提交表单用 LostFocus（默认）
> ✅ StringFormat：所有需要格式化显示的数字、日期
> ✅ FallbackValue：绑定可能失败的关键数据给个安全值
> ✅ Delay：搜索框、编码器参数输入
> ❌ 简单文本显示——必要过度设计，`Text="hello"` 就够了

> [!pitfall] 常见踩坑
> 坑 1：**TextBox 双向绑定输不进去数字** → 绑定到 int/double 属性时，输入非数字内容会导致绑定异常。解决方案：用 `FallbackValue` 或值转换器做容错。
>
> 坑 2：**SingleProperty 绑定中同时用了 Source 和 ElementName 而导致模糊** → 单次 Binding 只能指定一个源。如果同时写了 Source、RelativeSource、ElementName，最后一个生效（覆盖前面的）。
>
> 坑 3：**Delay 只在 TwoWay / OneWayToSource 模式中有效** → OneWay 绑定中 Delay 属性被忽略，因为数据只从源流向目标。

> [!best] 最佳实践
> - 表单提交用 LostFocus，实时搜索用 PropertyChanged + Delay
> - StringFormat 能解决的格式化绝不在 ViewModel 中创建额外的格式化属性
> - FallbackValue 和 TargetNullValue 是两个不同概念——前者是"整个绑定失败"，后者是"数据是 null"
> - 上位机中所有 PLC 实时数据用 OneWay 绑定 + StringFormat 格式化

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的配置表，测试每个属性区域的效果
> **Lv.2 小试牛刀**：给 TargetTemp 的 TextBox 加上 FallbackValue，输入字母看如何回退到默认值
> **Lv.3 融会贯通**：设计一个参数导入窗口——用 FileReader 读取 CSV 文件，用 Binding 六大属性优化所有输入控件的绑定体验

> [!related] 相关知识链接
> - ← 前置知识：什么是数据绑定？
> - → 后续必学：DataContext 数据上下文
> - ⇄ 关联概念：INotifyPropertyChanged、值转换器、MultiBinding
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.data.binding
