---
name: 重写第9章通信全部文章去除套话
overview: 将 09-communication 章节全部 33 篇文章中套话化的 9 个 Callout（白话理解/官方定义/由来背景/核心要点/适用场景/常见踩坑/最佳实践/上手练习/相关知识链接）逐篇重写为贴合上位机通信场景的高质量具体内容，使 09 章达到 05 章同等质量水准。
todos:
  - id: rewrite-serial
    content: 重写串口组 6 篇文章（serialport-类详解等）的 9 个套话 Callout 并删除背景占位行
    status: completed
  - id: rewrite-modbus
    content: 重写 Modbus 组 6 篇文章（modbus-协议概述等）的 9 个套话 Callout
    status: completed
  - id: rewrite-opc
    content: 重写 OPC 组 4 篇文章（opc-概述classic-vs-ua等）的 9 个套话 Callout
    status: completed
  - id: rewrite-mqtt
    content: 重写 MQTT 组 3 篇文章（mqtt-概述与核心概念等）的 9 个套话 Callout
    status: completed
  - id: rewrite-network
    content: 重写网络基础与实战组 8 篇文章（tcp/udp/socket/websocket/http 等）的 9 个套话 Callout
    status: completed
  - id: rewrite-misc
    content: 重写其它 6 篇文章（通信模型分类、选型指南、can-总线等）的 9 个套话 Callout
    status: completed
  - id: verify-commit
    content: 校验 09 章套话句式计数为 0、git diff 仅动 09 章，提交"9.通信与协议菜单内容更新"
    status: completed
    dependencies:
      - rewrite-serial
      - rewrite-modbus
      - rewrite-opc
      - rewrite-mqtt
      - rewrite-network
      - rewrite-misc
---

## 产品概述

用户要求将 WPF 上位机学习平台中第 9 章（09-communication，上位机通信协议）全部 33 篇文章升级为高质量内容，彻底消除套话模板。经调研确认：09 章 33 篇文章的 9 个 Callout（白话理解、官方定义、由来背景、核心要点、适用场景、常见踩坑、最佳实践、上手练习、相关知识链接）全部是批量生成的套话（如"X是 WPF 上位机开发中的一项重要知识""由微软官方定义和实现的一个特性/概念/控件""诞生源于实际开发中的痛点"等），仅有 [!example] 完整示例是已填充的真实可运行代码。

## 核心功能

- 重写 09 章全部 33 篇文章中 9 个套话 Callout 为针对各自主题的具体、专业、贴合上位机/工控场景的内容
- 删除每篇残留的"本章节背景：…"占位行
- 保留并校验已存在的真实 [!example] 示例代码（XAML+C#），不改动 meta.json、src/styles、index.html
- 质量基准参照第 5 章《属性触发器 Trigger》《什么是数据绑定》的写作深度
- 完成校验（套话句式计数归零）并提交，提交信息"9.通信与协议菜单内容更新"

## 技术方案

### 实现策略

这是纯 Markdown 文档内容重写任务，不涉及代码逻辑改动。对 09-communication 目录下 33 篇文章逐一执行"套话 Callout 替换 + 占位行删除"，保留真实示例代码。逐篇重写而非批量正则替换，确保每篇内容针对具体主题（串口/Modbus/OPC/MQTT/TCP 等各自技术细节不同）。

### 重写规范（每篇统一执行，参照 05 章标准）

1. **[!plain]**：用具体比喻或真实业务场景开篇，点名该文涉及的 API/场景，杜绝套话
2. **[!def]**：给出真实类型/属性/方法名（如 SerialPort、PortName、BaudRate、Open()），说明核心组成
3. **[!origin]**：结合技术演进史（RS-232→RS-485、Modbus RTU→TCP、OPC Classic→UA 等）写具体痛点与设计动机
4. **[!essentials]**：5-8 条针对该主题的具体技术要点
5. **[!example]**：保留现有 XAML+C# 代码块，仅校验前导说明与正文一致、XAML 事件/x:Name 与 C# 严格对应（模板规范：命名空间 HmiDemo、类 MainWindow、深色配色 #0D1117/#161B22/#21262D/#58A6FF/#8B949E/#238636/#DA3633、中文注释）
6. **[!scene]**：5-8 条具体 ✅/❌ 场景，明确"用X不用Y"
7. **[!pitfall]**：3-5 条具体坑 + 原因 + 解决方案（如串口 DataReceived 跨线程、粘包分包、CRC 校验错误、端口占用等）
8. **[!best]**：4-6 条针对该主题的上位机实践建议（可靠性、工程化、性能），禁止通用命名规范/SOLID 套话
9. **[!practice]**：Lv.1/Lv.2/Lv.3 三个具体可执行的工控场景练习
10. **[!related]**：指向本文章真实的前置/后续/关联文章标题 + 官方文档具体链接
11. 删除"本章节背景：…"占位行

### 分组与文件清单（33 篇）

- **组1 串口（6 篇）**：serialport-类详解、串口通信基础概念rs-232rs-485-等、串口事件处理、串口数据接收最佳实践、串口通信调试、上位机串口实战封装
- **组2 Modbus（6 篇）**：modbus-协议概述、modbus-rtu串口、modbus-tcp网口、常用功能码详解、常用-modbus-库、modbus-上位机实战
- **组3 OPC（4 篇）**：opc-概述classic-vs-ua、opc-ua-核心概念、opc-ua-net-开发、与-plc-的-opc-ua-连接
- **组4 MQTT（3 篇）**：mqtt-概述与核心概念、net-中使用-mqttmqttnet、上位机-mqtt-应用
- **组5 网络基础与实战（8 篇）**：网络基础概念ip端口tcp-vs-udp、osi-七层模型简化、tcp-通信tcplistenertcpclient、udp-通信udpclient、socket-通信实战、websocket-全双工通信、http-api-调用、异步通信与高并发
- **组6 其它（6 篇）**：上位机通信应用场景、上位机通信协议全景图、通信模型分类、通信方式选型指南、can-总线、usb-与-hid-通信

### 实施注意

- 逐篇 read_file 获取原文 → 保留 [!example] 及 frontmatter → 重写其余 Callout → 写回
- 性能无特殊要求；注意 PowerShell 中文编码坑（chcp 65001 或 git commit -F UTF-8 文件，命令字符串避免中文引号）
- 只动 09-communication 目录，避免带入其它章节改动