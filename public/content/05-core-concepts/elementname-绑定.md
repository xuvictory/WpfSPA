---
title: ElementName 绑定
section: 05-core-concepts
parent: 5.4 数据绑定
---

# ElementName 绑定

> [!plain] 白话理解
> 大多数绑定都是"控件 → 数据"，但有些时候你需要"控件 A 的属性 ← 控件 B 的属性"——比如 Slider 的 Value 绑定到 ProgressBar 的 Value、ComboBox 的选中项联动 TextBox 的文本。`ElementName` 就是专门做这个的：在绑定中写 `ElementName=sliderTemp`，WPF 就会去那个控件上找属性，而不是去 DataContext 找。这种"控件间绑定"在上位机界面中非常常见——旋钮控制仪表盘、开关联动指示灯、下拉框驱动参数表。

> [!def] 官方定义
> `ElementName` 是 `Binding` 类的属性，用于指定绑定源为另一个 XAML 元素。它与 `Source` 和 `RelativeSource` 互斥（同一 Binding 只能指定一种源方式）。使用方法：`{Binding Path=Value, ElementName=sliderTemp}`。它要求目标元素和源元素在同一 XAML 命名范围内（同一个 NameScope），且源元素必须有一个 `Name` 或 `x:Name`。ElementName 绑定支持所有 Mode（OneWay/TwoWay/OneTime 等），且与 DataContext 无关——它直接引用 UI 元素。

> [!origin] 由来背景
> 早期的 WinForms 中没有"控件间绑定"的概念——一切都要在事件处理器中手动写 `progressBar.Value = slider.Value`。WPF 引入 ElementName 后，这种"UI 元素间联动"第一次可以在 XAML 中声明式完成。在 Silverlight 2 中，ElementName 绑定有一个 Bug：DataTemplate 内的元素无法通过 ElementName 引用外部元素——因为 DataTemplate 有独立的 NameScope。这个限制导致了很多人开始使用 RelativeSource FindAncestor 替代。UWP 和 WinUI 修复了这个问题。

> [!essentials] 核心要点
> - **控件间绑定**：`{Binding Value, ElementName=slider}` ——绑定到名为 slider 的控件
> - **必须 Name/x:Name**：源组件必须有 `x:Name="xxx"`
> - **同 NameScope**：源和目标在同一个命名范围内（同一个 Window/UserControl）
> - **任何属性都可绑定**：不仅 Value，Width、Visibility、IsChecked、SelectedItem 都可以
> - **DataTemplate 内有限制**：DataTemplate 有自己的 NameScope，ElementName 不能跨模板引用

> [!example] 完整示例
>
> 上位机参数调节面板——多控件联动，全部用 ElementName 绑定：
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="ElementName — 控件间绑定" Height="550" Width="700"
        WindowStartupLocation="CenterScreen">

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <TextBlock Text="ElementName 控件间绑定 — 参数调节面板"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,12"/>

        <ScrollViewer Grid.Row="1">
            <StackPanel>

                <!-- 示例1：Slider ↔ ProgressBar ↔ TextBlock 三向联动 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="示例1: Slider ↔ ProgressBar ↔ TextBlock"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>

                        <Slider x:Name="sldSpeed" Minimum="0" Maximum="3000"
                                Value="1500" Margin="0,0,0,4"/>
                        <ProgressBar x:Name="pbSpeed" Height="16" Maximum="3000"
                                     Value="{Binding Value, ElementName=sldSpeed}"
                                     Foreground="#3FB950" Background="#0D1117"
                                     Margin="0,0,0,4"/>
                        <WrapPanel>
                            <TextBlock Text="转速: " Foreground="#999"/>
                            <TextBlock Text="{Binding Value, ElementName=sldSpeed, StringFormat='{0:F0} RPM'}"
                                       Foreground="White" FontWeight="Bold"
                                       FontFamily="Consolas"/>
                        </WrapPanel>
                        <TextBlock Text="Slider → ProgressBar（OneWay）→ TextBlock（OneWay）全部通过 ElementName 绑定"
                                   Foreground="#666" FontSize="11" Margin="0,4,0,0"/>
                    </StackPanel>
                </Border>

                <!-- 示例2：ComboBox ↔ TextBlock 联动 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="示例2: ComboBox ↔ TextBlock 选中项联动"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>
                        <WrapPanel>
                            <ComboBox x:Name="cmbMode" Width="150" Height="28"
                                      SelectedIndex="0"
                                      Background="#0D1117" Foreground="White"
                                      BorderBrush="#30363D">
                                <ComboBoxItem Content="手动模式"/>
                                <ComboBoxItem Content="自动模式"/>
                                <ComboBoxItem Content="调试模式"/>
                                <ComboBoxItem Content="维护模式"/>
                            </ComboBox>
                            <TextBlock Text="当前模式: " Foreground="#999"
                                       VerticalAlignment="Center" Margin="10,0,0,0"/>
                            <!-- 绑定 ComboBox 的 SelectedItem → 提取 Content 属性 -->
                            <TextBlock Foreground="#D4A017" FontWeight="Bold"
                                       VerticalAlignment="Center"
                                       Text="{Binding SelectedItem.Content, ElementName=cmbMode}"/>
                        </WrapPanel>
                    </StackPanel>
                </Border>

                <!-- 示例3：CheckBox ↔ 控件可见性/启用 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="示例3: CheckBox ↔ Visibility/IsEnabled"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>
                        <WrapPanel>
                            <CheckBox x:Name="chkEnable" Content="启用高级参数"
                                      Foreground="White" IsChecked="True"
                                      VerticalAlignment="Center" Margin="0,0,15,0"/>

                            <!-- IsEnabled 绑定到 CheckBox 的 IsChecked -->
                            <TextBox Width="180" Height="28"
                                     IsEnabled="{Binding IsChecked, ElementName=chkEnable}"
                                     Text="高级参数配置" Foreground="White"
                                     Background="#0D1117" BorderBrush="#30363D"
                                     CaretBrush="White" Margin="5,0"/>

                            <!-- Visibility 绑定 -->
                            <Border Background="#0D1117" CornerRadius="4"
                                    Padding="8" Margin="10,0,0,0"
                                    Visibility="{Binding IsChecked, ElementName=chkEnable, Converter={StaticResource BoolToVisibility}}"/>
                        </WrapPanel>
                    </StackPanel>
                </Border>

                <!-- 示例4：控件尺寸联动 -->
                <Border Background="#161B22" CornerRadius="6"
                        Padding="12" Margin="0,4">
                    <StackPanel>
                        <TextBlock Text="示例4: 控件尺寸联动"
                                   Foreground="#3FB950" FontWeight="Bold"
                                   Margin="0,0,0,6"/>
                        <Slider x:Name="sldSize" Minimum="50" Maximum="200"
                                Value="120" Width="250"/>
                        <!-- Ellipse 尺寸跟随 Slider -->
                        <Border Background="#0D1117" CornerRadius="4"
                                Width="220" Height="120" Margin="0,6,0,0">
                            <Ellipse Fill="#3FB950"
                                     Width="{Binding Value, ElementName=sldSize}"
                                     Height="{Binding Value, ElementName=sldSize}"/>
                        </Border>
                        <TextBlock Text="滑块控制圆形尺寸" Foreground="#666"
                                   FontSize="11" Margin="0,4,0,0"/>
                    </StackPanel>
                </Border>
            </StackPanel>
        </ScrollViewer>
    </Grid>
