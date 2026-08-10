---
title: 值转换器 IValueConverter
section: 05-core-concepts
parent: 5.4 数据绑定
---

# 值转换器 IValueConverter

> [!plain] 白话理解
> 数据绑定给了一个值，但 UI 需要的格式可能不一样——比如数据是 `true/false`，UI 要显示"运行中/已停止"；数据是 `85.5`，UI 要乘以 10 变成 `855`；数据是枚举值 `Alarm`，UI 要显示红色。**值转换器（IValueConverter）**就是在数据和 UI 之间夹一层"翻译"——值从数据流向 UI 时调用 `Convert`，从 UI 流回数据时调用 `ConvertBack`。一个转换器可以复用在多个绑定上，就像自定义的函数。

> [!def] 官方定义
> `IValueConverter` 接口定义在 `System.Windows.Data` 命名空间，包含两个方法：`object Convert(object value, Type targetType, object parameter, CultureInfo culture)`（值从数据源流向绑定目标时调用）和 `object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)`（双向绑定中从目标流向源时调用）。参数 `parameter` 通过 XAML 的 `ConverterParameter` 属性传入，可用于传递配置。转换器通常在 XAML Resources 中声明为资源，在 Binding 中通过 `Converter={StaticResource xxx}` 引用。

> [!origin] 由来背景
> WPF 不提供"内置表达式绑定"（不像 Angular 的 `{{vm.speed * 10}}`），只能绑定到单独的属性。这导致了 IValueConverter 的诞生——它提供了一种"数据流中间件"机制。虽然写起来比 Angular 的模板表达式繁琐（每个转换要单独建一个类），但它的优势是**强类型**、**可复用**、**可测试**。从 WPF 1.0 到 WinUI 3，IValueConverter 一直是绑定体系的核心组件。

> [!essentials] 核心要点
> - **Convert**：数据 → UI（常用）; **ConvertBack**：UI → 数据（双向绑定时需要）
> - **ConverterParameter**：XAML 中传参，`ConverterParameter=100` 传入 Convert 方法
> - **必需在资源中声明**：`<local:BoolToTextConverter x:Key="boolConverter"/>`
> - **CultureInfo**：用于本地化——显示格式化数字、日期时自动适应用户语言
> - **IMultiValueConverter**：多值转换器，数组输入单值输出

> [!example] 完整示例
>
> 一个上位机设备状态面板——三种值转换器的实战：
>
> **Converters.cs**——三个转换器：
 ```csharp
using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace HmiDemo;

/// <summary>
/// 转换器1: bool → "运行中" / "已停止"
/// </summary>
public class BoolToStatusConverter : IValueConverter
{
    public object Convert(object value, Type targetType,
        object parameter, CultureInfo culture)
    {
        if (value is bool running)
            return running ? "● 运行中" : "○ 已停止";
        return "未知";
    }

    public object ConvertBack(object value, Type targetType,
        object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>
/// 转换器2: double → 颜色（温度分级）
/// parameter 为阈值字符串 "30|60"
/// </summary>
public class TemperatureToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType,
        object parameter, CultureInfo culture)
    {
        if (value is double temp)
        {
            // 解析阈值参数
            double low = 30, high = 60;
            if (parameter is string p)
            {
                var parts = p.Split('|');
                if (parts.Length == 2)
                {
                    double.TryParse(parts[0], out low);
                    double.TryParse(parts[1], out high);
                }
            }
            return new SolidColorBrush(temp <= low
                ? Color.FromRgb(0x3F, 0xB9, 0x50)
                : temp <= high
                    ? Color.FromRgb(0xD4, 0xA0, 0x17)
                    : Color.FromRgb(0xCC, 0x22, 0x22));
        }
        return new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType,
        object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>
/// 转换器3: double 百分比 → 进度条值（输入 0~1 → 输出 0~100）
/// </summary>
public class PercentToProgressConverter : IValueConverter
{
    public object Convert(object value, Type targetType,
        object parameter, CultureInfo culture)
    {
        if (value is double pct)
            return pct * 100.0;
        return 0.0;
    }

    public object ConvertBack(object value, Type targetType,
        object parameter, CultureInfo culture)
    {
        if (value is double val)
            return val / 100.0;
        return 0.0;
    }
}
 ```
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:HmiDemo"
        Title="IValueConverter — 设备状态" Height="450" Width="650"
        WindowStartupLocation="CenterScreen">

    <Window.Resources>
        <local:BoolToStatusConverter x:Key="statusConv"/>
        <local:TemperatureToColorConverter x:Key="tempConv"/>
        <local:PercentToProgressConverter x:Key="pctConv"/>
    </Window.Resources>

    <Window.DataContext>
        <local:StatusViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <TextBlock Text="IValueConverter — 设备状态面板"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,12"/>

        <ItemsControl Grid.Row="1"
            ItemsSource="{Binding Devices}">
            <ItemsControl.ItemTemplate>
                <DataTemplate>
                    <Border Background="#161B22" CornerRadius="6"
                            Padding="12" Margin="0,4"
                            BorderBrush="#30363D" BorderThickness="1">
                        <Grid>
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="120"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>

                            <StackPanel>
                                <TextBlock Text="{Binding Name}"
                                           Foreground="White"
                                           FontWeight="Bold"/>
                                <!-- 转换器1：bool → 运行状态文字 -->
                                <TextBlock Text="{Binding IsRunning, Converter={StaticResource statusConv}}"
                                           Foreground="#D4A017" FontSize="12"
                                           Margin="0,2,0,0"/>
                            </StackPanel>

                            <StackPanel Grid.Column="1">
                                <!-- 转换器2：温度 → 颜色（带 ConverterParameter 阈值） -->
                                <StackPanel Orientation="Horizontal">
                                    <Ellipse Width="10" Height="10" VerticalAlignment="Center"
                                             Fill="{Binding Temperature, Converter={StaticResource tempConv}, ConverterParameter='30|60'}"/>
                                    <TextBlock Text="{Binding Temperature, StringFormat='  {0:F1} °C'}"
                                               Foreground="White" FontFamily="Consolas"
                                               Margin="5,0,0,0"/>
                                    <TextBlock Text=" (≤30绿, 30~60黄, >60红)"
                                               Foreground="#666" FontSize="10"
                                               Margin="5,0,0,0"/>
                                </StackPanel>

                                <!-- 转换器3：double 0~1 → ProgressBar 0~100 -->
                                <WrapPanel Margin="0,4,0,0">
                                    <ProgressBar Width="150" Height="10"
                                                 Value="{Binding LoadPercent, Converter={StaticResource pctConv}}"
                                                 Foreground="#3FB950" Background="#0D1117"/>
                                    <TextBlock Text="{Binding LoadPercent, StringFormat='  负载: {0:P0}'}"
                                               Foreground="#999" FontSize="11"
                                               VerticalAlignment="Center"/>
                                </WrapPanel>
                            </StackPanel>
                        </Grid>
                    </Border>
                </DataTemplate>
            </ItemsControl.ItemTemplate>
        </ItemsControl>
    </Grid>
