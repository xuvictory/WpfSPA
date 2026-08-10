---
title: EventHandler 标准事件模式
section: 00-prelude
parent: 委托与事件
---

# EventHandler 标准事件模式

> [!plain] 白话理解
> 之前你看到 `event EventHandler<TemperatureEventArgs> OnAlarm`，有人会问为什么不直接用 `event Action<TemperatureEventArgs>`？答案是 `EventHandler<T>` 是 .NET 的"标准格式"——它强制第一个参数是 `object sender`（谁触发的事件），第二个是 `EventArgs` 的派生类（事件的详细数据）。这个约定看似啰嗦，但让所有 .NET 组件的事件签名统一，WPF 的 `Button.Click`、`Timer.Elapsed` 都用同一套模式。

> [!def] 官方定义
> - `EventHandler`：`delegate void EventHandler(object? sender, EventArgs e);`
> - `EventHandler<TEventArgs>`：`delegate void EventHandler<TEventArgs>(object? sender, TEventArgs e);`（TEventArgs 必须继承 EventArgs）
> - 标准模式的优势：`sender` 让订阅方知道是谁发的；`EventArgs` 可扩展携带数据

> [!example] 完整示例
> ```csharp
> // 自定义 EventArgs
> public class DeviceDataEventArgs : EventArgs
> {
>     public byte[] RawData { get; }
>     public DateTime Timestamp { get; } = DateTime.Now;
>     public DeviceDataEventArgs(byte[] data) => RawData = data;
> }

> // 标准事件声明
> public class DeviceReader
> {
>     public event EventHandler<DeviceDataEventArgs>? DataReceived;
    
>     public void SimulateReceive(byte[] data)
>     {
>         DataReceived?.Invoke(this, new DeviceDataEventArgs(data));
>     }
> }

> // 订阅（sender 可以判断来源）
> var reader = new DeviceReader();
> reader.DataReceived += (sender, e) =>
> {
>     var readerObj = sender as DeviceReader;
>     Console.WriteLine($"[{e.Timestamp:HH:mm:ss}] {e.RawData.Length}字节");
> };
> ```

> [!scene] 适用场景
> ✅ 所有公开事件——这是 .NET 的硬性规范
> ❌ 只有内部用的简易事件可以用 `Action`（但也建议 EventHandler）

> [!best] 最佳实践
> - 公开事件一律 `EventHandler<T>`
> - EventArgs 命名：`XxxEventArgs`
> - 触发方法命名为 `OnXxx`（protected virtual 为子类留扩展点）

> [!practice] 上手练习
> **Lv.1**：用 EventHandler 传递传感器数据
> **Lv.2**：为上位机实现标准 Modbus 数据到达事件
> **Lv.3**：设计一套统一的事件基类体系

> [!related] 相关知识链接
> - ← event
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/events/
