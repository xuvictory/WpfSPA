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

> [!origin] 由来背景
> .NET 1.x 时代各组件的事件签名五花八门——有的传 `sender`，有的不传，有的数据塞在自定义委托参数里，组件之间难以互操作。.NET Framework 2.0 推出 `EventHandler<TEventArgs>` 泛型委托，确立了"事件两个参数"的标准约定：`sender` 统一表示事件来源，`EventArgs` 派生类承载数据。从此 WinForms、WPF、ASP.NET 的组件事件签名完全一致。上位机里自定义的串口/Modbus 通信组件也沿袭这套规范，界面层订阅任何事件，签名都长得一样，一眼可读。

> [!essentials] 核心要点
> - 事件委托固定两个参数：`object? sender` + `TEventArgs e`（`EventArgs` 的派生类）
> - `TEventArgs` 必须继承 `System.EventArgs`（编译器强制）
> - 无数据时用 `EventArgs.Empty`，避免每次触发都 new 一个空对象
> - `sender` 用于区分同类型事件源（多台设备共用一个处理器时靠它识别来源）
> - 订阅 `+=`、退订 `-=`，订阅方生命周期结束时务必退订防泄漏
> - 触发前判空：`DataReceived?.Invoke(this, e);`

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

> [!pitfall] 常见踩坑
> 坑 1：**不传 sender 或传 null** → 多事件源共用一个处理器时无法判断来源。触发时务必传 `this`。
> 坑 2：**事件参数复用同一个对象** → 订阅方拿到的是可变引用，后续数据更新会"篡改"已发出的历史事件。每个事件 new 一个参数对象。
> 坑 3：**把数据塞进 `object` 参数再强转** → 违反类型安全，还容易转错。应派生 `EventArgs` 并加强类型属性。
> 坑 4：**`+=` 后忘记 `-=`** → 长生命周期对象持有订阅者引用，界面控件无法回收。与对象生命周期对称地退订。

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
