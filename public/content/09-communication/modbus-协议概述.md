---
title: Modbus 协议概述
section: 09-communication
parent: 9.4 Modbus 通信协议
---

# Modbus 协议概述

> [!plain] 白话理解
> Modbus 是工业自动化里最"话少"却最通用的对话协议：上位机（主站）发一条指令"请把 1 号从站的 0 号寄存器读两个回来"，设备回一段数据；一问一答，格式固定。它不关心底下是串口（RTU）还是网口（TCP），只管报文内容长什么样。本文先把协议家族与报文结构讲清楚，是你读懂后续 RTU/TCP/功能码/库封装的地基。

> [!def] 官方定义
> Modbus 是一种应用层报文传输协议，由 Modicon（现施耐德电气）于 1979 年提出，采用主从（Master/Slave）模型。报文核心由四部分组成：地址码（从站号，1 字节）、功能码（1 字节）、数据区（N 字节，含起始地址与寄存器数量等）、校验（RTU 为 CRC16 低字节在前，TCP 由 MBAP 头承载）。其传输变体主要包括：Modbus RTU（RS-232/485，二进制紧凑帧）、Modbus ASCII（少用）、Modbus TCP（以太网，MBAP 头 + 无 CRC）。Modbus 现由 Modbus 组织（modbus.org）维护，是事实上的工业通信开放标准。

> [!origin] 由来背景
> 1970 年代 Modicon 为了给自己的 PLC 提供一个简单可靠的通信方式，设计了 Modbus：协议极其精简——只有几十个功能码，报文用固定格式，任何人都能实现，因此迅速从 Modicon 扩散到整个工业界，成为 PLC、变频器、仪表、传感器默认内置的通信接口。随着以太网普及，又在其上发展出 Modbus TCP，把原有帧直接打包进 TCP 数据流，保持兼容性。时至今日它仍是工控现场互通性最高的"通用语"，学习成本低、生态庞大，是上位机开发者的必备基础。

> [!essentials] 核心要点
> - **主从模型**：只有主站（上位机）主动发请求，从站（设备）被动应答，从站之间不通信
> - **地址码**：1 字节，取值范围 1~247（0 为广播地址）；一个串口总线可挂多个从站按地址区分
> - **功能码即"动词"**：03/04 读寄存器、05/06 写单点、15/16 写多点，见《常用功能码详解》
> - **数据区大端序**：多字节数值高字节在前（如地址 0x0102 写为 01 02），与 CRC 低字节在前的规则要分清
> - **RTU 帧校验靠 CRC16**：多项式 0xA001，对"地址+功能码+数据"计算，低字节在前发送
> - **TCP 变体去掉 CRC**：改用 MBAP 头承载事务 ID/协议 ID/长度/单元号，帧尾不再有校验
> - **RTU 与 TCP 可互转**：同一业务数据，加 CRC 变 RTU，加 MBAP 头变 TCP，学习一套逻辑两头用

