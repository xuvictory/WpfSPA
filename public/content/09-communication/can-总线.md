---
title: CAN 总线
section: 09-communication
parent: 9.7 其他通信方式
---

# CAN 总线

> [!plain] 白话理解
> 汽车、机械手臂、AGV 小车这些对实时性和抗干扰要求高的场合，内部设备之间靠的不是以太网，而是一根双绞线构成的 CAN 总线。上位机想读这类设备的数据，一般通过 USB-CAN 或 PCIe-CAN 卡把它接到电脑，再用厂商提供的 DLL 收发"CAN 帧"。CAN 帧很像一封有"门牌号"的短信：**帧 ID 决定优先级和内容归属，DLC 决定长度，最多 8 字节数据**。你的上位机只管按 ID 过滤、按 DBC/点表解析即可，不用关心底层时序。

> [!def] 官方定义
> CAN（Controller Area Network，控制器局域网络）是博世 1986 年提出的串行通信协议，由 ISO 11898-1 标准化，采用**差分双绞线**（CAN_H/CAN_L）+ **CSMA/CD+AMP 仲裁机制**实现多主总线通信。报文分**标准帧**（11 位标识符）与**扩展帧**（29 位标识符），帧结构含 SOF、仲裁域（ID+RTR）、控制域（IDE/DLC）、数据域（0~8 字节）、CRC 域（15 位）与 ACK 域。数据链路层由硬件控制器（如 STM32F103 的 bxCAN、SJA1000）完成，上位机侧通过 CAN 卡（如周立功 USBCAN、创芯 CANalyst）的 DLL/API 收发原始帧。

> [!origin] 由来背景
> 20 世纪 80 年代，汽车线束多达几千米，每增加一个传感器就要增加线束，重量和故障率直线上升，且传统点对点接线无法共享数据。博世推出 CAN 后，一条双绞线上就能挂几十个 ECU（发动机、ABS、仪表），靠**标识符仲裁**自动解决多节点同时发数据的冲突（ID 越小优先级越高），无需主机调度，断线也不影响其它节点。此后 CAN 从车载走向工控（纺织机械、电梯、医疗设备），2.0B 规范把 ID 扩到 29 位以应对更多节点。上位机需求也随之产生——要在 PC 上监控、标定、采集 CAN 网络，这就是 USB-CAN 卡和上位机 CAN 开发库的由来。

> [!essentials] 核心要点
> - **帧 ID 是灵魂**：标准帧 11 位 ID（0x000~0x7FF），扩展帧 29 位 ID；CANopen/SAE J1939 等上层协议用 ID 分段定义报文含义，上位机按 ID 表过滤解析
> - **数据最长 8 字节**：DLC 为 0~8，一帧塞不下就拆多帧（上层协议如 ISO-TP 负责重组），与串口/网络的流式传输完全不同
> - **多主仲裁机制**：总线空闲时任意节点可发，ID 小的帧优先，上位机发帧时要注意不要和主设备抢优先级高的 ID
> - **CAN 帧 ≠ 数据帧**：还有远程帧（RTR=1，请求对方发数据）、错误帧、过载帧，上层一般只处理数据帧
> - **硬件 CRC 与 ACK**：CRC15 校验和 ACK 应答都由控制器硬件完成，上位机收到的帧已是链路层校验通过的，无需再算 CRC
> - **总线速率配置必须一致**：波特率（如 500kbps）与采样点（如 87.5%）不匹配会出现大量错误帧/总线关闭
> - **滤波器**：CAN 卡支持 ID 掩码过滤，上位机应尽量用硬件滤波减少无效中断，海量报文时显著降低 CPU 占用
> - **DBC 与点表**：厂家通常给 .dbc 文件（CANopen EDS 类似），用工具（如 CANdb++）解析出信号（信号名/起始位/长度/系数），上位机才能把裸字节翻译成工程值

