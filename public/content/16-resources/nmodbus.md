---
title: NModbus
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# NModbus

> [!plain] 白话理解
> 上位机要跟 PLC、仪表、变频器通信，最常见的就是 **Modbus 协议**：一个"主站"（通常是你的上位机）发请求，从站（设备）回数据，一问一答。**NModbus** 就是帮你把这套协议封装好的 C# 库——你不用自己拼报文、算 CRC 校验、解析响应，直接调用 `ReadHoldingRegisters`、`WriteSingleRegister` 这类方法就能读写寄存器。相当于把"手写电报码"变成"打电话"。

> [!def] 官方定义
> **NModbus** 是一个**社区开源**的 .NET Modbus 协议库（GitHub：https://github.com/NModbus/NModbus ，NuGet：`NModbus`），支持 **Modbus RTU、ASCII 和 TCP** 三种传输方式，提供主站（Master）与从站（Slave）能力，覆盖功能码 01/02（线圈）、03/04（寄存器读取）、05/06（单点写入）、15/16（批量写入）等常用操作。它**不是微软官方库**，其核心 API 在 `Modbus.Device` 命名空间（`ModbusSerialMaster`、`ModbusIpMaster` 等），需要配合 .NET 的 `System.IO.Ports.SerialPort` 或 `TcpClient` 使用。Modbus 协议本身由 Modicon 公司在 1979 年提出，现由 Modbus Organization 维护（协议规范见 https://modbus.org/specs.php ），与微软官方串口 API（https://learn.microsoft.com/zh-cn/dotnet/api/system.io.ports.serialport ）是"协议 vs 传输通道"的分工关系。

> [!origin] 由来背景
> NModbus 的前身是 **Modbus TCP/IP 库**，由 James Kolpack 于 2007 年前后创建，因使用简单被工业 .NET 社区广泛采用。后来社区在原库基础上持续修复与扩展，2019 年起在 NModbus 组织下以 **3.x 版本重新发布**（重写了底层结构，API 相对 2.x 有破坏性调整）。它的出现让 .NET 开发者不必再手写 Modbus 报文与 CRC 校验，从而把精力放在业务上。上位机行业大量使用它对接温控器、变频器、电表、采集模块等标准 Modbus 设备。

> [!essentials] 核心要点
> - **主站创建**：RTU 用 `ModbusSerialMaster.CreateRtu(serialPort)`，TCP 用 `ModbusIpMaster.CreateIp(tcpClient)`
> - **读寄存器**：`ReadHoldingRegisters(slaveAddress, startAddress, numberOfPoints)` 功能码 03；`ReadInputRegisters` 功能码 04
> - **写寄存器**：`WriteSingleRegister(slave, address, value)` 功能码 06；`WriteMultipleRegisters` 功能码 16
> - **线圈操作**：`ReadCoils`（01）、`WriteSingleCoil`（05）、`WriteMultipleCoils`（15）
> - **数据转换**：寄存器是 `ushort[]`，温度/压力等浮点数需自行 `BitConverter` 拼接（高字在前）
> - **异步版本**：库提供 `ReadHoldingRegistersAsync` 等异步方法，上位机通信务必异步，避免阻塞 UI

