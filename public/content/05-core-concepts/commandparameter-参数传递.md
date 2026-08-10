---
title: CommandParameter 参数传递
section: 05-core-concepts
parent: 5.3 命令系统
---

# CommandParameter 参数传递

> [!plain] 白话理解
> 你的工具条上有 8 个设备控制按钮，每个都要启动不同的设备。如果每个按钮都要一个单独的 `StartMotorCommand`、`StartVfdCommand`、`StartPlcCommand`... 你会疯掉。`CommandParameter` 就是来解决这个问题的——它让**同一个命令，接收不同的参数，做不同的事**。你把 8 个按钮都绑定到同一个 `StartCommand`，然后用 `CommandParameter="M-101"`、`CommandParameter="VFD-01"` 来区分是哪个设备。在命令的 `Execute` 方法中，通过 `parameter` 参数拿到这个值，再做分发。一个命令搞定 8 个按钮。

> [!def] 官方定义
> `CommandParameter` 是 `ICommandSource`（Button、MenuItem、KeyBinding 等实现了该接口的控件）上的一个依赖属性。它在 XAML 中通过 `CommandParameter="..."` 赋值，在命令的 `Execute(object? parameter)` 和 `CanExecute(object? parameter)` 方法中以 `object?` 类型传入。CommandParameter 支持任何类型——可以直接写字符串、绑定 `{Binding}` 传当前 DataContext、用 `{Binding ElementName=xxx, Path=SelectedItem}` 传选中的对象，甚至用 `MultiBinding` 传递多个值。

> [!origin] 由来背景
> WPF 最初设计命令系统时，就考虑到"一个命令多个来源"的场景。如果每个按钮都需要独立的命令对象，控件库会变得非常臃肿。`CommandParameter` 的设计灵感来自设计模式中的 Command 模式的 `Execute(parameters)` 方法，以及 ASP.NET 中 `CommandName` + `CommandArgument` 的模式。到了 .NET 4.0，又强化了绑定功能——CommandParameter 支持 `{x:Static}`、`{DynamicResource}`、`MultiBinding` 等高级绑定语法，使得参数传递更加灵活。

> [!essentials] 核心要点
> - **字符串字面量**：`CommandParameter="M-101"` ——最简单的用法
> - **Binding 传对象**：`CommandParameter="{Binding}"` ——传当前 DataContext
> - **ElementName 绑定**：`CommandParameter="{Binding ElementName=listBox, Path=SelectedItem}"`
> - **MultiBinding 传多参数**：需要实现 IMultiValueConverter 组装
> - **内置命令的参数**：`ApplicationCommands.Copy` 忽略 parameter；`NavigationCommands.Search` 使用 parameter 作为搜索词