> [!example] 完整示例
> **CAN 报文帧演示：解析标准帧格式（ID + DLC + 数据 + CRC）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="CAN 总线 - 报文帧解析" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="CAN 标准帧解析（帧ID + 长度 + 数据 + CRC）"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="帧ID" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="IdBox" Text="0x180" Width="70" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="数据(Hex)" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="DataBox" Text="FF 01 02 03" Width="130" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <Button Content="解析帧" Click="OnParseClick" Padding="10,4" Margin="0,10,0,0"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>         <ListBox x:Name="ResultList" Height="180" Margin="0,10,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 解析 CAN 帧：ID、DLC、数据字节、校验演示
>         private void OnParseClick(object sender, RoutedEventArgs e)
>         {
>             string[] parts = DataBox.Text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
>             byte[] data = Array.ConvertAll(parts, t => Convert.ToByte(t, 16));
>             uint id = Convert.ToUInt32(IdBox.Text, 16);
>
>             ResultList.Items.Clear();
>             ResultList.Items.Add($"帧 ID：0x{id:X3}（仲裁 ID，值越小总线优先级越高）");
>             ResultList.Items.Add($"数据长度 DLC：{data.Length} 字节");
>             ResultList.Items.Add($"数据区：{BitConverter.ToString(data)}");
>             // 简单校验演示（真实 CAN 使用硬件 CRC15）
>             byte crc = 0;
>             foreach (byte b in data) crc ^= b;
>             ResultList.Items.Add($"校验 CRC：0x{crc:X2}（演示用异或，实际为硬件 CRC15）");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 车载/移动设备监控（BMS 电池、VCU、电控）：J1939 协议栈采集电池电压、SOC、电机转速
> ✅ 机械装备内部总线（工程机械、AGV、升降机）：读取各控制器状态帧
> ✅ 医疗设备、电梯、纺织机等 CANopen 网络：PDO/SDO 通信
> ✅ 传感器节点多、布线环境电磁干扰强的产线
> ❌ 超过几十个节点、布线距离超 1km 的场合 → 上 CAN FD（8Mbps/64字节）或换以太网
> ❌ 需要大块数据连续传输（如固件升级、波形采集）→ CAN 帧长有限，走以太网更合适
> ❌ 电脑上没有 CAN 卡硬件 → 先用 USB-CAN 或找网关把 CAN 转 Modbus TCP 再接入

> [!pitfall] 常见踩坑
> 坑 1：**波特率/采样点不匹配导致总线大量错误帧** → 全总线节点必须同波特率、同采样点；接入上位机前先用 CAN 分析仪（如 PCAN-View、ZCANPRO）确认线上真实波特率
> 
> 坑 2：**把字节当"可分割的流"处理** → CAN 是帧通信，每帧独立且最长 8 字节；不要像串口那样做粘包拼接，直接按帧 ID 分发，一个 ID 一个数据槽
> 
> 坑 3：**高低字节顺序（字节序）搞反** → 如 J1939 大部分信号是大端（高字节在前），解析时必须按 DBC 定义逐位取，不能整帧 BitConverter.ToInt32
> 
> 坑 4：**忽略错误帧与 Bus-Off** → CAN 有错误计数器，错误过多节点会进入 Bus-Off 离线；上位机收到 Error 帧要报警并提示检查终端电阻（120Ω 必须两端各一个）
> 
> 坑 5：**收发卡 API 与设备型号绑定** → 不同厂家（周立功/创芯/Kvaser）API 完全不同，封装一个统一的"帧收发接口"，换卡只改适配层

> [!best] 最佳实践
> - 上位机统一封装 `CanFrame { uint Id; byte[] Data; bool IsExt; }` 与"收发一帧"接口，业务层只认 ID+Data，与具体 CAN 卡厂商解耦
> - 用**ID 订阅表**管理报文：字典 `<uint, 解析委托>`，收到一帧直接查表解析并更新对应变量，避免 switch 满天飞
> - 解析信号用 DBC 定义（信号名、起始位、位长、Scale/Offset），做成配置化解析器，车型/机型变化只改配置不改代码
> - 接收循环放后台线程，高频帧（如 20ms 周期转速帧）直接更新共享状态，UI 用 Dispatcher 定时刷新（如 100ms），避免每帧都刷界面
> - 发送侧做好周期调度（如 100ms 周期发送心跳帧）与发送失败重试，配合总线占用检测
> - 现场排查必备：先看错误帧计数和总线负载率，再谈业务解析；日志里带上 ID 和原始字节

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节"CAN 报文帧解析"示例，把帧 ID 改成 0x100，数据改成 4 字节，观察 DLC、数据区与校验显示；思考为什么 DLC 显示的是你输入的字节数
> **Lv.2 小试牛刀**：接入真实 USB-CAN 卡（或 ZCANPRO 虚拟设备），写一个按 ID 过滤接收的窗口：只显示 0x180 与 0x281 两路帧，并实时统计两路帧的接收速率
> **Lv.3 融会贯通**：用 DBC 文件（可先定义一个模拟 DBC：如"0x281 车速 起始位8 长度16 系数0.01"）实现一个信号解析面板：输入原始帧字节，输出工程值（km/h），再把解析结果画成实时曲线

> [!related] 相关知识链接
> - ← 前置知识：《网络基础概念（IP/端口/TCP vs UDP）》（网络与总线分层概念）与《通信模型分类》
> - → 后续必学：《上位机通信应用场景》（CAN 在车载/工控的落地）与《通信方式选型指南》
> - ⇄ 关联概念：《modbus-协议概述》（同为现场总线级协议）、《usb-与-hid-通信》（同属免驱外设接入）
> - 📖 官方文档：ISO 11898-1 https://www.iso.org/standard/63648.html 、CAN in Automation（CiA）https://www.can-cia.org 、CANopen 规范 https://www.can-cia.org/can-knowledge/canopen/canopen/