> [!example] 完整示例
> **NModbus：串口读取从站保持寄存器（功能码 03）演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus RTU 调试" Height="440" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="NModbus 保持寄存器读取" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="串口：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="PortBox" Text="COM3" Width="70" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>             <TextBlock Text="从站地址：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>             <TextBox x:Name="SlaveBox" Text="1" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="起始寄存器：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="StartBox" Text="0" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>             <TextBlock Text="数量：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>             <TextBox x:Name="CountBox" Text="10" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <Button Content="读取保持寄存器" Click="OnReadClick" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <ListBox x:Name="RegList" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D" Height="180"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO.Ports;
> using System.Threading.Tasks;
> using System.Windows;
> using Modbus.Device;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 NModbus 包（Install-Package NModbus）
>         public MainWindow() => InitializeComponent();
>
>         private async void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             StatusText.Text = "正在读取保持寄存器 ...";
>             try
>             {
>                 // 串口读写放到后台线程，避免阻塞 UI（配合 VSPD 虚拟串口可本地联调）
>                 var registers = await Task.Run(() =>
>                 {
>                     using var port = new SerialPort(PortBox.Text, 9600, Parity.None, 8, StopBits.One)
>                     {
>                         ReadTimeout = 2000,
>                         WriteTimeout = 2000
>                     };
>                     port.Open();
>                     // 功能码 03：读取保持寄存器
>                     return ModbusSerialMaster.CreateRtu(port).ReadHoldingRegisters(
>                         byte.Parse(SlaveBox.Text),
>                         ushort.Parse(StartBox.Text),
>                         ushort.Parse(CountBox.Text));
>                 });
>
>                 RegList.Items.Clear();
>                 for (var i = 0; i < registers.Length; i++)
>                 {
>                     RegList.Items.Add($"寄存器 {int.Parse(StartBox.Text) + i}：{registers[i]}");
>                 }
>                 StatusText.Text = "读取成功，共 " + registers.Length + " 个寄存器";
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "读取失败：" + ex.Message;
>             }
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 对接标准 Modbus RTU/TCP 设备：温控器、变频器、电表、采集模块
> ✅ 上位机做主站轮询从站设备数据
> ✅ 需要把设备数据写入 PLC 保持寄存器的控制场景
> ✅ 与虚拟串口/Modbus 模拟从站配合做本地联调
> ❌ 西门子 S7 协议（PPI/Profinet）设备（走 `开源-plc-通信库` 的 S7 库）
> ❌ 高速工业总线（EtherCAT 等）实时控制场景（延迟要求超出 Modbus 能力）

> [!pitfall] 常见踩坑
> 坑 1：**CRC 校验错误/通信超时** → 现象：偶发 `CRC error` 或读取超时 → 原因：波特率/数据位/停止位与从站不一致，或串口被占用 → 解决：核对设备手册的串口参数，用 Modbus Poll 工具先验证参数，再调程序
>
> 坑 2：**浮点数读出乱码** → 现象：温度寄存器读出 62351 这种怪值 → 原因：Modbus 寄存器是 16 位整数，32 位浮点需两个字拼接，且字序/字节序各异 → 解决：按设备手册用 `BitConverter` 拼 `ushort` 高字+低字并转 `Single`，注意大小端
>
> 坑 3：**UI 卡死** → 现象：点击读取后窗口"无响应" → 原因：在 UI 线程同步读串口，ReadTimeout 期间阻塞界面 → 解决：用 `Task.Run` 或库的 `ReadHoldingRegistersAsync` 异步调用（见第 8 章异步）

> [!best] 最佳实践
> - 通信参数（串口号、波特率、从站地址）做成配置项，别写死在代码里
> - 统一封装"寄存器地址 → 工程值"的转换层，浮点、整数、开关量各一个转换器
> - 轮询采用"定时器 + 异步"模式，串口主站同一时刻只发一个请求（Modbus 一问一答）
> - 用 `通信调试工具vspdmqttxmodbus-poll` 中的 Modbus 模拟从站先联调协议，再接真实设备
> - 超时与异常统一记入日志（第 12 章 `上位机日志场景`），现场排查有据可查

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把读取数量改成 5，观察寄存器列表变化
> **Lv.2 小试牛刀**：给示例加"写单个寄存器（功能码 06）"功能，向 0 号寄存器写入设定值
> **Lv.3 融会贯通**：用 Modbus 模拟从站 + 定时轮询，做一个每 2 秒刷新一次的实时数据面板
> **Lv.4 拆层挑战**：把 Modbus 通信封装成独立的 `ModbusDevice` 服务（DI 注入），支持 RTU/TCP 切换与断线重连，并接入 `serilog` 记录每帧报文

> [!related] 相关知识链接
> - ← 前置知识：`什么是-mvvm`（07）、第 8 章（异步与 UI 线程）
> - → 后续必学：[`开源-plc-通信库`](开源-plc-通信库)（S7 等其他协议）、[`通信调试工具vspdmqttxmodbus-poll`](通信调试工具vspdmqttxmodbus-poll)
> - ⇄ 关联概念：`上位机日志场景`（12，通信异常记录）、[`日志与工具类-nuget-包`](日志与工具类-nuget-包)
> - 📖 官方文档：https://github.com/NModbus/NModbus ；Modbus 规范：https://modbus.org/specs.php