> [!example] 完整示例
> **Modbus 协议概述演示：报文结构分解 + 构建 03 读保持寄存器请求帧：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus 协议概述 - 报文结构" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Modbus RTU 报文结构：地址码(1B) + 功能码(1B) + 数据(NB) + CRC16(2B)"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <Button Content="构建请求帧（读保持寄存器 03）" Click="OnBuildClick" Padding="10,4"
>                 Margin="0,8,0,0" HorizontalAlignment="Left"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock Text="完整请求帧" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="FrameBox" Height="30" IsReadOnly="True" Background="#161B22"
>                  Foreground="#58A6FF" BorderBrush="#30363D"/>
>         <TextBlock Text="报文结构分解" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <ListBox x:Name="PartList" Height="180" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D"/>
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
>         // 构建读保持寄存器(03)请求帧并展示结构
>         private void OnBuildClick(object sender, RoutedEventArgs e)
>         {
>             byte[] frame = BuildReadFrame(1, 0, 2); // 站号1，起始地址0，数量2
>             FrameBox.Text = BitConverter.ToString(frame);
>             PartList.Items.Clear();
>             PartList.Items.Add($"地址码：0x{frame[0]:X2}（从站号 = 1）");
>             PartList.Items.Add($"功能码：0x{frame[1]:X2}（03 = 读保持寄存器）");
>             PartList.Items.Add($"数据区：{frame[2]:X2} {frame[3]:X2} {frame[4]:X2} {frame[5]:X2}（起始地址 + 寄存器数量）");
>             PartList.Items.Add($"校验区：{frame[6]:X2} {frame[7]:X2}（CRC16，低字节在前）");
>         }
>
>         // 构建标准 RTU 请求帧
>         private byte[] BuildReadFrame(byte slave, ushort addr, ushort count)
>         {
>             byte[] frame = new byte[8];
>             frame[0] = slave;
>             frame[1] = 0x03;
>             frame[2] = (byte)(addr >> 8);
>             frame[3] = (byte)addr;
>             frame[4] = (byte)(count >> 8);
>             frame[5] = (byte)count;
>             ushort crc = Crc16(frame, 6);
>             frame[6] = (byte)crc;
>             frame[7] = (byte)(crc >> 8);
>             return frame;
>         }
>
>         private ushort Crc16(byte[] data, int len)
>         {
>             ushort crc = 0xFFFF;
>             for (int i = 0; i < len; i++)
>             {
>                 crc ^= data[i];
>                 for (int j = 0; j < 8; j++)
>                     crc = (crc & 1) != 0 ? (ushort)((crc >> 1) ^ 0xA001) : (ushort)(crc >> 1);
>             }
>             return crc;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 需要读取/写入 PLC 保持寄存器（温度、转速、产量等工艺参数）的监控界面
> ✅ 一主多从：上位机通过 RS-485 总线轮询多台变频器、电表
> ✅ 设备通信接口只有 Modbus 的通用仪表（流量计、温控仪、称重模块）
> ✅ 跨平台/跨厂商设备互联（Modbus 是开放标准，几乎所有工控设备支持）
> ❌ 高速大批量数据采集（寄存器轮询带宽有限，选 EtherCAT/Profibus 更高效）
> ❌ 需要实时同步、多主并发的工业网络（Modbus 是主从轮询模型，不适合）

> [!pitfall] 常见踩坑
> 坑 1：**地址范围记混导致读错数据** → Modbus 线圈/寄存器有 0xxxx/1xxxx/3xxxx/4xxxx 地址区之分（如 40001 对应保持寄存器 0 号），查设备点表时先确认是"协议地址"还是"PLC 地址"
>
> 坑 2：**字节序搞反** → 寄存器值 16 位大端序（高位在前），而 CRC 低字节在前；收发都统一按协议规范组帧，别"想当然"
>
> 坑 3：**从站站号写 0 当广播用，设备不响应** → 0 是广播地址，从站不应答；需要确认应答时站号必须 1~247
>
> 坑 4：**误以为 Modbus 支持从站主动上报** → 协议是严格的主从轮询，设备有变化只能等主站来读；实时性要求高的数据需缩短轮询周期

> [!best] 最佳实践
> - 组帧/拆帧逻辑**独立成工具类**（BuildReadFrame/BuildWriteFrame/ParseResponse/CalcCRC），并配单元测试，帧格式错了排查成本极高
> - 报文字节用 `byte[]` + Hex 字符串双向工具展示，日志里同时记录收发 Hex 与解析结果，现场对账一目了然
> - 地址管理统一走**点表**（变量名→站号+功能码+起始地址+数量+数据类型），不把地址散写进业务代码
> - 轮询与读写严格按**主从时序**：一个请求未超时前不要并发发下一个（多数从站不支持重叠请求），用串行队列
> - 异常响应（0x80|功能码）必须解析错误码并翻译成中文提示（非法功能/非法数据地址/从站忙），不要只显示"接收失败"
> - 先查设备手册确认**寄存器映射与字节序**（大端/小端、32 位浮点顺序），再写解析代码，避免"读数对不上"反复返工

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"构建请求帧"观察 03 读保持寄存器报文的地址码/功能码/数据区/CRC 四段结构
> **Lv.2 小试牛刀**：手写一张纸：为站号 3、起始地址 0x000A、数量 4 的读请求手工计算并写出完整 RTU 帧（用示例代码验证 CRC）
> **Lv.3 融会贯通**：把示例的 BuildReadFrame 扩展为支持 03/04/06/16 四种功能码的通用构建器，并写单元测试验证帧字节与手算一致

> [!related] 相关知识链接
> - ← 前置知识：《串口通信基础概念（RS-232、RS-485 等）》理解承载介质
> - → 后续必学：《Modbus RTU（串口）》《Modbus TCP（网口）》《常用功能码详解》
> - ⇄ 关联概念：《常用 Modbus 库》《Modbus 上位机实战》《上位机通信协议全景图》
> - 📖 官方文档：https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf（Modbus 应用协议规范）
