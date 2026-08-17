---
title: ICommand 实现（RelayCommand 系列）
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# ICommand 实现（RelayCommand 系列）

> [!plain] 白话理解
> 按钮被点击后要"干一件事"——传统写法是 `Click="OnDownloadClick"`，逻辑写在窗体 code-behind 里，业务和界面绑在一起，测试还得开窗口。RelayCommand 的思路是：**把"一件事"本身变成一个对象（命令）**，按钮只负责说"我触发命令了"。
> 命令对象自带两个开关：`CanExecute`（能不能执行，为 false 时按钮自动置灰）和 `Execute`（执行什么）。好比车间里的"设备启动键"：急停未复位时按下没反应、键帽还是灰的——这正是 `CanExecute` 在起作用。
> 你只要写一个通用 `RelayCommand`（转发命令），把所有按钮动作都变成命令对象，ViewModel 就能在不依赖任何控件的情况下承载全部操作逻辑。

> [!def] 官方定义
> `ICommand` 是 `System.Windows.Input` 命名空间的 .NET 官方接口，WPF 所有可点击控件（`Button`/`MenuItem` 等）都通过它把"用户动作"转发给业务逻辑：
> ```csharp
> public interface ICommand
> {
>     bool CanExecute(object parameter);          // 能否执行：false 时控件自动禁用
>     void Execute(object parameter);             // 执行动作
>     event EventHandler CanExecuteChanged;       // 可用性变化通知
> }
> ```
> `RelayCommand` 是社区对 `ICommand` 的标准实现（非微软官方类），把方法委托包装成命令对象；官方派生的 `RoutedCommand` 面向路由事件，MVVM 实践中几乎不用。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.icommand

> [!origin] 由来背景
> WPF 在 2006 年引入 `ICommand` 是想统一"菜单、按钮、快捷键、手势都触发同一个动作"的语义（此前每个控件一套事件）。但官方自带的命令要么绑定固定的 `RoutedCommand` 路由机制，要么写一堆样板。
> MVVM 兴起后（2008 年前后），社区发现：ViewModel 里**每个动作都实现一个 ICommand 类太啰嗦**。于是 Laurent Bugnion（MVVM Light 作者）等前辈设计出 `RelayCommand`——把"动作"和"可用性判断"两个委托包进一个通用命令类，ViewModel 一行 `DownloadCommand = new RelayCommand(Download, () => SelectedRecipe != null)` 就能得到一个完整命令。如今 CommunityToolkit.Mvvm 的 `[RelayCommand]` 源生成器是它的现代演进。

> [!essentials] 核心要点
> - **三大成员各司其职**：`Execute` 干实事；`CanExecute` 只做"能不能"的快速判断；`CanExecuteChanged` 通知 WPF 重新询问 CanExecute
> - **CanExecute 不自动刷新**：状态变了要手动 `RaiseCanExecuteChanged()`（示例在 `SelectedRecipe` setter 里调用），否则按钮不会自己变灰/变亮
> - **泛型版本**：需要传参数时用 `RelayCommand<T>`，`CommandParameter` 在绑定中传入（见「command-绑定」）
> - **异步版本**：`AsyncRelayCommand` 支持 `async Task`，内部处理 `await` 期间的自动禁用与异常（见「communitytoolkitmvvm推荐」）
> - **构造注入依赖**：命令要用的服务（串口/PLC/仓储）从构造函数注入，测试时替换为 mock
> - **CanExecute 高频调用**：WPF 在焦点/输入等时机频繁调用它，只读状态、零副作用（见「command-绑定」踩坑）

