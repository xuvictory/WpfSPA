---
title: DataContext 数据上下文
section: 05-core-concepts
parent: 5.4 数据绑定
---

# DataContext 数据上下文

> [!plain] 白话理解
> `DataContext` 是 WPF 中最重要也最容易误解的概念。你可以把它想象成每个控件的**"默认数据地址"**——当你在 XAML 中写 `{Binding Speed}` 时，WPF 会自动去查找"当前控件的 DataContext 对象上有没有叫 Speed 的属性"。而且 DataContext 是**继承的**——如果你在 Window 上设了 DataContext，它所有的子控件自动继承，除非子控件显式覆盖。这就是为什么在 MVVM 中一行 `<Window.DataContext><local:MyViewModel/></Window.DataContext>` 就能让整个窗口的所有控件都绑定到同一个 ViewModel。

> [!def] 官方定义
> `DataContext` 是 `FrameworkElement` 上的一个依赖属性，指定了控件的默认绑定源。当 `Binding` 没有显式指定 `Source`、`ElementName` 或 `RelativeSource` 时，绑定系统会沿着逻辑树向上查找，直到找到一个非空的 `DataContext`，然后以它作为绑定源解析 Path。`DataContext` 的继承规则使得在一个根元素上设置 DataContext 即可影响整个子树。`DataContext` 支持 `FrameworkPropertyMetadataOptions.Inherits`，因此它是通过依赖属性的值继承机制自动向下传播的。

> [!origin] 由来背景
> `DataContext` 最初在 WPF 设计文档中被称为 DefaultBindingSource——一个更直观但太长的名字。设计团队考虑到 WinForms 中 `DataBinding` 的操作太繁琐（每个控件都要单独指定 DataSource），决定引入一个可以继承的"全局"默认数据源。这个设计决策成为了 MVVM 模式的基石——因为 DataContext 的继承特性，你才能在一个地方设置 ViewModel，所有子控件自动绑定到它。Silverlight 2、UWP、WinUI 3 都保留了 DataContext，证明了它的设计价值。

> [!essentials] 核心要点
> - **沿树继承**：子控件默认继承父控件的 DataContext
> - **可被覆盖**：子控件显式设置 DataContext 后切断继承链
> - **Binding 的默认源**：`{Binding Speed}` 等价于 `{Binding Path=Speed, Source=当前DataContext}`
> - **DataTemplate 中自动切换**：ItemsControl 的每个条目自动将 DataContext 设为当前数据项
> - **代码中访问**：`FrameworkElement.DataContext` 属性，可通过 `FindResource` 获取

> [!example] 完整示例
>
> 演示 DataContext 的继承、覆盖以及在 ItemsControl 中的自动切换：
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:HmiDemo"
        Title="DataContext 数据上下文" Height="550" Width="700"
        WindowStartupLocation="CenterScreen">

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <TextBlock Text="DataContext 继承链演示"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,12"/>

        <ScrollViewer Grid.Row="1">
            <StackPanel>

                <!-- 场景1：Window.DataContext 全局继承 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="场景1: 根元素 DataContext 向下继承"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>
                        <Border Background="#0D1117" CornerRadius="4"
                                Padding="10">
                            <StackPanel DataContext="{x:Static local:DeviceStore.Current}">
                                <TextBlock Text="这个 StackPanel 显式设置了 DataContext"
                                           Foreground="#999" FontSize="11"/>
                                <!-- 子元素自动继承 DataContext -->
                                <TextBlock Text="{Binding Name}"
                                           Foreground="White" FontSize="14"
                                           FontWeight="Bold"/>
                                <TextBlock Text="{Binding Description}"
                                           Foreground="#AAA" FontSize="12"/>
                            </StackPanel>
                        </Border>
                    </StackPanel>
                </Border>

                <!-- 场景2：DataContext 覆盖 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="场景2: 子元素覆盖 DataContext"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>

                        <Border Background="#0D1117" CornerRadius="4"
                                Padding="10"
                                DataContext="{x:Static local:DeviceStore.Line}">
                            <StackPanel>
                                <TextBlock Text="{Binding Name}"
                                           Foreground="White" FontWeight="Bold"/>
                                <!-- 注意：这个 TextBlock 覆盖了 DataContext -->
                                <TextBlock Text="{Binding Name}"
                                           DataContext="{x:Static local:DeviceStore.Current}"
                                           Foreground="#D4A017" FontWeight="Bold"
                                           Margin="0,4,0,0"/>
                                <TextBlock Text="↑ 上面这行覆盖了 DataContext，所以显示设备名而非产线名"
                                           Foreground="#666" FontSize="11"/>
                            </StackPanel>
                        </Border>
                    </StackPanel>
                </Border>

                <!-- 场景3：ItemsControl 中的 DataContext -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="场景3: ItemsControl 自动设置每条目的 DataContext"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>

                        <ItemsControl
                            ItemsSource="{x:Static local:DeviceStore.DeviceList}">
                            <!-- 每条目的 DataContext = 当前设备对象 -->
                            <ItemsControl.ItemTemplate>
                                <DataTemplate>
                                    <Border Background="#0D1117"
                                            CornerRadius="4"
                                            Padding="8" Margin="0,2">
                                        <StackPanel Orientation="Horizontal">
                                            <!-- DataContext 是 DeviceItem → 直接绑 Name -->
                                            <TextBlock Text="{Binding Name}"
                                                       Foreground="White"
                                                       FontWeight="Bold"
                                                       Width="120"/>
                                            <TextBlock Text="{Binding Status}"
                                                       Foreground="#D4A017"
                                                       Width="80"/>
                                            <TextBlock Text="{Binding Temperature, StringFormat='{0:F1} °C'}"
                                                       Foreground="#999"
                                                       FontFamily="Consolas"/>
                                        </StackPanel>
                                    </Border>
                                </DataTemplate>
                            </ItemsControl.ItemTemplate>
                        </ItemsControl>

                        <TextBlock Text="每个条目的 Binding 绑定到当前设备对象——DataContext 自动切换"
                                   Foreground="#666" FontSize="11"
                                   Margin="0,6,0,0"/>
                    </StackPanel>
                </Border>

                <!-- 场景4：父级 DataContext 的访问 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="场景4: 在 DataTemplate 中访问父级 DataContext"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>

                        <ItemsControl ItemsSource="{x:Static local:DeviceStore.DeviceList}">
                            <ItemsControl.ItemTemplate>
                                <DataTemplate>
                                    <Border Background="#0D1117"
                                            CornerRadius="4"
                                            Padding="8" Margin="0,2">
                                        <StackPanel Orientation="Horizontal">
                                            <TextBlock Text="{Binding Name}"
                                                       Foreground="White" Width="120"/>
                                            <!-- AncestorType 向上查找 Window 的 DataContext -->
                                            <TextBlock Foreground="#666" FontSize="11">
                                                <TextBlock.Text>
                                                    <MultiBinding StringFormat="产线: {0} / {1}">
                                                        <Binding Path="LineName"
                                                                 RelativeSource="{RelativeSource AncestorType=Window}"/>
                                                        <Binding Path="Name"/>
                                                    </MultiBinding>
                                                </TextBlock.Text>
                                            </TextBlock>
                                        </StackPanel>
                                    </Border>
                                </DataTemplate>
                            </ItemsControl.ItemTemplate>
                        </ItemsControl>
                    </StackPanel>
                </Border>
            </StackPanel>
        </ScrollViewer>
    </Grid>
