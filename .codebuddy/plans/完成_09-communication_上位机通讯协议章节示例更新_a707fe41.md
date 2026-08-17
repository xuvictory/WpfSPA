---
name: 完成 09-communication 上位机通讯协议章节示例更新
overview: 将 public/content/09-communication/ 下全部 33 篇文章的 [!example] 完整示例占位符替换为真实可运行、贴合上位机/工控场景的 WPF 示例（XAML + C# 两段代码块），并完成校验与提交。
todos:
  - id: serial-demos
    content: 替换串口类 7 篇文章的示例占位符（serialport-类详解、串口事件处理、串口数据接收最佳实践、串口通信调试、上位机串口实战封装、modbus-rtu串口、串口通信基础概念rs-232rs-485-等）
    status: completed
  - id: network-demos
    content: 替换网络类 7 篇文章示例（网络基础概念ip端口tcp-vs-udp、tcp-通信tcplistenertcpclient、udp-通信udpclient、socket-通信实战、异步通信与高并发、websocket-全双工通信、http-api-调用）
    status: completed
  - id: modbus-demos
    content: 替换 Modbus 类 5 篇文章示例（modbus-协议概述、常用功能码详解、常用-modbus-库、modbus-tcp网口、modbus-上位机实战），含功能码报文与 CRC16
    status: completed
  - id: mqtt-demos
    content: 替换 MQTT 类 3 篇文章示例（mqtt-概述与核心概念、net-中使用-mqttmqttnet、上位机-mqtt-应用），MQTTnet 最小演示
    status: completed
  - id: opcua-demos
    content: 替换 OPC UA 类 4 篇文章示例（opc-概述classic-vs-ua、opc-ua-核心概念、opc-ua-net-开发、与-plc-的-opc-ua-连接）
    status: completed
  - id: concept-demos
    content: 替换概念类 7 篇文章示例（上位机通信协议全景图、上位机通信应用场景、通信方式选型指南、通信模型分类、osi-七层模型简化、can-总线、usb-与-hid-通信）
    status: completed
  - id: verify-commit
    content: 校验占位符计数为 0、git diff 仅动 09 章，仅提交 09-communication 并附提交信息"9.上位机通讯协议菜单内容更新"
    status: completed
    dependencies:
      - serial-demos
      - network-demos
      - modbus-demos
      - mqtt-demos
      - opcua-demos
      - concept-demos
---

