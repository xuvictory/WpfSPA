---
title: USB 与 HID 通信
section: 09-communication
parent: 9.7 其他通信方式
---

# USB 与 HID 通信

> [!plain] 白话理解
> 当鼠标、键盘、扫码枪、身份证读卡器或工控自定义按键面板插到工控机 USB 口时，上位机想读它发来的数据，靠的就是 USB 协议。但 Windows 上开发不需要直接写 USB 传输层——绝大多数设备都遵循 HID（人机接口设备）类规范，由系统自带驱动接管，你的 WPF 程序只需调用 `HidSharp` 或 `HidLibrary` 库去枚举设备、收发 HID 报告即可。可以把它理解为"USB 是公路，HID 是车道标线"：你不需要自己修路（写驱动），只要按标线（HID 报告格式）开车（收发报文）。

> [!def] 官方定义
> USB（Universal Serial Bus）是通用串行总线，由 USB-IF 组织维护规范；HID（Human Interface Device）是 USB 定义的设备类之一，规范见《Device Class Definition for HID 1.11》。HID 设备通过**中断传输（Interrupt Transfer）**在端点（Endpoint）上收发**报告（Report）**：输入报告（IN）是设备→主机，输出报告（OUT）是主机→设备，报告由"报告 ID + 定长数据负载"组成。.NET 侧常用 `HidSharp`（`HidDevice`、`HidStream.Read/Write`）或 `HidLibrary`（`HidDevice.Open()`、`ReadReport`）实现免驱动访问；串口类设备（如 USB 转串口的 FTDI/CH340）则仍走 `SerialPort` API。

> [!origin] 由来背景
> USB 诞生于 1996 年，目标是统一替代 PS/2、串口、并口等多种外设接口；但每类设备都要写驱动，导致新设备"装上就要装盘"。1999 年 USB-IF 推出 HID 设备类规范：凡是键鼠、操纵杆等输入设备，只要按 HID 报告描述符（Report Descriptor）声明自己的报文结构，Windows 就能用内置的 `usbhid.sys`/`hidclass.sys` 免驱驱动加载。对工控上位机而言，这意味着**插上就能用**——厂家无需提供驱动，上位机按厂家手册中的报告格式解析即可。后来工控领域大量采用 HID 做自定义控制面板（按键、拨码、指示盒），正是看中它的免驱与即插即用。

> [!essentials] 核心要点
> - **VID/PID 定位设备**：每个 USB 设备有唯一的 Vendor ID 与 Product ID（如 `0x1A86`/`0x7523` 常见于 CH340 转串口），枚举时用 VID+PID 过滤，避免串到别的设备
> - **报告描述符决定格式**：设备上报的 Report Descriptor 声明"报告 ID、字节长度、每个字段含义"，上位机解析必须与之一致，否则数据错位
> - **IN/OUT 端点方向**：IN 是设备到主机（读输入报告），OUT 是主机到设备（写输出报告）；读取用 `HidStream.Read`，写入用 `HidStream.Write`
> - **定长报文**：HID 报告是固定长度传输，长度由报告描述符决定，不足部分补 0；不像串口那样有"一帧"概念，也不存在粘包
> - **免驱是最大红利**：HID 设备由系统驱动接管，上位机应用层即可访问，无需写内核驱动、无需管理员权限
> - **设备热插拔**：`HidDeviceList` 提供插入/拔出事件，上位机需监听并做设备重连与资源释放
> - **非 HID 设备需 WinUSB/驱动**：厂商私有协议设备（如某些采集卡）不能免驱，需要 WinUSB、libusb 或厂商驱动配合

