---
title: HeaderedItemsControl 带标题条目控件
section: 04-controls
parent: 4.1 控件内容模型
---

# HeaderedItemsControl 带标题条目控件

> [!plain] 白话理解
> 报警面板往往是"一个标题 + 下面一列条目"：标题写着"今日报警（3 条）"，下面是三条报警记录。用 ItemsControl 能渲染列表，但标题还得额外放一个 TextBlock；标题要随条目数变化，还得手工更新。
> HeaderedItemsControl 把"标题 + 条目集合"打包成一个控件：`Header` 放标题，子元素或 `ItemsSource` 放多条条目。`Menu` 的菜单栏标题、`TreeView` 的树节点标题、`ToolBar` 的标题，都是它的具体形态——只不过它们把标题做成了可点击的展开/选中逻辑。

> [!def] 官方定义
> HeaderedItemsControl 是 `ItemsControl` 的直接子类，位于 `System.Windows.Controls` 命名空间，在"条目集合"能力之外增加了 `Header` 属性（类型 `object`），并配套 `HeaderTemplate` 定义标题外观。经典子类包括 `Menu`（标题即菜单项）、`TreeView`（树节点标题+子节点）、`ToolBar`（工具条标题）与 `StatusBar` 等。它是"标题 + 多条目"这一上位机高频布局的标准抽象。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.headereditemscontrol

> [!origin] 由来背景
> 在工业界面中，"标题 + 多条同类信息"是最常见的结构之一：报警面板、通道列表、菜单栏、树形设备结构。仅靠 ItemsControl 时，标题与列表是两个独立控件，标题随数据变化需要额外代码同步；用普通面板拼装又难以统一风格。WPF 据此在 ItemsControl 之上增加 Header，形成 HeaderedItemsControl；再往下派生 `Menu`、`TreeViewItem`、`ToolBar` 等，把"标题"升级为可交互的菜单项或树节点，让"带标题的列表"从布局样板升级为标准控件族。

> [!essentials] 核心要点
> - **Header + Items 双能力**：标题一条、条目若干，是 ItemsControl 的"加标题版"
> - **HeaderTemplate**：标题内容复杂时（图标+文字）用模板定制，条目不参与
> - **子类即常用形态**：`Menu`、`TreeView`（其节点是 `TreeViewItem`）、`ToolBar` 都是它的后代
> - **数据绑定**：`ItemsSource` 照常绑定集合，`Header` 也可绑定属性实现标题联动
> - **手动追加**：`Items.Add()` 可运行时追加条目（示例中报警实时追加即此用法）

> [!example] 完整示例
> **报警记录面板演示：Header 显示标题，Items 存放多条报警条目：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="报警记录 - HeaderedItemsControl" Height="450" Width="700"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <!-- TreeView、Expander 等都是 HeaderedItemsControl 的子类 -->
>         <HeaderedItemsControl x:Name="AlarmList" Header="今日报警（3 条）"
>                               Background="#161B22" BorderBrush="#2A4A6C"
>                               BorderThickness="1" Padding="10">
>             <TextBlock Text="[10:12] 电机过热报警" Foreground="#F85149" Margin="0,2"/>
>             <TextBlock Text="[10:30] 压力过高报警" Foreground="#F85149" Margin="0,2"/>
>             <TextBlock Text="[11:05] 通信中断报警" Foreground="#F85149" Margin="0,2"/>
>         </HeaderedItemsControl>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 动态追加条目：调用 Items.Add() 即可实时出现在界面
>             AlarmList.Items.Add(new TextBlock
>             {
>                 Text = "[11:40] 温度超限报警",
>                 Foreground = Brushes.OrangeRed,
>                 Margin = new Thickness(0, 2, 0, 0)
>             });
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 报警/事件记录面板："今日报警"作标题、记录列表作条目，新记录实时追加
> ✅ 通道/点位分组：一组采集通道共用一个组标题，下方列出各通道状态
> ✅ 菜单与工具栏：`Menu` 的每个顶层菜单、`ToolBar` 的每个分组工具条都带标题
> ✅ 树形结构：`TreeViewItem` 的标题 + 子节点集合，是设备树/配方树的基本单元
> ❌ 只有单一内容块没有条目集合（用「headeredcontentcontrol-带标题内容控件」）
> ❌ 条目需要选择、多选、滚动等交互（改用「listbox-列表框」或「listview-列表视图」并自行加标题）

> [!pitfall] 常见踩坑
> 坑 1：**把多个并列内容硬塞进 Items** → 条目过多时布局混乱。原因：Items 是"同结构条目集合"语义，不是自由布局容器。解决：条目结构不同时用 `ContentControl` + 面板组织
>
> 坑 2：**Header 想绑定标题但界面不更新** → 标题是静态的。原因：Header 绑定了普通属性。解决：绑定 `INotifyPropertyChanged` 属性，如"报警条数"变化时自动刷新标题
>
> 坑 3：**Items.Add 大量条目后性能下降** → 界面卡顿。原因：无虚拟化且单条 UI 复杂。解决：条目数大时绑定 `ObservableCollection` 并用支持虚拟化的子类（`TreeView`/`Menu` 内部已处理）
>
> 坑 4：**裸 HeaderedItemsControl 无法选中/展开** → 交互缺失。原因：裸控件只负责展示。解决：需要树形交互用 `TreeView`，需要菜单交互用 `Menu`

> [!best] 最佳实践
> - 实时追加条目统一走 `ObservableCollection` + `ItemsSource`，让增删自动同步到界面
> - 标题要做成"动态计数"时，把计数放进 ViewModel 属性，Header 直接绑定
> - 需要树形结构优先 `TreeView`，它的 `TreeViewItem` 天然就是"标题+子条目"递归结构
> - 自定义"带标题的列表控件"时继承 HeaderedItemsControl，避免重新实现 Header 逻辑
> - 条目外观统一用 `ItemTemplate`，标题外观用 `HeaderTemplate`，两者各司其职

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，在按钮事件里连续 `AlarmList.Items.Add` 三条报警，观察面板自动增长
> **Lv.2 小试牛刀**：把 `Header` 改成绑定"今日报警（{0} 条）"格式的属性，报警数变化时标题自动更新
> **Lv.3 融会贯通**：用 `TreeView` 构建设备树：厂区→产线→设备三层，标题为各层名称、子项为下一层集合
> **Lv.4 挑战**：自定义一个继承 HeaderedItemsControl 的 `AlarmPanel`：Header 内置红色圆点闪烁（报警存在时），条目支持按严重等级筛选显示

> [!related] 相关知识链接
> - ← 前置知识：「itemscontrol-条目控件」掌握"数据+模板"模型；「headeredcontentcontrol-带标题内容控件」了解 Header 概念
> - → 后续必学：「menu-菜单栏」「toolbar-工具栏」是它的可交互子类；「treeview-树形控件」节点即"标题+子条目"
> - ⇄ 关联概念：「expander-折叠面板」是"标题+可折叠内容"的另一形态
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.headereditemscontrol
