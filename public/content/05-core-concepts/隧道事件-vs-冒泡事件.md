---
title: 隧道事件 vs 冒泡事件
section: 05-core-concepts
parent: 5.2 路由事件
---

# 隧道事件 vs 冒泡事件

> [!plain] 白话理解
> 隧道（Tunneling）和冒泡（Bubbling）像是事件在控件树上的**两班列车**——隧道列车先出发，从顶层 Window 站出发，一路经过 Grid 站、Border 站，最终到达被点击的 Button 站；隧道列车走后，冒泡列车立刻出发，从 Button 站原路返回，一路经过 Border 站、Grid 站，最终到达 Window 站。两班列车载的是**同一批乘客**（同一个 RoutedEventArgs 实例）——隧道列车上的乘客如果在车上做了标记（Handled=true），冒泡列车就不会出发了。这种"先预览后执行"的机制，是 WPF 输入系统最精妙的设计之一。

> [!def] 官方定义
> 隧道事件（Tunneling Events）以 `Preview` 前缀命名，沿可视树从根向源传递，由 `RoutingStrategy.Tunnel` 注册。冒泡事件（Bubbling Events）去掉 Preview 前缀，沿可视树从源向根传递，由 `RoutingStrategy.Bubble` 注册。两者共享同一个 `RoutedEventArgs` 实例，隧道事件先触发，冒泡事件后触发。如果在隧道事件处理器中设置了 `e.Handled = true`，对应的冒泡事件将不会触发。这一机制用于实现"操作前拦截/校验"模式（如权限检查、输入验证、拖放预览）。

> [!origin] 由来背景
> 1999 年，W3C 在 DOM Level 2 Events 规范中定义了事件流的三个阶段：捕获阶段（capturing phase）→ 目标阶段（target phase）→ 冒泡阶段（bubbling phase）。WPF 团队参考了这个设计，但做了面向 UI 框架的适配：(1) 把"捕获阶段"重命名为更容易理解的"隧道阶段"；(2) 给隧道阶段的事件统一加 `Preview` 前缀，命名规范自解释；(3) 隧道/冒泡共享同一个事件参数实例，使得隧道阶段的"否决"能直接阻止冒泡阶段。这种设计在 Silverlight、UWP、WinUI 中一直沿用至今。

> [!essentials] 核心要点
> - **命名规则**：隧道事件 = `Preview` + 冒泡事件名（如 `PreviewMouseDown` → `MouseDown`）
> - **触发顺序固定**：隧道阶段 → 事件源 → 冒泡阶段，中间不插入其他事件
> - **共享同一个 EventArgs**：隧道阶段设 `Handled=true`，冒泡阶段直接跳过
> - **不是所有事件都有隧道版**：`Button.Click` 是合成事件（由 MouseDown+MouseUp 合成），没有 PreviewClick
> - **隧道事件的常见用途**：全局快捷键拦截、拖放预览（DragOver）、权限验证

