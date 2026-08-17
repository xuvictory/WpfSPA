---
title: GroupBox 分组框
section: 04-controls
parent: 4.7 容器与分组控件
---

# GroupBox 分组框

> [!plain] 白话理解
> GroupBox 就像设备面板上带标题的「分区隔板」。控制柜的接线端子要用隔板分成强电区、弱电区；上位机界面里，通信参数、运行保护、仪表设置这些相关控件，也要用带标题的框圈起来，用户一眼就能看出哪些控件是一组、各自是什么用途。标题写在框框顶部，里面的内容随便放。

> [!def] 官方定义
> `GroupBox`（全限定名 `System.Windows.Controls.GroupBox`）是一个带标题边框的内容容器，属于 `HeaderedContentControl`：`Header` 属性显示分组标题，`Content` 承载任意单个子元素（通常是一个 `Grid` 或 `StackPanel`）。它本身不提供滚动、排序等条目管理能力，只负责「画一个框 + 一个标题」。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.groupbox

> [!origin] 由来背景
> GroupBox 沿袭自 Win32 的 GroupBox 控件与 Windows Forms 的同名控件，目的始终如一：把功能相关的控件用带标题的边框圈起来，降低界面的认知负担。WPF 在 .NET Framework 3.0 中保留了这一控件，并借助内容模型让它比传统实现更灵活——标题可以是任意内容，框内可以放任何布局。上位机界面「按功能模块分区」的组织方式因此有了最直接的载体。

> [!essentials] 核心要点
> - `Header`：分组标题，可为字符串或任意内容（如带图标的标题栏）
> - `Content`：只能放一个子元素，多个控件需用 `Grid` / `StackPanel` 包裹
> - 观感由 `BorderBrush`、`BorderThickness`、`Padding` 控制
> - 不提供滚动能力：内容超出时需自行在外层套 `ScrollViewer`
> - 常与 CheckBox、RadioButton 搭配做「一组配置开关」的容器

> [!example] 完整示例
> **设备参数分组演示：GroupBox 的 Header 作分组标题，内部放表单控件：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="参数分组 - GroupBox" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <!-- 通信参数分组 -->
>         <GroupBox Header="通信参数" Margin="0,0,0,15" Foreground="White"
>                   BorderBrush="#2A4A6C" BorderThickness="1" Padding="10">
>             <Grid>
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="*"/>
>                 </Grid.ColumnDefinitions>
>                 <Grid.RowDefinitions>
>                     <RowDefinition Height="Auto"/>
>                     <RowDefinition Height="Auto"/>
>                 </Grid.RowDefinitions>
>                 <TextBlock Text="波特率：" Foreground="#8B949E" Grid.Row="0" Grid.Column="0"/>
>                 <TextBox Text="9600" Grid.Row="0" Grid.Column="1" Margin="6,2"/>
>                 <TextBlock Text="从站地址：" Foreground="#8B949E" Grid.Row="1" Grid.Column="0"/>
>                 <TextBox Text="1" Grid.Row="1" Grid.Column="1" Margin="6,2"/>
>             </Grid>
>         </GroupBox>
>
>         <!-- 运行保护分组 -->
>         <GroupBox Header="运行保护" Foreground="White"
>                   BorderBrush="#2A4A6C" BorderThickness="1" Padding="10">
>             <StackPanel>
>                 <CheckBox Content="过温保护（85 ℃）" IsChecked="True" Margin="0,2" Foreground="#C9D1D9"/>
>                 <CheckBox Content="过压保护（0.6 MPa）" IsChecked="True" Margin="0,2" Foreground="#C9D1D9"/>
>                 <CheckBox Content="缺相保护" Margin="0,2" Foreground="#C9D1D9"/>
>             </StackPanel>
>         </GroupBox>
>
>         <Button Content="保存参数" Click="OnSave" Padding="8" Margin="0,12,0,0"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 读取分组内控件取值（真实项目可用绑定替代手动查找）
>         private void OnSave(object sender, RoutedEventArgs e)
>         {
>             MessageBox.Show("参数已保存", "提示");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 把通信参数（波特率、从站地址）与运行保护（过温、过压）分框展示
> ✅ 表单分区：设备信息、工艺参数、报警设置各成一个带标题的框
> ✅ 在狭小窗口内用多个 GroupBox 竖向排列，形成清晰的段落感
> ✅ 一组单选 / 复选选项用 GroupBox 圈起来，明确「这几项是同一类配置」
> ❌ 需要折叠 / 展开的分区时（改用 [expander-折叠面板](expander-折叠面板)）
> ❌ 内容会滚动、条目数量动态变化时（改用 [listbox-列表框](listbox-列表框) 等条目控件）

> [!pitfall] 常见踩坑
> 坑 1：**GroupBox 里放多个控件报错** → 现象：在 GroupBox 里直接写了两个 TextBox，编译报「只能有一个子元素」。原因：`GroupBox.Content` 是单内容属性，只能放一个子元素。解决：先把控件放进 `StackPanel` / `Grid`，再把容器作为 GroupBox 的 Content。
> 
> 坑 2：**内容超出 GroupBox 边框被裁掉** → 现象：下拉列表展开后部分内容被边框遮挡。原因：GroupBox 不自带裁剪或滚动，内容溢出时直接超出边界。解决：给 GroupBox 外层套 `ScrollViewer`，或调整内部布局让内容自适应。
>
> 坑 3：**深色主题下标题与边框看不见** → 现象：深色背景上 GroupBox 边框和标题都是默认灰色，几乎融为一体。原因：未显式设置 `Foreground` / `BorderBrush`。解决：像示例一样显式设置 `Foreground="White"` 与 `BorderBrush`，或定义统一的深色样式资源。

> [!best] 最佳实践
> - 一个 GroupBox 只承载「一个职责」的控件组，标题用 4~8 个字的短语（如「通信参数」「运行保护」）
> - 内部布局优先用 `Grid`（两列表单：标签列 + 输入列），与示例风格保持一致
> - 框内控件间距统一，`Padding` 设 8~12，避免控件贴边
> - 与数据绑定配合：整组参数绑定到一个 ViewModel 属性对象，一处改动整组联动
> - 深色主题项目里把 GroupBox 样式抽成 `Style` 资源全站复用，避免每处重复写边框颜色

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，修改 Header 文本和 BorderBrush 颜色，观察标题与边框变化
> **Lv.2 小试牛刀**：在「通信参数」组里新增一行「数据位：8」的 TextBox；再新建一个「仪表设置」GroupBox 放入两个 TextBox
> **Lv.3 融会贯通**：给 GroupBox 套上 `ScrollViewer`，在框内放入超过窗口高度的参数列表，验证滚动效果
> **Lv.4 挑战进阶**：在 GroupBox 内放三个 RadioButton（如「手动 / 自动 / 检修」模式），验证同组自动互斥；再放另一组 RadioButton 到第二个 GroupBox，验证两组互不干扰——体会 GroupBox 同时承担「视觉分组」与「逻辑分组」双重职责

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[headeredcontentcontrol-带标题内容控件](headeredcontentcontrol-带标题内容控件)」，GroupBox 正是它的子类
> - → 后续必学：本章「[tabcontrol-选项卡](tabcontrol-选项卡)」把多个分组进一步组织成页签
> - ⇄ 关联概念：折叠式分组用「[expander-折叠面板](expander-折叠面板)」，容器概念见「[contentcontrol-内容控件](contentcontrol-内容控件)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.groupbox
