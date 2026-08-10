---
title: WrapPanel 核心特点与属性
section: 03-layout
parent: 3.4 WrapPanel 环绕布局
---

# WrapPanel 核心特点与属性

> [!plain] 白话理解
> WrapPanel 是 StackPanel 的"智能升级版"——它也会把子控件一个接一个排列，但当一行（或一列）排满了，它会**自动换行**（或换列）。就像超市里的货架：商品从左往右一排排放，放不下了自动换到下一排。这个能力让它成为工具栏、标签云、缩略图列表的天然选择——你只管往里加控件，排列和换行由它全权负责。

> [!def] 官方定义
> WrapPanel 是一个将子元素沿单一方向排列、并在达到容器边界时自动换行/换列的布局容器。与 StackPanel 的关键区别在于换行能力。核心属性包括：`Orientation`（排列方向，默认 Horizontal：从左往右排满后换行；Vertical：从上往下排满后换列）、`ItemWidth`（统一子项宽度，Null 时各子项独立计算）、`ItemHeight`（统一子项高度）。在换行方向上（水平排列时为垂直，反之亦然），子元素按期望尺寸排列，不会拉伸。

> [!origin] 由来背景
> 在 WinForms 中，FlowLayoutPanel 是类似的东西——但它的"流式"布局远不如 WPF 的 WrapPanel 优雅。WinForms 的 FlowLayoutPanel 在换行时不会保持子项的对齐和间距一致，而且没有 ItemWidth/ItemHeight 这种"统一子项尺寸"的便捷属性。WPF 的 WrapPanel 可以从 0 开始写，也可以瞬间把一堆不同大小的控件变成整齐的网格——这些 WinForms 做不到。

> [!essentials] 核心要点
> - **自动换行/换列**：这不行了就往下/往右挪，天生适合内容数量不确定的场景
> - **Orientation**：`Horizontal`（默认）→ 从左到右排，满了换行；`Vertical` → 从上到下排，满了换列
> - **ItemWidth / ItemHeight**：可选，设置后所有子元素统一为该尺寸，形成整齐的网格感
> - **子项大小由内容决定**（除非设了 ItemWidth/ItemHeight），不拉伸、不按比例，每个子项独立
> - **没有虚拟化**：WrapPanel 会渲染所有子元素，不适合海量数据（1000+）
> - **排列方向 = Auto 行为**，垂直方向不强制 Stretch

