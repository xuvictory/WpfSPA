---
title: Window 常用方法（Show、ShowDialog 等）
section: 01-quickstart
parent: 1.4 窗口 Window 详解
---

# Window 常用方法（Show、ShowDialog 等）

> [!plain] 白话理解
> 打开窗口有两种姿势："你随便看，我去忙别的了"（Show）和"你不看完不许走"（ShowDialog）。Show 就像放了个电视在边上，你可以看也可以不看，随时可以操作其他窗口；ShowDialog 就像被人拉住要你看完一部电影——不关掉这个窗口，你碰不了其他窗口。上位机中：报警弹窗用 Show（你可以一边看报警一边操作主界面），参数配置对话框用 ShowDialog（配置完了确认才能继续操作）。

> [!def] 官方定义
> Window 类提供两组核心方法用于显示窗口：`Show()`——以非模态（modeless）方式打开窗口，不阻塞调用方代码，用户可自由切换窗口；`ShowDialog()`——以模态（modal）方式打开窗口，阻塞调用方代码直到该窗口关闭，返回 `bool?`（DialogResult）。配套方法包括 `Hide()`（隐藏窗口）、`Close()`（关闭窗口并触发 Closing/Closed 事件）、`Activate()`（激活窗口并获得焦点）、`DragMove()`（支持无边框窗口拖拽移动）。

> [!origin] 由来背景
> 模态/非模态窗口的概念早在 Win32 时代就存在了。WinForms 中的 `Form.Show()` 和 `Form.ShowDialog()` 延续了这个设计。WPF 在此基础上做了重要改进：ShowDialog() 返回 `bool?` 类型，配合 `DialogResult` 属性，能直接告诉调用方"用户点了确认还是取消"。另外 WPF 的 Window 不再有"父子关系"而是用 Owner 属性来表示归属，这使得窗口管理更加灵活。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - **Show()**：非模态打开——调用后立即返回，窗口和主窗口同时可操作。适合工具窗、浮动面板
> - **ShowDialog()**：模态打开——阻塞等待窗口关闭后才返回。返回 `true`/`false` 表示用户是确认还是取消。适合"设置""确认"类对话框
> - **Close()**：关闭窗口。ShowDialog 打开的窗口调用 Close() 后，ShowDialog 返回 DialogResult 的值
> - **Hide()**：隐藏窗口（不销毁）。顶层关闭按钮触发的是 Close，不是 Hide
> - **Activate()**：把窗口激活到前台。在最小化到托盘后恢复窗口时使用
> - **Owner 属性**：设置窗口的"所有者"，子窗口始终在 Owner 窗口之上，且关闭 Owner 时子窗口自动关闭

