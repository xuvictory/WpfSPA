---
title: TextBox 文本框
section: 04-controls
parent: 4.3 文本类控件
---

# TextBox 文本框

> [!plain] 白话理解
> 上位机里凡是"要输入一个值"的地方基本都用 `TextBox`：温度设定、IP 地址、配方名称、备注说明。它是最通用的单行/多行文本输入控件——用户敲键盘，程序通过 `Text` 属性读走内容。
> 几个实战关键点：`MaxLength` 限制长度防止误输、`AcceptsReturn` 决定能不能按回车换行（多行备注用）、`TextChanged` 在输入过程中实时响应（如即时校验）。它虽不擅长"只显示"（那是 `TextBlock` 的活），但"读入-校验-下发"这条参数链路它全程参与。

> [!def] 官方定义
> TextBox 是 WPF 中用于"单行或多行文本输入"的控件，位于 `System.Windows.Controls` 命名空间。核心属性：`Text`（当前文本）、`MaxLength`（最大字符数）、`AcceptsReturn`（是否接受回车换行）、`AcceptsTab`（是否接受 Tab 字符）、`TextWrapping`（换行）、`VerticalScrollBarVisibility`（多行时滚动条）。核心事件 `TextChanged`（文本变化时触发，注意它在每次输入都会触发）。支持 `Text="{Binding ...}"` 双向绑定与 `IsReadOnly` 只读模式。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.textbox

> [!origin] 由来背景
> 文本框是所有图形界面的"万年基石"，但 WinForms 的 TextBox 功能偏基础：多行要切换 `Multiline`、换行与 Tab 行为要单独配置、字符校验全靠事件里手写。WPF 对 TextBox 做了系统性增强：`AcceptsReturn`/`AcceptsTab` 把"换行、Tab"从隐式行为变成显式开关；`TextWrapping` 与滚动条让多行文本编辑体验接近文本编辑器；`Text` 属性天然支持双向数据绑定，输入内容可直接写回 ViewModel。对上位机而言，参数下发、日志备注、连接串配置等所有"人工输入"场景统一收敛到这一个控件，配合 `MaxLength` 与校验逻辑即可满足工业规范。

> [!essentials] 核心要点
> - **Text 读写**：`Text` 是输入的核心出口，取值前务必做类型与范围校验
> - **单行/多行**：`AcceptsReturn="True"` + `TextWrapping` + 垂直滚动条组合出多行输入
> - **MaxLength**：限制长度是工业参数防误输的第一道闸
> - **TextChanged 陷阱**：每次击键都触发，不要在事件里做重活或循环触发 UI 更新
> - **双向绑定**：`Text="{Binding 参数, UpdateSourceTrigger=PropertyChanged}"` 输入即写回
> - **只读模式**：`IsReadOnly="True"` 用于显示"不可编辑但可选中复制"的文本