> [!example] 完整示例
>
> 一个上位机报警管理系统——同一个命令处理不同设备的报警操作：
>
> **AlarmPanelViewModel.cs**
 ```csharp
using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace HmiDemo;

public class AlarmItem
{
    public string DeviceId { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime Time { get; set; }
    public string Level { get; set; } = "警告";
}

public class AlarmPanelViewModel : INotifyPropertyChanged
{
    public ObservableCollection<AlarmItem> Alarms { get; } = new();

    private AlarmItem? _selectedAlarm;
    public AlarmItem? SelectedAlarm
    {
        get => _selectedAlarm;
        set { _selectedAlarm = value; OnPropertyChanged(); }
    }

    private string _log = "";
    public string Log
    {
        get => _log;
        set { _log = value; OnPropertyChanged(); }
    }

    // ═══ 同一个命令，通过 CommandParameter 区分操作 ═══
    public ICommand AlarmActionCommand { get; }

    public AlarmPanelViewModel()
    {
        // 模拟报警数据
        Alarms.Add(new AlarmItem { DeviceId = "M-101", Message = "过载停机", Time = DateTime.Now.AddMinutes(-5), Level = "严重" });
        Alarms.Add(new AlarmItem { DeviceId = "VFD-01", Message = "温度偏高", Time = DateTime.Now.AddMinutes(-3), Level = "警告" });
        Alarms.Add(new AlarmItem { DeviceId = "CPU2", Message = "通信超时", Time = DateTime.Now.AddMinutes(-1), Level = "严重" });
        Alarms.Add(new AlarmItem { DeviceId = "S-101", Message = "传感器漂移", Time = DateTime.Now, Level = "提示" });

        AlarmActionCommand = new RelayCommand(param =>
        {
            string action = param?.ToString() ?? "未知操作";
            var alarm = SelectedAlarm;

            switch (action)
            {
                case "Confirm":
                    Log = $"[确认] {alarm?.DeviceId} - {alarm?.Message}";
                    break;
                case "Silence":
                    Log = $"[静音] {alarm?.DeviceId} 报警静音 60 秒";
                    break;
                case "Details":
                    Log = $"[详情] 打开 {alarm?.DeviceId} 的诊断页面";
                    break;
                case "Dismiss":
                    if (alarm != null) Alarms.Remove(alarm);
                    Log = $"[解除] {alarm?.DeviceId} 报警已清除";
                    break;
            }
        }, _ => SelectedAlarm != null);  // 只有选中报警项才能操作
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
        Title="CommandParameter — 报警管理" Height="500" Width="750"
        WindowStartupLocation="CenterScreen">

    <Window.DataContext>
        <local:AlarmPanelViewModel/>
    </Window.DataContext>

    <Grid Background="#0D1117" Margin="15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <TextBlock Text="报警管理 — CommandParameter 参数传递"
                   Foreground="#FF6B35" FontSize="16"
                   FontWeight="Bold" Margin="0,0,0,10"/>

        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="15"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>

            <!-- 报警列表 -->
            <ListBox Grid.Column="0" x:Name="listAlarms"
                     ItemsSource="{Binding Alarms}"
                     SelectedItem="{Binding SelectedAlarm}"
                     Background="#161B22" BorderBrush="#30363D">
                <ListBox.ItemTemplate>
                    <DataTemplate>
                        <Border Padding="8" Margin="0,2"
                                Background="#0D1117" CornerRadius="4">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Foreground="#FF6B35" FontWeight="Bold"
                                           Width="70" Text="{Binding DeviceId}"
                                           VerticalAlignment="Center"/>
                                <TextBlock Foreground="White" Width="140"
                                           Text="{Binding Message}"
                                           VerticalAlignment="Center"/>
                                <TextBlock Foreground="#999" Width="80"
                                           Text="{Binding Time, StringFormat='HH:mm:ss'}"
                                           VerticalAlignment="Center"/>
                                <TextBlock Foreground="#D4A017" FontWeight="Bold"
                                           Text="{Binding Level}"
                                           VerticalAlignment="Center"/>
                            </StackPanel>
                        </Border>
                    </DataTemplate>
                </ListBox.ItemTemplate>
            </ListBox>

            <!-- 操作按钮：同一个命令，不同 CommandParameter -->
            <StackPanel Grid.Column="2" VerticalAlignment="Top"
                        Width="120">
                <TextBlock Text="报警操作" Foreground="#AAA"
                           FontSize="12" Margin="0,0,0,8"/>
                <!-- 所有按钮绑定同一个 AlarmActionCommand，用 CommandParameter 区分 -->
                <Button Content="✓ 确认报警" Height="34"
                        Margin="0,2" Background="#3FB950"
                        Foreground="White"
                        Command="{Binding AlarmActionCommand}"
                        CommandParameter="Confirm"/>
                <Button Content="🔇 暂时静音" Height="34"
                        Margin="0,2" Background="#161B22"
                        Foreground="#D4A017" BorderBrush="#D4A017"
                        Command="{Binding AlarmActionCommand}"
                        CommandParameter="Silence"/>
                <Button Content="📋 查看详情" Height="34"
                        Margin="0,2" Background="#161B22"
                        Foreground="#3FB950" BorderBrush="#3FB950"
                        Command="{Binding AlarmActionCommand}"
                        CommandParameter="Details"/>
                <Button Content="✕ 解除报警" Height="34"
                        Margin="0,2" Background="#CC2222"
                        Foreground="White"
                        Command="{Binding AlarmActionCommand}"
                        CommandParameter="Dismiss"/>

                <TextBlock Text="提示：先选中一个报警项"
                           Foreground="#666" FontSize="11"
                           Margin="0,10,0,0" TextWrapping="Wrap"/>
            </StackPanel>
        </Grid>

        <Border Grid.Row="2" Background="#161B22"
                CornerRadius="6" Padding="10" Margin="0,8,0,0">
            <TextBlock Text="{Binding Log}" Foreground="#3FB950"
                       FontFamily="Consolas" FontSize="12"/>
        </Border>
    </Grid>
</Window>
 ```