> [!example] 完整示例
> 演示 Show、ShowDialog、DialogResult 和 Owner 的核心用法——一个带参数设置功能的配置面板。
>
> ```xml
> <!-- ShowMethodDemo.xaml —— 主窗口 -->
> <Window x:Class="HmiDemo.ShowMethodDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Show / ShowDialog 演示" Height="400" Width="520"
>         Background="#0D1117">
>     <Grid Margin="20">
>         <StackPanel VerticalAlignment="Center">
>             <TextBlock Text="📂 Window 方法演示" FontSize="20" FontWeight="Bold"
>                        Foreground="#FF6B35" Margin="0,0,0,16"/>
>
>             <!-- 当前参数显示 -->
>             <Border CornerRadius="8" Background="#161B22" Padding="16">
>                 <StackPanel>
>                     <TextBlock Text="当前配置：" Foreground="#8B949E" FontSize="12"/>
>                     <TextBlock x:Name="txtConfig" Foreground="#C9D1D9" FontSize="14"
>                                Margin="0,6,0,0"/>
>                     <TextBlock x:Name="txtResult" Foreground="#3FB950" FontSize="13"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>
>             <!-- 两种打开方式对比 -->
>             <StackPanel Orientation="Horizontal"
>                         HorizontalAlignment="Center" Margin="0,20,0,0">
>                 <Button x:Name="btnDialog" Content="ShowDialog（模态配置）"
>                         Width="180" Height="44" Click="BtnDialog_Click"
>                         Background="#FF6B35" Foreground="White" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="8" Background="#FF6B35">
>                                 <ContentPresenter HorizontalAlignment="Center"
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>                 <Button x:Name="btnShow" Content="Show（非模态工具窗）"
>                         Width="180" Height="44" Click="BtnShow_Click"
>                         Margin="12,0,0,0"
>                         Background="#21262D" Foreground="#C9D1D9" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="8" Background="#21262D"
>                                     BorderBrush="#30363D" BorderThickness="1">
>                                 <ContentPresenter HorizontalAlignment="Center"
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>             </StackPanel>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // ShowMethodDemo.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class ShowMethodDemo : Window
> {
>     private string _temperature = "120";
>     private string _pressure = "1.5";
>
>     public ShowMethodDemo()
>     {
>         InitializeComponent();
>         UpdateDisplay();
>     }
>
>     // ========== ShowDialog 模态方式 ==========
>     private void BtnDialog_Click(object sender, RoutedEventArgs e)
>     {
>         // 创建配置窗口，传入当前参数
>         var configWindow = new ConfigWindow(_temperature, _pressure)
>         {
>             Owner = this, // 设置所有者，确保子窗口在父窗口之上
>             WindowStartupLocation = WindowStartupLocation.CenterOwner
>         };
>
>         // ShowDialog 会阻塞在这里，直到配置窗口关闭才继续
>         bool? dialogResult = configWindow.ShowDialog();
>
>         txtResult.Text = $"ShowDialog 返回结果：{dialogResult}";
>
>         // 用户点了"保存"才更新数据
>         if (dialogResult == true)
>         {
>             _temperature = configWindow.Temperature;
>             _pressure = configWindow.Pressure;
>             UpdateDisplay();
>             txtResult.Text += "（参数已更新）";
>         }
>         else
>         {
>             txtResult.Text += "（用户取消，参数未改变）";
>         }
>     }
>
>     // ========== Show 非模态方式 ==========
>     private void BtnShow_Click(object sender, RoutedEventArgs e)
>     {
>         // 检查是否已经打开了工具窗，避免重复打开
>         if (_toolWindow != null && _toolWindow.IsLoaded)
>         {
>             _toolWindow.Activate(); // 已打开则激活到前台
>             return;
>         }
>
>         _toolWindow = new ToolWindow
>         {
>             Owner = this,
>             WindowStartupLocation = WindowStartupLocation.CenterOwner
>         };
>
>         // Show() 不阻塞，立即返回——主窗口仍可操作
>         _toolWindow.Closed += (s, args) =>
>         {
>             _toolWindow = null;
>             txtResult.Text = "工具窗已关闭";
>         };
>         _toolWindow.Show();
>         txtResult.Text = "工具窗已打开（非模态，可同时操作主窗口）";
>     }
>     private ToolWindow? _toolWindow;
>
>     private void UpdateDisplay()
>     {
>         txtConfig.Text = $"温度设定：{_temperature}°C | 压力设定：{_pressure} MPa";
>     }
> }
> ```
>
> 配置窗口——模态对话框，带有确认/取消逻辑：
>
> ```xml
> <!-- ConfigWindow.xaml -->
> <Window x:Class="HmiDemo.ConfigWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="参数配置" Width="400" Height="280"
>         ResizeMode="NoResize"
>         WindowStartupLocation="CenterOwner"
>         WindowStyle="ToolWindow"
>         Background="#0D1117">
>     <Grid Margin="20">
>         <StackPanel>
>             <TextBlock Text="⚙ 参数配置" FontSize="18" FontWeight="Bold"
>                        Foreground="#FF6B35" Margin="0,0,0,16"/>
>             <StackPanel Orientation="Horizontal" Margin="0,6">
>                 <TextBlock Text="温度设定(°C)：" Foreground="#8B949E"
>                            Width="100" VerticalAlignment="Center"/>
>                 <TextBox x:Name="txtTemp" Width="120" Height="28"
>                          Foreground="#C9D1D9" Background="#161B22"
>                          BorderBrush="#30363D"/>
>             </StackPanel>
>             <StackPanel Orientation="Horizontal" Margin="0,6">
>                 <TextBlock Text="压力设定(MPa)：" Foreground="#8B949E"
>                            Width="100" VerticalAlignment="Center"/>
>                 <TextBox x:Name="txtPressure" Width="120" Height="28"
>                          Foreground="#C9D1D9" Background="#161B22"
>                          BorderBrush="#30363D"/>
>             </StackPanel>
>             <StackPanel Orientation="Horizontal"
>                         HorizontalAlignment="Right" Margin="0,20,0,0">
>                 <Button Content="取消" Width="80" Height="32"
>                         Click="BtnCancel_Click"
>                         Background="#21262D" Foreground="#C9D1D9" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="6" Background="#21262D"
>                                     BorderBrush="#30363D" BorderThickness="1">
>                                 <ContentPresenter HorizontalAlignment="Center"
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>                 <Button Content="保存" Width="80" Height="32"
>                         Click="BtnSave_Click" Margin="8,0,0,0"
>                         Background="#FF6B35" Foreground="White" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="6" Background="#FF6B35">
>                                 <ContentPresenter HorizontalAlignment="Center"
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>             </StackPanel>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // ConfigWindow.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class ConfigWindow : Window
> {
>     // 公开属性——主窗口通过这两个属性读取配置结果
>     public string Temperature => txtTemp.Text;
>     public string Pressure => txtPressure.Text;
>
>     public ConfigWindow(string currentTemp, string currentPressure)
>     {
>         InitializeComponent();
>         txtTemp.Text = currentTemp;
>         txtPressure.Text = currentPressure;
>     }
>
>     private void BtnSave_Click(object sender, RoutedEventArgs e)
>     {
>         // 设置 DialogResult=true → ShowDialog() 会返回 true
>         DialogResult = true;
>         Close();
>     }
>
>     private void BtnCancel_Click(object sender, RoutedEventArgs e)
>     {
>         // 设置 DialogResult=false → ShowDialog() 会返回 false
>         DialogResult = false;
>         Close();
>     }
> }
> ```
>
> 工具窗——非模态，可以同时操作主窗口：
>
> ```csharp
> // ToolWindow.xaml.cs
> public partial class ToolWindow : Window
> {
>     public ToolWindow()
>     {
>         InitializeComponent();
>         Title = "实时数据监视";
>         Width = 300; Height = 200;
>         Topmost = true; // 浮动在顶部
>     }
> }
> ```