</Window>
 ```
>
> **DeviceStore.cs**——数据提供者：
 ```csharp
using System.Collections.Generic;

namespace HmiDemo;

public class DeviceItem
{
    public string Name { get; set; } = "";
    public string Status { get; set; } = "";
    public double Temperature { get; set; }
}

public class LineInfo
{
    public string Name { get; set; } = "";
}

public static class DeviceStore
{
    public static DeviceItem Current { get; } = new DeviceItem
    {
        Name = "电机 M-101", Status = "运行中", Temperature = 85.5,Description=""
    };

    public static LineInfo Line { get; } = new LineInfo
        { Name = "产线-2（装配车间）" };

    public static List<DeviceItem> DeviceList { get; } = new()
    {
        new() { Name = "电机 M-101", Status = "运行", Temperature = 85.5 },
        new() { Name = "变频器 VFD-01", Status = "停止", Temperature = 32.0 },
        new() { Name = "PLC-CPU2", Status = "报警", Temperature = 78.2 },
        new() { Name = "传感器 S-101", Status = "正常", Temperature = 25.0 },
    };
}
 ```
>
> 运行后观察：
> - **场景1**：StackPanel 设了 DataContext → 子元素自动继承
> - **场景2**：子元素覆盖 DataContext → 绑定到不同源
> - **场景3**：ItemsControl 的每个条目 DataContext 自动切换为当前数据项
> - **场景4**：用 RelativeSource-AncestorType 突破 DataTemplate 的 DataContext 限制

> [!scene] 适用场景
> ✅ MVVM 中 Window 设 DataContext = ViewModel，全窗口统一绑定源
> ✅ ItemsControl/DataGrid 中自动为每行切换 DataContext
> ✅ 分层界面——不同面板有各自的子 ViewModel，覆盖 DataContext
> ✅ 在 DataTemplate 中用 RelativeSource 跨层访问父 DataContext
> ❌ 不涉及绑定的纯显示控件无需设置 DataContext

> [!pitfall] 常见踩坑
> 坑 1：**父窗口设了 DataContext，但某个子控件的绑定不生效** → 该子控件或被其父容器覆盖了 DataContext。用 Snoop 工具检查当前控件的实际 DataContext。
>
> 坑 2：**DataTemplate 中想绑定 ViewModel 的命令，但 DataContext 是当前列表项** → 用 `RelativeSource={RelativeSource AncestorType=Window}` 跳到 Window 层获取 ViewModel 的命令。
>
> 坑 3：**DataContext 在后台被设为 null，所有绑定静默失败** → 初始化时为空，但数据异步加载。解决方案：用 `FallbackValue` 加兜底显示，或在加载完成后才设 DataContext。

> [!best] 最佳实践
> - Window/Page 层设一次 DataContext 即可——子控件自动继承
> - 不要在子控件中频繁变更 DataContext——会破坏绑定稳定性和可维护性
> - DataTemplate 中需要父命令时用 `RelativeSource` 而非覆盖 DataContext
> - 复杂窗口用多个子 UserControl，每个有自己的局部 DataContext

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的演示，理解四个场景中 DataContext 的来源
> **Lv.2 小试牛刀**：新建一个 UserControl 子控件（如 DeviceCard），内有自己的绑定。在主窗口中使用它，观察它的 DataContext 是继承还是独立
> **Lv.3 融会贯通**：设计一个"产线总览"界面——三层 DataContext（Window = 工厂数据、Tab = 产线数据、卡片 = 设备数据），体验继承和覆盖机制

> [!related] 相关知识链接
> - ← 前置知识：什么是数据绑定？Binding 核心属性
> - → 后续必学：INotifyPropertyChanged 接口
> - ⇄ 关联概念：RelativeSource、DataTemplate、ItemsControl
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.frameworkelement.datacontext
