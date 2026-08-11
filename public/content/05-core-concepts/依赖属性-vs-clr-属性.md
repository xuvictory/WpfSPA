---
title: 依赖属性 vs CLR 属性
section: 05-core-concepts
parent: 5.1 依赖属性
---

# 依赖属性 vs CLR 属性

> [!plain] 白话理解
> 普通 CLR 属性就像一个**存钱罐**——你想知道有多少钱，打开盖子看一眼（get），你放钱进去（set），就这么简单。依赖属性则像一个**银行账户**——你查余额时，银行系统会综合计算工资入账、自动扣款、定期利息、投资理财等各种因素，给你一个"当前有效余额"。存钱罐（CLR 属性）只能存一个值，不关心值从哪来；银行账户（依赖属性）的值可能来自 11 个不同渠道，而且钱一变手机就收到通知。在 WPF 中，如果你想让属性参与数据绑定、样式、动画、值继承，就必须用依赖属性——CLR 属性做不到。

> [!def] 官方定义
> CLR 属性是对私有字段的 get/set 封装，值存储在对象内存中，无变化通知机制，无优先级解析。依赖属性是 WPF 属性系统的成员，值由 `EffectiveValueEntry` 动态计算，支持 11 级优先级、PropertyChangedCallback 通知、CoerceValueCallback 强制调整、ValidateValueCallback 合法性校验、数据绑定、样式 Setter、动画驱动和值继承。依赖属性的宿主类必须继承 `DependencyObject`，而 CLR 属性可以在任何类中定义。

> [!origin] 由来背景
> .NET 1.0 的属性系统（CLR Properties）虽然提供了封装性，但无法满足富客户端应用的需求。
>
> 微软在开发 WPF（Avalon）时，需要属性系统原生支持：
>
> (1) 数据绑定的自动更新；
>
> (2) 样式和模板的声明式赋值；
>
> (3) 动画流畅插值；
>
> (4) 控件默认值的零内存占用。
>
> 他们评估了几种方案——扩展 CLR 属性（侵入性太强）、AOP 织入（性能差）——最终选择了全新的"依赖属性系统"。
>
> 这个系统不是 CLR 属性的简单替代，而是一套独立于 .NET 类型系统之外的、为 UI 框架量身定做的属性管理引擎。

> [!essentials] 核心要点
> - **存储位置不同**：CLR 属性→实例字段；依赖属性→全局 PropertyStore 稀疏数组
> - **变化通知**：CLR 属性无；依赖属性有 PropertyChangedCallback
> - **值来源**：CLR 属性只有一个来源（set 的值）；依赖属性有 11 级优先级
> - **内存开销**：CLR 属性每个实例都占内存；依赖属性只在被修改时占内存
> - **绑定支持**：CLR 属性需实现 INotifyPropertyChanged；依赖属性天然支持
> - **使用限制**：CLR 属性可用在任何类；依赖属性必须继承 DependencyObject

> [!example] 完整示例
>
> 下面的演示直观对比依赖属性和 CLR 属性在 WPF 中的不同表现：
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:HmiDemo"
        Title="依赖属性 vs CLR 属性对比" Height="550" Width="750"
        WindowStartupLocation="CenterScreen">

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <StackPanel Grid.Row="0">
            <TextBlock Text="依赖属性 vs CLR 属性 — 上位机场景对比"
                       Foreground="#FF6B35" FontSize="16"
                       FontWeight="Bold" Margin="0,0,0,8"/>
            <TextBlock Text="左边：数据绑定、样式、动画都生效 | 右边：只能用代码手动赋值"
                       Foreground="#999" FontSize="12" Margin="0,0,0,12"/>
        </StackPanel>

        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="10"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <!-- ===== 左侧：依赖属性版本 ===== -->
            <Border Background="#161B22" CornerRadius="8"
                    Padding="15" Grid.Column="0">
                <StackPanel>
                    <TextBlock Text="✅ 依赖属性面板"
                               Foreground="#3FB950" FontWeight="Bold"
                               FontSize="14" Margin="0,0,0,12"/>

                    <local:DeviceGaugeDP x:Name="gaugeDP"
                        Pressure="72.5" Temperature="45.0"
                        Height="120" Margin="0,0,0,8"/>

                    <Slider x:Name="sliderDP" Minimum="0" Maximum="100"
                            Value="{Binding Pressure, ElementName=gaugeDP}"
                            Margin="0,8,0,4"/>
                    <TextBlock Text="{Binding Pressure, ElementName=gaugeDP, StringFormat='压力: {0:F1} bar'}"
                               Foreground="#AAA" FontSize="12"/>

                    <Border Background="#0D1117" Padding="10"
                            CornerRadius="4" Margin="0,10,0,0">
                        <StackPanel>
                            <TextBlock Text="绑定测试" Foreground="#3FB950"
                                       FontWeight="Bold" FontSize="12"/>
                            <TextBlock Text="Slider <--> 控件双向绑定 ✓"
                                       Foreground="#999" FontSize="11"/>
                            <TextBlock Text="温度≥50°C 自动变红（代码触发） ✓"
                                       Foreground="#999" FontSize="11"/>
                        </StackPanel>
                    </Border>
                </StackPanel>
            </Border>

            <!-- ===== 右侧：CLR 属性版本 ===== -->
            <Border Background="#161B22" CornerRadius="8"
                    Padding="15" Grid.Column="2">
                <StackPanel>
                    <TextBlock Text="❌ CLR 属性面板"
                               Foreground="#CC2222" FontWeight="Bold"
                               FontSize="14" Margin="0,0,0,12"/>

                    <local:DeviceGaugeCLR x:Name="gaugeCLR"
                        Height="120" Margin="0,0,0,8"/>

                    <Slider x:Name="sliderCLR" Minimum="0" Maximum="100"
                            Value="72.5" Margin="0,8,0,4"/>
                    <TextBlock x:Name="txtCLR"
                               Text="压力: 72.5 bar"
                               Foreground="#AAA" FontSize="12"/>

                    <Border Background="#0D1117" Padding="10"
                            CornerRadius="4" Margin="0,10,0,0">
                        <StackPanel>
                            <TextBlock Text="CLR 属性限制" Foreground="#CC2222"
                                       FontWeight="Bold" FontSize="12"/>
                            <TextBlock x:Name="txtCLRLimit"
                                       Foreground="#999" FontSize="11"
                                       TextWrapping="Wrap"/>
                        </StackPanel>
                    </Border>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>