> [!example] 完整示例
> **USB 与 HID 通信演示：概念浏览 + HID 报告解析：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="USB 与 HID 通信" Height="500" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="USB/HID 概念（点击查看说明）" Foreground="#58A6FF" FontWeight="Bold"/>
>         <ListBox x:Name="ConceptList" Height="120" Margin="0,8,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D" SelectionChanged="OnConceptSelected">
>             <ListBoxItem Content="USB 枚举：设备插入后系统获取描述符"/>
>             <ListBoxItem Content="HID 类：免驱、即插即用的输入/控制设备"/>
>             <ListBoxItem Content="HID 报告：IN/OUT 端点收发定长报文"/>
>         </ListBox>
>         <TextBlock x:Name="DescText" Foreground="#58A6FF" Margin="0,8,0,0" TextWrapping="Wrap"/>
>         <TextBlock Text="模拟 HID 输入报告（8 字节）" Foreground="#8B949E" Margin="0,10,0,0"/>
>         <StackPanel Orientation="Horizontal" Margin="0,4,0,0">
>             <TextBox x:Name="ReportBox" Text="00 00 2C 00 00 00 00 00" Width="200"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="解析报告" Click="OnParseClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="ResultBox" Height="80" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,8,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnConceptSelected(object sender, SelectionChangedEventArgs e)
>         {
>             DescText.Text = ConceptList.SelectedIndex switch
>             {
>                 0 => "USB 枚举：设备插入后主机读取设备/配置/接口描述符，分配地址并加载驱动",
>                 1 => "HID 类：键盘、鼠标、扫描枪、自定义控制面板都属 HID，免驱动即插即用",
>                 2 => "HID 报告：通过中断 IN/OUT 端点收发固定长度报文，上位机用 WriteFile 发送",
>                 _ => ""
>             };
>         }
>
>         // 模拟解析 HID 键盘报告（第 2 字节为按键码）
>         private void OnParseClick(object sender, RoutedEventArgs e)
>         {
>             string[] parts = ReportBox.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
>             byte[] report = Array.ConvertAll(parts, t => Convert.ToByte(t, 16));
>             byte keyCode = report[2];
>             ResultBox.Text = $"报告长度：{report.Length} 字节\r\n" +
>                              $"修饰键：0x{report[0]:X2}，按键码：0x{keyCode:X2}（如 0x2C = 空格键）";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 扫码枪/条码阅读器数据采集：HID 键盘仿真模式，像敲键盘一样进焦点控件
> ✅ 身份证读卡器、RFID 读卡器：按厂家报告格式解析卡号
> ✅ 自定义工控按键面板/指示灯盒：OUT 报告控制 LED，IN 报告采集按键状态
> ✅ 鼠标/键盘类输入设备的数据拦截与状态监测
> ✅ 需要免驱、即插即用的外设（产线工人不希望装驱动）
> ❌ 高带宽大数据传输（如 USB 摄像头图像、高速采集卡）→ 走 Bulk 端点，用 DirectShow/WinUSB，HID 中断传输带宽有限
> ❌ 已有厂商串口驱动/专用 DLL 的设备（如某些 PLC 编程口）→ 直接用厂商 API，不要绕开驱动
> ❌ 老式设备只提供 PS/2 或串口接口 → 先做 USB 转串口适配，再按串口处理

> [!pitfall] 常见踩坑
> 坑 1：**VID/PID 搞错导致枚举不到** → 设备插上后设备管理器查看"硬件 ID"获取真实 VID/PID，不要照抄示例代码的常量
> 
> 坑 2：**按字节解析但报告带 ID 字节** → 报告描述符声明了 Report ID 时，实际报文第 1 字节就是报告 ID，后续才是数据；解析偏移要 +1，否则数据整体错位
> 
> 坑 3：**热插拔后句柄失效** → 设备拔出再插入，原 `HidDevice`/`HidStream` 对象已无效，写入报"设备不存在"；必须监听插拔事件并重新枚举、重新打开
> 
> 坑 4：**读数据阻塞 UI 线程** → `HidStream.Read` 是同步阻塞调用，直接放 UI 线程会卡死界面；应放到后台线程或使用异步 `ReadAsync`，并用 `Dispatcher` 回传数据
> 
> 坑 5：**写入时序过快被设备丢弃** → HID 中断传输有轮询间隔（Polling Interval），厂家手册注明比如 10ms 一次；连续写太快会丢包，需按设备节奏限流

> [!best] 最佳实践
> - 用 **HidSharp** 库（`HidDeviceList.Local.Enumerate(vid, pid)` 过滤），API 简洁且支持跨平台，比直接 P/Invoke `hid.dll` 可靠得多
> - 建立"枚举 → 打开 → 读报告 → 解析 → 分发"的固定流程，并把设备句柄生命周期与"插拔事件"绑定，拔出即释放、插入即重连
> - 解析报告用**位掩码 + 偏移表**而不是魔法数，把报告格式定义成常量结构，换设备型号只改配置
> - 读数据统一走后台线程循环（`while (stream.IsOpen) { await stream.ReadAsync(buf); ... }`），回调到 UI 用 `Dispatcher`，避免跨线程异常
> - 把设备访问封装成独立服务类（如 `HidScannerService`），上层只管"拿到一帧字节数组"，与具体设备解耦，方便换厂家
> - 上线前用厂家提供的 HID 调试工具（如 HID Monitor）抓真实报告对比解析结果，再写死解析逻辑

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，点击概念条目查看说明，在"模拟 HID 输入报告"框中把按键码改成 0x04（键盘 A）再解析，观察修饰键与按键码的解析逻辑
> **Lv.2 小试牛刀**：接入一把真实 HID 扫码枪，用 HidSharp 枚举到设备后读取输入报告，把扫码结果实时显示在 TextBox 中，并在拔出扫码枪时提示"设备已断开"
> **Lv.3 融会贯通**：设计一个"按键面板 + 指示灯"上位机模块：OUT 报告写 0x01/0x00 控制外接 LED 盒，IN 报告轮询采集 8 个工控按键状态，并把状态联动到设备监控画面（模拟运行即可，报告格式可自定义）

> [!related] 相关知识链接
> - ← 前置知识：《串口通信基础概念（RS-232/RS-485 等）》（USB 转串口设备仍走串口 API）与《通信方式选型指南》（对比 USB/串口/网络的适用边界）
> - → 后续必学：《上位机通信应用场景》（HID 设备在产线的实际落地）与《通信模型分类》
> - ⇄ 关联概念：《can-总线》（同为免驱/总线型外设通信）、《socket-通信实战》（网络替代方案）
> - 📖 官方文档：USB-IF HID 规范 https://www.usb.org/hid 、HidSharp 库 https://github.com/mikeobrien/HidSharp 、HidLibrary 库 https://github.com/mikeobrien/HidLibrary
