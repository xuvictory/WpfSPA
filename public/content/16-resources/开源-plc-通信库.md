---
title: 开源 PLC 通信库
section: 16-resources
parent: 16.2 上位机相关开源项目
---

# 开源 PLC 通信库

> [!plain] 白话理解
> 上位机的"本职工作"之一就是跟 PLC 对话。不同厂家协议五花八门：西门子走 S7、三菱走 MC、欧姆龙走 Fins、Modbus 更是遍地都是。与其从零按协议文档手搓报文，不如用现成的**开源 PLC 通信库**——它把握手、建连、读写数据块、断线检测都封装好了，你只需一行 `ReadInt16("DB1.DBW0")` 就能读到 PLC 里的温度值。相当于"协议翻译官 + 接线员"二合一。

> [!def] 官方定义
> **开源 PLC 通信库**指 .NET 社区中用于对接各品牌 PLC 的**第三方开源库**（不是微软官方产物），常见代表：
> - **HslCommunication**（NuGet：`HslCommunication`，GitHub：https://github.com/dathlin/HslCommunication ）：国产老牌工业通信库，覆盖西门子 S7、三菱 MC、欧姆龙 Fins、Modbus、AB、倍福等 30+ 协议，API 统一（`ReadInt16`/`Write` 等），是国内上位机项目使用最广泛的通信库
> - **S7netplus**（NuGet：`S7netplus`，GitHub：https://github.com/S7NetPlus/s7netplus ）：专注西门子 S7-200/300/400/1200/1500，轻量、文档清晰
> - **Sharp7**（GitHub：https://github.com/snap7-devel/snap7 的 .NET 封装）：C 库 Snap7 的 C# 绑定，性能好
>
> 微软官方本身**不提供** PLC 协议库，只提供底层传输通道（如 `System.IO.Ports.SerialPort`，https://learn.microsoft.com/zh-cn/dotnet/api/system.io.ports.serialport 、`TcpClient`），协议解析全部由第三方库承担。

> [!origin] 由来背景
> 工业通信库的兴起源于国内上位机行业"多品牌 PLC 并存"的现实：一个产线可能西门子做主站、三菱做副站，工程师必须掌握多种协议。**HslCommunication** 作者 dathlin（胡金祥）从 2016 年前后持续积累，把各品牌协议逐个逆向与实现，整理成统一 API 的开源库并持续更新至今，解决了"换 PLC 就得重写通信层"的痛点。**S7netplus** 则由德国开发者构建（基于早期 S7 协议逆向），专注西门子生态。这些库共同构成了 .NET 上位机与工业现场对接的"最后一公里"。

> [!essentials] 核心要点
> - **HslCommunication**：`SiemensS7Net(SiemensPLCS.S1500)` 建客户端 → 设 `IpAddress` → `ConnectServer()` 连接 → `ReadInt16("DB1.DBW0")` / `Write("DB1.DBW0", value)` 读写
> - **S7netplus**：`Plc(CpuType.S1500, ip, 0, 1)` → `Open()` → `Read("DB1.DBW0")` 返回 `S7Int` 对象
> - **结果对象**：HslCommunication 的 `OperateResult<T>` 统一携带 `IsSuccess`/`Message`/`Content`，调用成功与否一查便知
> - **地址语法**：各库地址格式不同（`DB1.DBW0`、`M100`、`I0.0`、`Q1.0`），以库文档为准
> - **异步 API**：`ReadInt16Async` 等异步方法，上位机通信务必异步防卡 UI
> - **断线重连**：HslCommunication 支持 `SetPersistConnection` 与自动重连机制