</Window>
 ```
>
> 运行后：
> - 拖动 Slider → ProgressBar 和 TextBlock 自动跟随
> - 切换 ComboBox → TextBlock 显示当前模式
> - 取消勾选 → 高级参数框变灰不可用
> - 拖动尺寸 Slider → 圆形等比例缩放

> [!scene] 适用场景
> ✅ Slider/ScrollBar 驱动其他控件（ProgressBar、仪表盘、Gauge）
> ✅ CheckBox/RadioButton 控制其他控件可见性/启用状态
> ✅ ComboBox/ListBox 选中项联动显示详情
> ✅ 控件尺寸跟随（联动缩放）
> ❌ 跨 DataTemplate 引用——用 RelativeSource 代替
> ❌ 绑定到数据（ViewModel）——用 DataContext 绑定

> [!pitfall] 常见踩坑
> 坑 1：**DataTemplate 中的 ElementName 找不到** → DataTemplate 有独立的 NameScope。解决方案：用 `RelativeSource FindAncestor` 跳到模板外再找。
>
> 坑 2：**绑定了不存在的 Name** → XAML 中没有该名称的控件，编译不报错但运行时绑定静默失败。解决方案：检查 Output 窗口的绑定错误信息。
>
> 坑 3：**Visibility 绑定了 IsChecked(bool) 但类型不匹配** → 需要 `IValueConverter` 把 bool 转成 Visibility。解决方案：用内置的 `BooleanToVisibilityConverter`。

> [!best] 最佳实践]
> - ElementName 绑定让 XAML "自足"——不依赖后台代码，声明式联动
> - 复杂的联动逻辑考虑抽取到 ViewModel 中用 `INotifyPropertyChanged` 驱动
> - 命名遵循 `x:Name="sldXxx"/"txtXxx"/"pbXxx"` 这样带控件类型的命名模式
> - ElementName 和 DataContext 绑定可以混用——`Path=DataContext.xxx, ElementName=parentControl`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的演示，操作每个联动示例
> **Lv.2 小试牛刀**：添加一个"倍率" ComboBox（1x/2x/5x/10x），被 ElementName 绑定的 Slider 值乘以倍率后显示
> **Lv.3 融会贯通**：设计一个"PID 参数调谐器"——3 个 Knob（旋钮控件）的 Value 通过 ElementName 联动到 3 个 Gauge 仪表盘和 6 个 Label，实现纯 XAML 无代码的参数调谐面板

> [!related] 相关知识链接
> - ← 前置知识：Binding 核心属性、RelativeSource
> - → 后续必学：值转换器 IValueConverter
> - ⇄ 关联概念：NameScope、DataTemplate、x:Name
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.data.binding.elementname