> [!example] 完整示例
> **RelayCommand 完整实现演示：手写 ICommand 的三个核心成员（CanExecute / Execute / CanExecuteChanged），配方下发前必须已选择配方，否则"下发"按钮自动禁用：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ICommand 实现 - RelayCommand" Height="340" Width="400"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="配方管理" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="选择配方" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <ComboBox ItemsSource="{Binding Recipes}" SelectedItem="{Binding SelectedRecipe}"
>                   Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         <Button Content="下发配方" Command="{Binding DownloadCommand}" Padding="8"
>                 Margin="0,15,0,0" Background="#21262D" Foreground="White"
>                 HorizontalAlignment="Left"/>
>         <TextBlock Text="{Binding Feedback}" Foreground="#238636" Margin="0,10,0,0"
>                    TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— RelayCommand 系列完整实现：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private string _selectedRecipe;
>         private string _feedback = "请先选择配方";
>
>         public List<string> Recipes { get; } = new List<string> { "配方A-高速", "配方B-标准", "配方C-节能" };
>
>         public string SelectedRecipe
>         {
>             get => _selectedRecipe;
>             set
>             {
>                 _selectedRecipe = value;
>                 OnPropertyChanged(nameof(SelectedRecipe));
>                 DownloadCommand.RaiseCanExecuteChanged(); // 选择变化后刷新按钮可用性
>             }
>         }
>
>         public string Feedback
>         {
>             get => _feedback;
>             private set { _feedback = value; OnPropertyChanged(nameof(Feedback)); }
>         }
>
>         public RelayCommand DownloadCommand { get; }
>
>         public MainViewModel()
>         {
>             // CanExecute：未选择配方时返回 false，按钮自动禁用
>             DownloadCommand = new RelayCommand(Download, () => SelectedRecipe != null);
>         }
>
>         private void Download()
>         {
>             Feedback = "配方 [" + SelectedRecipe + "] 已下发到 PLC";
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // ICommand 标准实现：RelayCommand，支持无参 / 有参 / CanExecute 三种用法
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         private readonly Func<bool> _canExecute;
>
>         public RelayCommand(Action execute, Func<bool> canExecute = null)
>         {
>             _execute = execute;
>             _canExecute = canExecute;
>         }
>
>         // ICommand 成员 1：判断命令当前是否可执行（WPF 据此禁用按钮）
>         public bool CanExecute(object parameter) => _canExecute == null || _canExecute();
>
>         // ICommand 成员 2：执行命令动作
>         public void Execute(object parameter) => _execute();
>
>         // ICommand 成员 3：可用性变化通知，手动调用即可刷新绑定它的控件
>         public void RaiseCanExecuteChanged() =>
>             CanExecuteChanged?.Invoke(this, EventArgs.Empty);
>
>         public event EventHandler CanExecuteChanged;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel(); // 绑定数据源：ViewModel 承载全部业务
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 按钮/菜单/快捷键共用一个动作：启动、停止、下发配方、导出报表
> ✅ 有前置条件的动作：未选配方时"下发"置灰、急停未复位时"启动"禁用、连接未建立时"读取"不可点
> ✅ 需要单元测试的业务动作：命令与 UI 解耦，测试里直接调用 `command.Execute()` 断言结果
> ✅ 参数化动作：同一"删除"命令处理不同设备（`CommandParameter` 传对象）
> ❌ 纯展示的静态界面：没有用户动作就没有命令
> ❌ 极端高频调用（如每毫秒一次的采集脉冲）：命令包装有少量开销，直接方法调用更合适

> [!pitfall] 常见踩坑
> 坑 1：**状态变了忘了 `RaiseCanExecuteChanged`** → 字段已更新但按钮不变灰/变亮。凡 `CanExecute` 依赖的状态变化处（setter/Execute 内），都要补一次刷新
>
> 坑 2：**`CanExecute` 里做耗时/副作用操作** → WPF 高频调用它，写日志、查数据库会让界面卡顿甚至产生重复副作用。CanExecute 只读字段、做瞬时判断
>
> 坑 3：**`async void` 裸奔** → Execute 里 `async void` 的异常逃逸到 UI 线程直接崩程序。用 `AsyncRelayCommand` 或自包 try/catch（异常隔离思想见「viewmodel-间的通信」）
>
> 坑 4：**把 ICommand 当事件用** → 绑定命令后还在 code-behind 写 `Click` 事件，命令状态机与事件互相打架。同一动作只选一种入口
>
> 坑 5：**每个按钮 new 一个命令** → 多个按钮语义相同却各建命令，状态同步困难。共享命令 + `CommandParameter` 区分

> [!best] 最佳实践
> - **命名以 `Command` 结尾**：`DownloadCommand`、`StopCommand`，一眼识别命令属性
> - **命令属性只读、构造初始化**：`public RelayCommand DownloadCommand { get; }`，构造函数里 new，避免运行中被替换
> - **CanExecute 用 lambda 引用状态**：`() => SelectedRecipe != null` 直接读属性，状态一变更就反映；不要传字段快照
> - **优先 `[RelayCommand]` 源生成器**：CommunityToolkit.Mvvm 自动生成 `DownloadCommand`/`CanDownload`，且异步/泛型/取消令牌开箱即用（见「communitytoolkitmvvm推荐」）
> - **命令内只管编排**：命令方法里调服务、发消息，自己不做数据库/串口细节（见「数据访问repository-模式」）
> - **测试命令如测试方法**：断言 `CanExecute` 前置条件与 `Execute` 副作用，不依赖 UI

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，不选配方时"下发配方"按钮置灰；选择配方后按钮点亮，点击后反馈文本显示"已下发到 PLC"——全程无一行 `Click` 事件代码
> **Lv.2 小试牛刀**：新增"清空选择"命令：`CanExecute` 依赖 `SelectedRecipe != null`，Execute 把 `SelectedRecipe` 置 null；注意命令之间互相触发 `RaiseCanExecuteChanged` 的顺序
> **Lv.3 融会贯通**：写一个泛型 `RelayCommand<T>`（`Action<T> execute` + `Predicate<T> canExecute`），把"下发配方"改成 `RelayCommand<string>` 并绑定 `CommandParameter="{Binding SelectedItem, ElementName=combo}"`，验证参数传递
> **Lv.4 挑战自我**：实现 `AsyncRelayCommand`：支持 `async Task` 执行、执行期间自动禁用（`IsExecuting` 参与 CanExecute）、异常捕获转 `Feedback` 显示；为它写单元测试：启动慢任务时 `CanExecute` 为 false，完成后恢复 true

> [!related] 相关知识链接
> - ← 前置知识：[inotifypropertychanged-实现](./inotifypropertychanged-实现.md)（命令可用性通知与属性通知的配合）；[什么是-mvvm](./什么是-mvvm.md)（命令在 MVVM 三层中的位置）
> - → 后续必学：[command-绑定](./command-绑定.md)（命令如何绑定到按钮、CommandParameter 传参）；[数据验证逻辑](./数据验证逻辑.md)（CanExecute 与验证规则双保险）
> - ⇄ 关联概念：[viewmodel-间的通信](./viewmodel-间的通信.md)（命令执行后如何通知其他 VM）；[communitytoolkitmvvm推荐](./communitytoolkitmvvm推荐.md)（`[RelayCommand]` 源生成器）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.input.icommand （ICommand 接口定义）