</Window>
 ```
>
> **DeviceGaugeDP.cs**——依赖属性版设备仪表：
 ```csharp
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace HmiDemo;

public class DeviceGaugeDP : Control
{
    // ═══ 依赖属性：Pressure ═══
    public static readonly DependencyProperty PressureProperty =
        DependencyProperty.Register(
            nameof(Pressure), typeof(double),
            typeof(DeviceGaugeDP),
            new FrameworkPropertyMetadata(
                0.0, FrameworkPropertyMetadataOptions.AffectsRender,
                (d, e) => ((DeviceGaugeDP)d).InvalidateVisual()));

    public double Pressure
    {
        get => (double)GetValue(PressureProperty);
        set => SetValue(PressureProperty, value);
    }

    // ═══ 依赖属性：Temperature ═══
    public static readonly DependencyProperty TemperatureProperty =
        DependencyProperty.Register(
            nameof(Temperature), typeof(double),
            typeof(DeviceGaugeDP),
            new FrameworkPropertyMetadata(
                0.0, FrameworkPropertyMetadataOptions.AffectsRender,
                (d, e) => ((DeviceGaugeDP)d).InvalidateVisual()));

    public double Temperature
    {
        get => (double)GetValue(TemperatureProperty);
        set => SetValue(TemperatureProperty, value);
    }

    protected override void OnRender(DrawingContext dc)
    {
        var w = ActualWidth; var h = ActualHeight;
        dc.DrawRectangle(
            new SolidColorBrush(Color.FromRgb(0x0D, 0x11, 0x17)),
            null, new Rect(0, 0, w, h));

        var tempColor = Temperature >= 50
            ? Color.FromRgb(0xCC, 0x22, 0x22)
            : Color.FromRgb(0x3F, 0xB9, 0x50);

        var text = new FormattedText(
            $"压力: {Pressure:F1} bar | 温度: {Temperature:F1} °C",
            System.Globalization.CultureInfo.CurrentCulture,
            FlowDirection.LeftToRight,
            new Typeface("Consolas"), 13,
            new SolidColorBrush(tempColor), 1.0);
        dc.DrawText(text, new Point(10, (h - text.Height) / 2));
    }

    static DeviceGaugeDP()
    {
        DefaultStyleKeyProperty.OverrideMetadata(
            typeof(DeviceGaugeDP),
            new FrameworkPropertyMetadata(typeof(DeviceGaugeDP)));
    }
}
 ```
>
> **DeviceGaugeCLR.cs**——CLR 属性版（功能受限）：
 ```csharp
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace HmiDemo;

public class DeviceGaugeCLR : Control
{
    // ═══ 普通 CLR 属性——只是 get/set 字段 ═══
    private double _pressure;
    public double Pressure
    {
        get => _pressure;
        set { _pressure = value; InvalidateVisual(); }
    }

    private double _temperature;
    public double Temperature
    {
        get => _temperature;
        set { _temperature = value; InvalidateVisual(); }
    }