> [!example] 完整示例
> **参数下发窗口演示：Text、AcceptsReturn、MaxLength、TextChanged 与输入校验：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="参数下发 - TextBox" Height="420" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Width="360">
>         <TextBlock Text="目标温度（℃）：" Foreground="White"/>
>         <TextBox x:Name="txtTemp" Text="25.0" Margin="0,4,0,10" Padding="6"
>                  MaxLength="8" ToolTip="范围 0.0 ~ 100.0"/>
>
>         <TextBlock Text="备注说明（支持回车换行）：" Foreground="White"/>
>         <TextBox x:Name="txtRemark" AcceptsReturn="True" TextWrapping="Wrap"
>                  Height="80" VerticalScrollBarVisibility="Auto"
>                  Margin="0,4,0,10" Padding="6"/>
>
>         <CheckBox x:Name="chkEnable" Content="下发后立即生效" IsChecked="True"
>                   Margin="0,0,0,10" Foreground="White"/>
>         <Button Content="下发参数" Click="OnSend" Padding="8"
>                 Background="#238636" Foreground="White"/>
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
>         private void OnSend(object sender, RoutedEventArgs e)
>         {
>             // 取值 + 校验
>             if (!double.TryParse(txtTemp.Text, out double temp) || temp < 0 || temp > 100)
>             {
>                 MessageBox.Show("温度值不合法，请输入 0.0 ~ 100.0", "校验失败",
>                                 MessageBoxButton.OK, MessageBoxImage.Warning);
>                 return;
>             }
>
>             string remark = string.IsNullOrWhiteSpace(txtRemark.Text) ? "无" : txtRemark.Text;
>             string mode = chkEnable.IsChecked == true ? "立即生效" : "定时生效";
>             MessageBox.Show($"已下发：温度 {temp:F1} ℃\n备注：{remark}\n生效方式：{mode}",
>                             "下发成功");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 参数输入：温度/压力/转速设定值、IP 地址、配方名称等单行输入
> ✅ 多行备注：`AcceptsReturn` + `TextWrapping` 的维护记录、备注说明
> ✅ 实时校验输入：`TextChanged` 中即时校验合法性并给出提示
> ✅ 只读展示可复制：`IsReadOnly` 显示日志内容且允许选中复制
> ❌ 敏感信息输入（用「passwordbox-密码框」，无明文 Text）
> ❌ 富文本排版需求（用「richtextbox-富文本框」）

> [!pitfall] 常见踩坑
> 坑 1：**TextChanged 里做重活** → 每次击键都卡顿。原因：事件每键触发。解决：把校验/处理移出事件或 `Dispatcher.BeginInvoke` 延迟合并
>
> 坑 2：**多行模式没开换行** → 长文字横向溢出。原因：`AcceptsReturn` 开了但 `TextWrapping` 未设置。解决：`TextWrapping="Wrap"` + 垂直滚动条
>
> 坑 3：**`Text` 直接拿去下发/存储** → 空串、越界值引发设备异常。原因：缺少校验。解决：取值后统一 `Trim`、类型解析（`double.TryParse`）、范围钳制
>
> 坑 4：**绑定更新与手动赋值互相覆盖** → 界面值和逻辑值不一致。原因：`UpdateSourceTrigger` 默认 LostFocus，手动改 Text 时绑定没同步。解决：明确设置 `UpdateSourceTrigger`（PropertyChanged 或 Explicit）

> [!best] 最佳实践
> - 数值输入配 `MaxLength` + 输入后 `double.TryParse` 校验，非法值提示并还原
> - 业务属性用双向绑定（`UpdateSourceTrigger=PropertyChanged`），输入即写回 ViewModel
> - 多行文本显式设置 `AcceptsReturn + TextWrapping + VerticalScrollBarVisibility` 三件套
> - 校验逻辑放 ViewModel 属性 setter 或独立校验服务，不堆在 TextChanged 里
> - 大文本（如日志）用 `IsReadOnly` 展示，避免误编辑，同时保留复制能力

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，在"温度设定"输入非法字符，观察提示与回退逻辑
> **Lv.2 小试牛刀**：给"IP 地址"输入框加 `MaxLength=15` 和正则校验，非法时边框变红
> **Lv.3 融会贯通**：把温度输入改成双向绑定到 ViewModel 属性，按钮读取 `Temperature` 属性下发
> **Lv.4 挑战**：实现"数字输入专用 TextBox"：继承 TextBox，仅允许数字/小数点/负号，实时高亮非法字符，暴露 `Value` 依赖属性

> [!related] 相关知识链接
> - ← 前置知识：「textblock-轻量文本」区分只读/可编辑文本；第 5 章「什么是数据绑定」掌握双向绑定
> - → 后续必学：「passwordbox-密码框」敏感输入；「richtextbox-富文本框」排版文档
> - ⇄ 关联概念：「label-标签」`Target` 聚焦输入框；「repeatbutton-重复按钮」配合做数值微调
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.textbox