</Window>
 ```
>
> **StatusViewModel.cs**
 ```csharp
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace HmiDemo;

public class DeviceStatus
{
    public string Name { get; set; } = "";
    public bool IsRunning { get; set; }
    public double Temperature { get; set; }
    public double LoadPercent { get; set; }
}

public class StatusViewModel
{
    public ObservableCollection<DeviceStatus> Devices { get; } = new()
    {
        new() { Name = "电机 M-101", IsRunning = true, Temperature = 25, LoadPercent = 0.42 },
        new() { Name = "变频器 VFD-01", IsRunning = false, Temperature = 45, LoadPercent = 0.0 },
        new() { Name = "PLC-CPU2", IsRunning = true, Temperature = 78, LoadPercent = 0.88 },
        new() { Name = "传感器 S-101", IsRunning = true, Temperature = 55, LoadPercent = 0.30 },
    };
}
 ```

> [!scene] 适用场景
> ✅ bool → 文字/颜色/可见性转换
> ✅ 数值 → 颜色分级（如温度红黄绿指示灯）
> ✅ 枚举 → 显示文字/图标
> ✅ 百分比 0~1 ↔ ProgressBar 0~100
> ✅ 时区转换、单位转换
> ❌ 简单格式化用 StringFormat 够了

> [!pitfall] 常见踩坑
> 坑 1：**只实现了 Convert 没实现 ConvertBack → 双向绑定异常** → 如果不会反向转换，直接 `throw new NotSupportedException()`。
>
> 坑 2：**Convert 返回了错误的类型** → 返回 `Color.FromRgb(...)` 而不是 `new SolidColorBrush(...)`。绑定到 `Fill` 时需要 Brush 而非 Color。解决方案：看目标属性的类型。
>
> 坑 3：**ConverterParameter 在 XAML 中只能是字符串** → 复杂参数需要在代码中解析。解决方案：用 `|` 分隔多值字符串，或改用 `IMultiValueConverter`。

> [!best] 最佳实践
> - 转换器放 `Converters` 文件夹统一管理
> - 用 `ConverterParameter` 传配置——同一个转换器靠参数实现不同行为
> - Pure Function 原则——Convert 应该是无副作用的纯函数
> - 颜色转换器返回 `SolidColorBrush` 而非 `Color`（别忘了）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的面板，观察每种转换器的效果
> **Lv.2 小试牛刀**：写一个 `AlarmLevelToIconConverter`，根据报警等级（0/1/2）返回不同的文字图标
> **Lv.3 融会贯通**：实现一个"多单位切换"转换器——同一温度值，根据 ComboBox 选择显示 °C 或 °F，ConverterParameter 来自 ComboBox 绑定

> [!related] 相关知识链接
> - ← 前置知识：Binding 核心属性
> - → 后续必学：数据验证（ValidationRule）
> - ⇄ 关联概念：IMultiValueConverter、ConverterParameter、StringFormat
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.data.ivalueconverter