    protected override void OnRender(DrawingContext dc)
    {
        var w = ActualWidth; var h = ActualHeight;
        dc.DrawRectangle(
            new SolidColorBrush(Color.FromRgb(0x0D, 0x11, 0x17)),
            null, new Rect(0, 0, w, h));

        var tempColor = _temperature >= 50
            ? Color.FromRgb(0xCC, 0x22, 0x22)
            : Color.FromRgb(0x3F, 0xB9, 0x50);

        var text = new FormattedText(
            $"压力: {_pressure:F1} bar | 温度: {_temperature:F1} °C",
            System.Globalization.CultureInfo.CurrentCulture,
            FlowDirection.LeftToRight,
            new Typeface("Consolas"), 13,
            new SolidColorBrush(tempColor), 1.0);
        dc.DrawText(text, new Point(10, (h - text.Height) / 2));
    }

    static DeviceGaugeCLR()
    {
        DefaultStyleKeyProperty.OverrideMetadata(
            typeof(DeviceGaugeCLR),
            new FrameworkPropertyMetadata(typeof(DeviceGaugeCLR)));
    }
}
 ```
>
> **MainWindow.xaml.cs**：
 ```csharp
using System.Windows;

namespace HmiDemo;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();

        // CLR 版初始化
        gaugeCLR.Pressure = 72.5;
        gaugeCLR.Temperature = 45.0;

        // CLR 版的手动事件处理——依赖属性版用 Binding 一行搞定
        sliderCLR.ValueChanged += (s, e) =>
        {
            gaugeCLR.Pressure = sliderCLR.Value;
            txtCLR.Text = $"压力: {sliderCLR.Value:F1} bar";
        };

        // 展示 CLR 属性的局限性
        txtCLRLimit.Text = "❌ 不能用 Binding 绑定 Slider\n"
            + "❌ 不能用样式/触发器自动变色\n"
            + "❌ 不能用动画直接驱动\n"
            + "❌ 必须手动 InvalidateVisual";
    }
}
 ```
>
> 这个对比清晰展示了：依赖属性让左侧面板的 Slider→仪表绑定只需一行 `{Binding Pressure, ElementName=gaugeDP}` 即可工作，而 CLR 属性版右侧需要手动写 `ValueChanged` 事件代码，而且无法用样式、动画、触发器。

> [!scene] 适用场景
> ✅ 使用依赖属性：自定义控件的所有可绑定属性、需要样式的属性、需要动画驱动的属性
> ✅ 使用依赖属性：需要值继承的属性（如 DataContext）、需要从父元素传播的属性
> ✅ 使用 CLR 属性：ViewModel 中的业务数据字段（配合 `INotifyPropertyChanged`）
> ✅ 使用 CLR 属性：纯计算属性（只读 get，无状态）、内部辅助字段
> ❌ 不要用依赖属性：纯数据 Model 类——依赖属性太重，用 INotifyPropertyChanged 足够
> ❌ 不要用 CLR 属性：自定义控件的"被绑定目标"——Binding 只认依赖属性或 INPC

> [!pitfall] 常见踩坑
> 坑 1：**"绑定不生效"——目标是 CLR 属性** → `{Binding Xxx}` 要求绑定目标要么是依赖属性，要么是同时实现了 `INotifyPropertyChanged` 的普通属性的类的实例。如果两者都不是，绑定只读一次初始值，之后不更新。
>
> 坑 2：**依赖属性 + INotifyPropertyChanged 重复实现** → 依赖属性已经有 `PropertyChangedCallback`，完全不需要额外实现 `INPC`。给依赖属性再加 INPC 会造成双重通知和性能浪费。
>
> 坑 3：**用 CLR 属性替代依赖属性的"偷懒"写法** → `public double X { get; set; }` 然后期待 `{Binding X}` 工作。这是新手最爱犯的错误——简单声明一个 CLR 属性，发现绑定读了一次就不再更新。

> [!best] 最佳实践
> - 控件开发用依赖属性，MVVM ViewModel 用 CLR 属性 + INotifyPropertyChanged，分工明确
> - 如果一个属性需要参与绑定、样式、动画三者中的任何一个，就用依赖属性
> - 如果仅仅是内部计算值（如 `FullName = FirstName + " " + LastName`），用 CLR 只读属性
> - 不要因为"方便"在自定义控件中混用 CLR 属性——后期扩展时改造成本极高

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的对比代码，拖动左右两个 Slider，观察依赖属性和 CLR 属性的表现差异
> **Lv.2 小试牛刀**：把 `DeviceGaugeCLR` 的 `Pressure` 改成依赖属性，`Temperature` 保持 CLR 属性，测试两者差异
> **Lv.3 融会贯通**：写一个对比表格应用，用 `ListView` 展示一个设备列表，其中某些列绑定到依赖属性（控件自身），某些列绑定到 ViewModel 的 CLR 属性，总结使用场景边界

> [!related] 相关知识链接
> - ← 前置知识：什么是依赖属性？依赖属性的原理
> - → 后续必学：数据绑定（Binding 与依赖属性的关系）
> - ⇄ 关联概念：INotifyPropertyChanged、PropertyMetadata、FrameworkPropertyMetadata
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/dependency-properties-overview