> [!example] 完整示例
>
> 一个"操作权限拦截器"——用隧道事件实现按钮点击前的权限校验：
>
> **MainWindow.xaml**
 ```xml
<Window x:Class="HmiDemo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="隧道 vs 冒泡 — 权限拦截" Height="500" Width="700"
        WindowStartupLocation="CenterScreen">

    <!-- 在 Window 层用隧道事件做全局拦截 -->
    <Grid Background="#0D1117" Margin="15"
          PreviewMouseDown="OnGridPreviewMouseDown"
          MouseDown="OnGridMouseDown">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <StackPanel Grid.Row="0">
            <TextBlock Text="权限拦截演示 — 隧道事件先于冒泡"
                       Foreground="#FF6B35" FontSize="16"
                       FontWeight="Bold" Margin="0,0,0,8"/>
            <StackPanel Orientation="Horizontal">
                <RadioButton x:Name="rbAdmin" Content="管理员（有权限）"
                             Foreground="#3FB950" IsChecked="True"
                             Margin="0,0,15,0"
                             Checked="OnRoleChanged"/>
                <RadioButton x:Name="rbOperator" Content="操作员（部分权限）"
                             Foreground="#D4A017"
                             Checked="OnRoleChanged"/>
            </StackPanel>
        </StackPanel>

        <StackPanel Grid.Row="1" Orientation="Vertical"
                    Margin="0,15,0,0">
            <TextBlock Text="操作面板" Foreground="#FF6B35"
                       FontSize="14" FontWeight="Bold"
                       Margin="0,0,0,10"/>

            <!-- 这些按钮的 Click 事件会被隧道层拦截 -->
            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="电机 M-101" Foreground="White"
                               Width="120" VerticalAlignment="Center"/>
                    <Button Content="启动" Width="80" Height="32"
                            Background="#3FB950" Foreground="White"
                            Margin="5,0" Tag="motor-start"
                            Click="OnAnyButtonClick"/>
                    <Button Content="停止" Width="80" Height="32"
                            Background="#CC2222" Foreground="White"
                            Margin="5,0" Tag="motor-stop"
                            Click="OnAnyButtonClick"/>
                    <Button Content="紧急停机" Width="80" Height="32"
                            Background="#FF0000" Foreground="White"
                            Tag="motor-emergency"
                            Click="OnAnyButtonClick"/>
                </StackPanel>
            </Border>

            <Border Background="#161B22" CornerRadius="6"
                    Padding="12" Margin="0,4">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="系统参数" Foreground="White"
                               Width="120" VerticalAlignment="Center"/>
                    <Button Content="修改参数" Width="80" Height="32"
                            Background="#D4A017" Foreground="White"
                            Margin="5,0" Tag="config-modify"
                            Click="OnAnyButtonClick"/>
                    <Button Content="恢复默认" Width="80" Height="32"
                            Background="#161B22" Foreground="#999"
                            BorderBrush="#555" Tag="config-reset"
                            Click="OnAnyButtonClick"/>
                </StackPanel>
            </Border>

            <Border Background="#161B22" CornerRadius="6"
                    Padding="10" Margin="0,8">
                <StackPanel>
                    <TextBlock Text="事件流监控" Foreground="#999"
                               FontSize="12" FontWeight="Bold"/>
                    <TextBlock x:Name="txtTunnel" Foreground="#D4A017"
                               FontFamily="Consolas" FontSize="11"
                               Margin="0,2,0,0"/>
                    <TextBlock x:Name="txtBubble" Foreground="#3FB950"
                               FontFamily="Consolas" FontSize="11"/>
                    <TextBlock x:Name="txtResult" Foreground="White"
                               FontFamily="Consolas" FontSize="12"
                               FontWeight="Bold" Margin="0,4,0,0"/>
                </StackPanel>
            </Border>
        </StackPanel>
    </Grid>
</Window>
 ```
>
> **MainWindow.xaml.cs**
 ```csharp
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace HmiDemo;

public partial class MainWindow : Window
{
    private bool _isAdmin = true;

    public MainWindow()
    {
        InitializeComponent();
    }

    private void OnRoleChanged(object sender, RoutedEventArgs e)
    {
        _isAdmin = rbAdmin.IsChecked == true;
    }

    /// <summary>
    /// 隧道事件——在事件到达按钮之前拦截
    /// </summary>
    private void OnGridPreviewMouseDown(object sender, MouseButtonEventArgs e)
    {
        txtTunnel.Text = $"[隧道] PreviewMouseDown 到达 Grid — "
            + $"Source={e.Source.GetType().Name}";

        // 判断用户点击的是哪个按钮
        if (e.Source is Button btn && btn.Tag != null)
        {
            string action = btn.Tag.ToString()!;

            // 权限判断：非管理员禁止"紧急停机"和"修改参数"
            if (!_isAdmin
                && (action == "motor-emergency"
                    || action == "config-modify"))
            {
                e.Handled = true;  // ← 阻止冒泡事件（Click 不会触发）
                txtResult.Text = $"❌ 权限不足！[隧道阶段拦截] {action}";

                // 此时冒泡事件 MouseDown 和 Click 都不会触发！
                txtBubble.Text = "[冒泡] (被隧道阶段 Handled=true 阻止)";
                return;
            }
        }

        txtResult.Text = "✓ 操作允许";
    }

    /// <summary>
    /// 冒泡事件——如果没被隧道阶段拦截，正常运行
    /// </summary>
    private void OnGridMouseDown(object sender, MouseButtonEventArgs e)
    {
        txtBubble.Text = $"[冒泡] MouseDown 到达 Grid — "
            + $"Source={e.Source.GetType().Name}";
    }

    /// <summary>
    /// Button.Click——只有当隧道和大张的冒泡都没被 Handled 时才会触发
    /// </summary>
    private void OnAnyButtonClick(object sender, RoutedEventArgs e)
    {
        if (e.Source is Button btn)
            txtResult.Text += $"\n[Click] 按钮操作已执行: {btn.Tag}";
    }
}
 ```