> [!example] 完整示例
> **西门子 S7 PLC 连接与数据读取演示（开源通信库 HslCommunication）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="PLC 通信 - 开源通信库" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="PLC 连接配置（HslCommunication）" Foreground="#58A6FF"
>                            FontWeight="Bold" Margin="0,0,0,8"/>
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock Text="IP：" Foreground="#8B949E" VerticalAlignment="Center"/>
>                     <TextBox x:Name="IpBox" Text="192.168.0.1" Width="120" Margin="4,0,0,0"
>                              Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>                     <TextBlock Text="端口：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>                     <TextBox x:Name="PortBox" Text="102" Width="60" Margin="4,0,0,0"
>                              Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>                 </StackPanel>
>             </StackPanel>
>         </Border>
>         <Button Content="连接 PLC" Click="OnConnectClick" Margin="0,0,0,8" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <Button x:Name="ReadBtn" Content="读取 DB1.DBW0" Click="OnReadClick" Margin="0,0,0,8"
>                 Padding="8" Background="#238636" Foreground="White" IsEnabled="False"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Threading.Tasks;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 开源通信库 HslCommunication（NuGet：Install-Package HslCommunication）
>         private readonly HslCommunication.Profinet.Siemens.SiemensS7Net _plc;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 以 S7-1500 为例创建客户端，连接对象在窗口生命周期内复用
>             _plc = new HslCommunication.Profinet.Siemens.SiemensS7Net(
>                 HslCommunication.Profinet.Siemens.SiemensPLCS.S1500);
>         }
>
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             _plc.IpAddress = IpBox.Text;
>             _plc.Port = int.Parse(PortBox.Text);
>
>             StatusText.Text = "正在连接 PLC ...";
>             // 真实网络调用放到后台线程，避免阻塞 UI
>             var result = await Task.Run(() => _plc.ConnectServer());
>             if (result.IsSuccess)
>             {
>                 StatusText.Text = "连接成功，等待读取数据";
>                 StatusText.Foreground = Brushes.LimeGreen;
>                 ReadBtn.IsEnabled = true;
>             }
>             else
>             {
>                 StatusText.Text = "连接失败：" + result.Message;
>                 StatusText.Foreground = Brushes.OrangeRed;
>             }
>         }
>
>         private async void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             // 读取 DB1 数据块中 DBW0 的 16 位有符号整数（如温度、速度等工艺参数）
>             var result = await Task.Run(() => _plc.ReadInt16("DB1.DBW0"));
>             if (result.IsSuccess)
>             {
>                 StatusText.Text = $"DB1.DBW0 当前值 = {result.Content}";
>                 StatusText.Foreground = Brushes.LimeGreen;
>             }
>             else
>             {
>                 StatusText.Text = "读取失败：" + result.Message;
>                 StatusText.Foreground = Brushes.OrangeRed;
>             }
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 对接西门子/三菱/欧姆龙/Modbus 等多品牌 PLC 的上位机项目
> ✅ 需要统一通信层 API、方便切换设备型号的项目
> ✅ 产线级多 PLC 集中监控与数据采集
> ❌ 只对接单一品牌且已有厂商专用 SDK 的场景（可先用厂商库）
> ❌ 对协议行为有极致定制需求、需完全掌控底层报文的场景（直接用协议文档手写）

> [!pitfall] 常见踩坑
> 坑 1：**连接成功但读不到数据** → 现象：`ConnectServer` 返回成功，`ReadInt16` 报错或超时 → 原因：PLC 侧未允许 PUT/GET 访问、DB 块地址错误、CPU 型号选择不对 → 解决：先在 PLC 里打开"允许 PUT/GET 通信"，用官方仿真/真实设备核对地址与 `SiemensPLCS` 型号
>
> 坑 2：**地址语法记混导致读错数据** → 现象：`DB1.DBW0` 与 `DB1.DBD0` 读出来的值差很多 → 原因：不同库/不同型号对字节地址的约定不同（字、双字、偏移规则各异） → 解决：以库文档的地址表为准，先读已知值验证再上产线
>
> 坑 3：**UI 卡死 / 通信阻塞** → 现象：点连接后窗口无响应 → 原因：在 UI 线程同步调用 `ConnectServer`/`ReadInt16` → 解决：一律用异步 API 或 `Task.Run`（见第 8 章异步）

> [!best] 最佳实践
> - 选型前用 `通信调试工具vspdmqttxmodbus-poll` 或 Modbus 模拟从站先验证协议通路
> - 通信层统一封装成 `IPlcService`，内部实现"连接管理 + 读写 + 断线重连 + 日志"
> - 地址与设备型号做成配置（JSON/配置文件），换设备不改代码
> - 所有读写结果先检查 `IsSuccess` 再取 `Content`，失败记日志（第 12 章 `上位机日志场景`）
> - 用库的异步 API，配合"定时轮询 + 超时重试"，保证 UI 永远流畅

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把 PLC 型号改成 S1200 并调整端口，观察差异
> **Lv.2 小试牛刀**：用 `Write("DB1.DBW2", 100)` 给 PLC 写入一个设定值
> **Lv.3 融会贯通**：用定时轮询读多个 DB 地址，实时刷新一个"温度/压力/转速"三通道面板
> **Lv.4 拆层挑战**：封装 `IPlcService`（连接、读写、重连、日志），接入 DI 容器与 `serilog`，并写单元测试用模拟 PLC 验证读写逻辑

> [!related] 相关知识链接
> - ← 前置知识：[`nmodbus`](nmodbus)（Modbus 协议库）、第 8 章（异步）
> - → 后续必学：[`开源-scada-项目`](开源-scada-项目)（采集之上做监控平台）
> - ⇄ 关联概念：`上位机日志场景`（12）、[`通信调试工具vspdmqttxmodbus-poll`](通信调试工具vspdmqttxmodbus-poll)
> - 📖 官方文档：https://github.com/dathlin/HslCommunication ；S7netplus：https://github.com/S7NetPlus/s7netplus