> [!example] 完整示例
> 用上位机场景——设备标签云和工位缩略图展示：
>
> ```xml
> <!-- WrapPanelDemo.xaml -->
> <Window x:Class="HmiDemo.WrapPanelDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="WrapPanel 演示 - 设备标签与工位缩略图" Height="500" Width="750"
>         Background="#0D1117">
>     <Grid Margin="12">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="12"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <!-- ====== 场景一：标签云 —— 不设 ItemWidth，子项尺寸由内容决定 ====== -->
>         <Border Grid.Row="0" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="设备标签云 (WrapPanel · Horizontal · 不设Item尺寸)"
>                            Foreground="#FF6B35" FontSize="14" FontWeight="Bold"
>                            Margin="0,0,0,8"/>
>                 <!-- 核心：WrapPanel 自动换行，窗口拉大时有更多空间，标签会"摊开" -->
>                 <WrapPanel>
>                     <Border Background="#FF6B3522" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#FF6B3544" BorderThickness="1">
>                         <TextBlock Text="报警" Foreground="#FF6B35" FontSize="12"/>
>                     </Border>
>                     <Border Background="#3FB95022" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#3FB95044" BorderThickness="1">
>                         <TextBlock Text="正常运行" Foreground="#3FB950" FontSize="12"/>
>                     </Border>
>                     <Border Background="#D2992222" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#D2992244" BorderThickness="1">
>                         <TextBlock Text="警告" Foreground="#D29922" FontSize="12"/>
>                     </Border>
>                     <Border Background="#58A6FF22" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#58A6FF44" BorderThickness="1">
>                         <TextBlock Text="PLC通讯" Foreground="#58A6FF" FontSize="12"/>
>                     </Border>
>                     <Border Background="#8B949E22" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6">
>                         <TextBlock Text="离线" Foreground="#8B949E" FontSize="12"/>
>                     </Border>
>                     <Border Background="#3FB95022" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#3FB95044" BorderThickness="1">
>                         <TextBlock Text="CNC加工中" Foreground="#3FB950" FontSize="12"/>
>                     </Border>
>                     <Border Background="#DA363322" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#DA363344" BorderThickness="1">
>                         <TextBlock Text="急停" Foreground="#DA3633" FontSize="12"
>                                    FontWeight="Bold"/>
>                     </Border>
>                     <Border Background="#FF6B3522" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,6,6" BorderBrush="#FF6B3544" BorderThickness="1">
>                         <TextBlock Text="温度过高" Foreground="#FF6B35" FontSize="12"/>
>                     </Border>
>                     <Border Background="#3FB95022" CornerRadius="3" Padding="8,4"
>                             Margin="0,0,0,6" BorderBrush="#3FB95044" BorderThickness="1">
>                         <TextBlock Text="待机" Foreground="#3FB950" FontSize="12"/>
>                     </Border>
>                 </WrapPanel>
>             </StackPanel>
>         </Border>
>
>         <!-- ====== 场景二：工位缩略图 —— 设 ItemWidth，统一子项尺寸 ====== -->
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="工位缩略图 (WrapPanel · Horizontal · ItemWidth=170)"
>                            Foreground="#3FB950" FontSize="14" FontWeight="Bold"
>                            Margin="0,0,0,8"/>
>
>                 <!-- 设了 ItemWidth 后，所有子项统一宽度，呈现整齐的网格 -->
>                 <WrapPanel ItemWidth="170">
>                     <!-- 工位1 -->
>                     <Border Background="#21262D" CornerRadius="4" Padding="10"
>                             Margin="0,0,8,8" Height="110">
>                         <StackPanel>
>                             <TextBlock Text="工位 01" Foreground="#FF6B35" FontSize="13"
>                                        FontWeight="Bold"/>
>                             <TextBlock Text="CNC 加工中心" Foreground="#C9D1D9" FontSize="12"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="● 运行中" Foreground="#3FB950" FontSize="11"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="产量: 1,280 件" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,2,0,0"/>
>                         </StackPanel>
>                     </Border>
>
>                     <!-- 工位2 -->
>                     <Border Background="#21262D" CornerRadius="4" Padding="10"
>                             Margin="0,0,8,8" Height="110">
>                         <StackPanel>
>                             <TextBlock Text="工位 02" Foreground="#FF6B35" FontSize="13"
>                                        FontWeight="Bold"/>
>                             <TextBlock Text="自动组装" Foreground="#C9D1D9" FontSize="12"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="● 运行中" Foreground="#3FB950" FontSize="11"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="产量: 1,152 件" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,2,0,0"/>
>                         </StackPanel>
>                     </Border>
>
>                     <!-- 工位3 -->
>                     <Border Background="#21262D" CornerRadius="4" Padding="10"
>                             Margin="0,0,8,8" Height="110">
>                         <StackPanel>
>                             <TextBlock Text="工位 03" Foreground="#8B949E" FontSize="13"
>                                        FontWeight="Bold"/>
>                             <TextBlock Text="质检工位" Foreground="#C9D1D9" FontSize="12"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="● 待料" Foreground="#FF6B35" FontSize="11"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="产量: -- 件" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,2,0,0"/>
>                         </StackPanel>
>                     </Border>
>
>                     <!-- 工位4 -->
>                     <Border Background="#21262D" CornerRadius="4" Padding="10"
>                             Margin="0,0,8,8" Height="110">
>                         <StackPanel>
>                             <TextBlock Text="工位 04" Foreground="#FF6B35" FontSize="13"
>                                        FontWeight="Bold"/>
>                             <TextBlock Text="包装工位" Foreground="#C9D1D9" FontSize="12"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="● 运行中" Foreground="#3FB950" FontSize="11"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="产量: 1,100 件" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,2,0,0"/>
>                         </StackPanel>
>                     </Border>
>
>                     <!-- 工位5 -->
>                     <Border Background="#21262D" CornerRadius="4" Padding="10"
>                             Margin="0,0,0,8" Height="110">
>                         <StackPanel>
>                             <TextBlock Text="工位 05" Foreground="#8B949E" FontSize="13"
>                                        FontWeight="Bold"/>
>                             <TextBlock Text="热处理" Foreground="#C9D1D9" FontSize="12"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="● 离线" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,4,0,0"/>
>                             <TextBlock Text="产量: -- 件" Foreground="#8B949E" FontSize="11"
>                                        Margin="0,2,0,0"/>
>                         </StackPanel>
>                     </Border>
>                 </WrapPanel>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // WrapPanelDemo.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class WrapPanelDemo : Window
> {
>     public WrapPanelDemo()
>     {
>         InitializeComponent();
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **标签云/标签筛选**：设备状态标签、报警类型筛选——数量不确定，自动换行
> ✅ **缩略图列表**：工位卡片、设备缩略图——ItemWidth 统一宽度，自动换行
> ✅ **工具栏**：按钮数量不固定的自定义工具栏——Scale 时自动换行，不会截断
> ✅ **颜色/状态指示器矩阵**：LED 状态灯网格——统一尺寸，自动换行
> ❌ **需要虚拟化的大数据列表**：WrapPanel 没有 Virtualizing 版本，1000 项会全部渲染
> ❌ **需要严格行列对齐**：用 UniformGrid（每格等大、行列数固定）

> [!pitfall] 常见踩坑
> 坑 1：**ItemWidth/ItemHeight 设了但内容溢出** → ItemWidth 是"容器宽度"不是"裁剪宽度"，如果子元素实际大小超过 ItemWidth，内容会溢出到相邻卡片上。确保子元素内容不大于 ItemWidth，或用 MaxWidth 做限制。
>
> 坑 2：**WrapPanel 的默认方向直觉陷阱** → 你写 `<WrapPanel Orientation="Vertical">` 期望的是"从上到下排，满了往右换列"——但实际效果可能和你想的不一样，因为换列后列的宽度是这一列最宽的子元素决定。大多数场景用默认的 Horizontal 就足够了。
>
> 坑 3：**大量子元素时的性能问题** → WrapPanel 不启用虚拟化，1000 个子项会同时创建 1000 个 Visual 节点，内存和渲染都吃力。这种情况用 ListBox + `WrapPanel` 作为 `ItemsPanelTemplate`，配合 ListBox 的虚拟化能力。

> [!best] 最佳实践
> - 卡片/缩略图场景：`ItemWidth="200"` 统一宽度，用 Margin 控制间距，窗口拉大时自动增加每行列数
> - 标签场景：不设 ItemWidth，让每个标签根据文字长度自然呈现
> - 数据绑定 + WrapPanel：`ItemsControl` + `WrapPanel` ItemsPanelTemplate + `ItemTemplate`
> - WrapPanel 的排列方向默认 Horizontal 就适用于 95% 的场景，Vertical 只在特殊排版时用

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，拖拽窗口宽度——观察标签云和工位缩略图的换行行为变化
> **Lv.2 小试牛刀**：把工位缩略图的 ItemWidth 从 170 改为 220 和 130，对比"一行放几个"的变化；把标签云的 WrapPanel 换成 StackPanel（Orientation="Horizontal"），看标签是否被截断
> **Lv.3 融会贯通**：做一个动态的报警标签面板，用 ItemsControl + WrapPanel 绑定到 Dictionary<string,int>（报警类型→数量），ItemTemplate 中根据数量显示不同颜色

> [!related] 相关知识链接
> - ← 前置知识：StackPanel 核心特点与属性（WrapPanel 是 StackPanel 的换行版本）
> - → 后续必学：用法示例（WrapPanel 更多实际场景）
> - → 后续必学：布局容器选择指南（全量容器对比）
> - ⇄ 关联概念：Orientation 枚举、ItemWidth/ItemHeight、ItemsPanelTemplate
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.wrappanel