>
> 运行后：
> - 选"管理员" → 点击任何按钮，隧道通过，冒泡正常，Click 执行
> - 选"操作员" → 点击"紧急停机"或"修改参数"，隧道阶段设置 `Handled=true`，Click 被阻止
> - 这就是隧道事件在实际项目中最典型的使用场景——**权限拦截**

> [!scene] 适用场景
> ✅ 隧道事件做"前置校验"：权限检查、输入过滤、操作确认
> ✅ 隧道事件做"全局拦截"：Window 层截获所有 Escape 键关闭弹窗
> ✅ 冒泡事件做"后置处理"：操作日志记录、状态栏更新
> ✅ 拖放操作：`PreviewDragOver` 决定允许拖放的目标区域
> ❌ 简单的事件响应——直接用冒泡或 Click 就够，不必非要用隧道

> [!pitfall] 常见踩坑
> 坑 1：**隧道中也注册了冒泡也注册了，出现"双倍执行"** → 如果你在 Grid 的 PreviewMouseDown 和 MouseDown 中都写了相同的业务逻辑，操作一次会执行两次。解决方案：明确分工——隧道做校验，冒泡做业务。
>
> 坑 2：**Click 事件背后是 MouseDown，但在隧道阶段拦截 MouseDown 后 Click 也失效了** → Click = MouseDown + MouseUp 的组合。如果 PreviewMouseDown 设 Handled=true，Click 完全不会触发。
>
> 坑 3：**"为什么我的 Preview 事件没有被触发？"——因为你注册错了层** → 隧道事件从 Window 开始，如果你只在 Button 上注册 `PreviewMouseDown`，只有在点击 Button 时按钮层才能收到（但此时隧道已近终点）。

> [!best] 最佳实践
> - 全局级别的拦截（权限、快捷键）写在最外层（Window 或顶层 Grid）的隧道事件
> - 隧道事件处理器要保持轻量——它在 UI 线程上同步执行，卡顿会直接影响用户体验
> - 不要在隧道事件中弹出 MessageBox——它会打断输入流程，造成奇怪的焦点问题
> - 日志记录、状态更新等"副业"统一丢到冒泡阶段

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的权限拦截器，分别用管理员和操作员身份操作，观察隧道和冒泡的触发差异
> **Lv.2 小试牛刀**：在上例中添加键盘权限拦截——Window 层 PreviewKeyDown 中拦截操作员按 F5 刷新键
> **Lv.3 融会贯通**：实现一个"二次确认"系统——在特定危险按钮的 PreviewMouseDown 隧道事件中，不直接 Handled，而是弹出一个确认面板（非 MessageBox），用户确认后才放行

> [!related] 相关知识链接
> - ← 前置知识：路由策略、路由事件参数
> - → 后续必学：路由事件实战技巧
> - ⇄ 关联概念：Click（合成事件）、MouseDown、KeyDown
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/input-overview#tunneling-and-bubbling-events