> [!scene] 适用场景
> ✅ Show()——报警列表窗口（用户边看报警边操作主界面）、状态监视浮动窗、帮助文档窗口
> ✅ ShowDialog()——参数配置、文件选择、用户登录、确认删除对话框
> ✅ Owner 属性——所有从当前窗口打开的子窗口都应设 Owner，确保层级正确、关闭主窗口时子窗口也关闭
> ✅ Activate()——最小化到托盘后恢复窗口、从另一个进程发来"激活"信号
> ✅ DialogResult——模态对话框中区分"保存/取消"、"确认/放弃"等用户选择
> ❌ Show()——替换导航（应该用 Frame/Page 导航，而非弹新窗口）
> ❌ ShowDialog()——主窗口加载前（Startup 事件中不要用 ShowDialog 阻塞启动）

> [!pitfall] 常见踩坑
> 坑 1：**Show() 打开的窗口被用户关掉后，引用变量还是旧对象** → 应该在子窗口的 Closed 事件中将变量置为 null：`win.Closed += (s, e) => _myWin = null;`
> 
> 坑 2：**忘了设 Owner 导致窗口"消失"** → 不设 Owner 的话，子窗口可能被主窗口挡住。ShowDialog 打开的窗口默认是应用级模态（阻塞所有窗口），但 Show 打开的窗口不设 Owner 可能在任务栏被遮挡
>
> 坑 3：**ShowDialog() 之后子窗口对象已被销毁却还访问它的属性** → Close() 之后 Window 对象的成员字段仍可读取（不会立刻被 GC），但如果访问控件（如 TextBox.Text）可能会抛 ObjectDisposedException。正确做法：在 Close() 之前把需要的值存入本地变量

> [!best] 最佳实践
> - 配置类对话框用 ShowDialog() —— 用户必须做出选择后才能继续
> - 公共属性加 `public` 让调用方读取结果——如 `public string SelectedPort => cmbPort.Text;`
> - ShowDialog() 配合 try-catch 防止子窗口初始化异常导致进程退出
> - 浮动工具窗口用 Show() + Topmost=true，并在主窗口关闭时用 Owner 关系自动关闭
> - 约定：ShowDialog() 返回 true = 用户确认/save，false = 取消/cancel，null = 直接关闭（点X）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的示例代码，分别点击 ShowDialog 和 Show 按钮，观察能否同时操作主窗口和子窗口
> **Lv.2 小试牛刀**：给 ConfigWindow 增加"端口号"（ComboBox）和"波特率"（TextBox）两个字段，参数从主窗口传入、用户确认后带回
> **Lv.3 融会贯通**：实现一个"禁止关闭"的模态对话框——在 ConfigWindow 的 Closing 事件中检查输入值是否合法（如温度为负数），如果不合法则 `e.Cancel = true` 并弹出提示

> [!related] 相关知识链接
> - ← 前置知识：Window 常用属性（WindowStartupLocation、ResizeMode、Topmost 等属性影响 Show/ShowDialog 行为）
> - → 后续必学：Window 常用事件（Loaded、Closing 等）（Closing 事件是 ShowDialog 关闭前的最后防线）
> - → 后续必学：窗口传值与数据交互（ShowDialog + 公开属性是最基本的传值方式）
> - ⇄ 关联概念：NavigationWindow/Page 导航模式、Popup 控件、DialogResult 最佳实践
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.window.showdialog