>
> 运行后：先选中一个报警 → 四个按钮都能点击 → 同一个 `AlarmActionCommand`，通过不同的 `CommandParameter`（Confirm/Silence/Details/Dismiss）执行不同的逻辑。

> [!scene] 适用场景
> ✅ 工具条/操作面板上多个按钮做同类操作（如批量启动、批量停止）
> ✅ 列表/表格中每行的操作按钮（"编辑这条"/"删除这条"）
> ✅ 菜单项共用命令——通过 CommandParameter 区分菜单项
> ✅ KeyBinding 绑定同一个命令不同快捷键
> ❌ 每个操作有完全不同的 CanExecute 条件——拆成独立命令更清晰

> [!pitfall] 常见踩坑
> 坑 1：**CommandParameter 在 DataTemplate 中传的不是列表项** → `CommandParameter="{Binding}"` 在 DataTemplate 内指的是当前行的 DataContext。但如果用了 `RelativeSource` 混淆，可能拿到错误的绑定源。
>
> 坑 2：**CommandParameter 是字符串但 Execute 的 parameter 是 null** → XAML 中写了 `CommandParameter="Confirm"` 但实际绑定有问题（如控件没实现 ICommandSource）。检查按钮的 `Command` 属性是否正确绑定。
>
> 坑 3：**传 IDataErrorInfo 的 model 对象时 CanExecute 接收不到** → `CanExecute` 在命令绑定时就被调用一次，如果当时 SelectedItem 为 null，CanExecute 返回 false——即使后续选中了对象，如果不触发 `CanExecuteChanged`，按钮也不更新。

> [!best] 最佳实践
> - 同一类操作（如"启动 xxx 设备"）共享一个命令，用 CommandParameter 传设备 ID
> - 用枚举值代替魔法字符串——`CommandParameter="{x:Static local:AlarmAction.Confirm}"`
> - 列表中操作按钮的 CommandParameter 传当前行对象——`CommandParameter="{Binding}"`
> - 复杂参数用 `MultiBinding` + `IMultiValueConverter` 打包

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的报警管理，选中不同报警执行不同操作，观察同一个命令不同参数的效果
> **Lv.2 小试牛刀**：改造为用枚举值（Confirm/Silence/Details/Dismiss）替代字符串 CommandParameter
> **Lv.3 融会贯通**：实现一个"设备批量控制器"——左侧 CheckBox 勾选 50 台设备，右侧一个"启动选中"按钮，CommandParameter 传 SelectedItems 列表，命令中批量处理

> [!related] 相关知识链接
> - ← 前置知识：MVVM 中的命令（RelayCommand）
> - → 后续必学：数据绑定（Binding 与 CommandParameter 的深度结合）
> - ⇄ 关联概念：MultiBinding、IMultiValueConverter、ICommandSource
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.icommandsource.commandparameter
