---
title: event 事件
section: 00-prelude
parent: 委托与事件
---

# event 事件

> [!plain] 白话理解
> `event` 是给委托加了"安保措施"。普通委托 `Action<string> OnMessage`，外部代码可以直接 `OnMessage = null` 把大家的订户全清了，甚至直接调 `OnMessage("hack")`。加了 `event` 关键字后，外部只能 `+=`（订阅）和 `-=`（退订），不能清空所有订户也不能直接触发——就像小区物业，业主可以在公告栏贴通知（订阅），但不能自己把公告栏拆了（清空）或自己发公告（触发）。

> [!def] 官方定义
> `event` 是封装了委托的特殊成员，遵循"发布-订阅"模式。事件只能在声明类内部触发（`raise`），外部只能 `+=`/`-=`。标准模式：
> - `event EventHandler<TEventArgs> Name;`（使用 `EventHandler` 委托）
> - `event Action<T> Name;`（简化版，不够标准）
> - 触发前必须 null 检查

> [!origin] 由来背景
> 事件机制是 .NET 框架中 UI 编程和组件交互的基石。WPF 的 `Button.Click`、`TextBox.TextChanged` 全是事件。上位机中，`Device.OnDataReceived`、`AlarmManager.OnAlarm`、`ConnectionManager.OnDisconnected`——这些事件让松散耦合的模块能通信而不互相依赖。

> [!essentials] 核心要点
> - `event` 关键字：外部只能 `+=`/`-=`
> - 标准事件委托：`EventHandler` 或 `EventHandler<TEventArgs>`
> - 触发：`OnAlarm?.Invoke(this, EventArgs.Empty);`
> - 自定义 EventArgs 继承 `EventArgs`
> - 线程安全触发：`var handler = OnAlarm; handler?.Invoke(...);`

> [!example] 完整示例
> ```csharp
> public class TemperatureEventArgs : EventArgs
> {
>     public double Temperature { get; }
>     public TemperatureEventArgs(double temp) => Temperature = temp;
> }

> public class TemperatureSensor
> {
>     public event EventHandler<TemperatureEventArgs>? OnAlarm;
>     public event EventHandler? OnCalibrationNeeded;
    
>     private double _temperature = 20;
>     public double Temperature
>     {
>         get => _temperature;
>         set
>         {
>             _temperature = value;
>             if (value > 80)
>                 OnAlarm?.Invoke(this, new TemperatureEventArgs(value));
>             if (value < 0)
>                 OnCalibrationNeeded?.Invoke(this, EventArgs.Empty);
>         }
>     }
> }

> // ====== 订阅事件 ======
> var sensor = new TemperatureSensor();
> sensor.OnAlarm += (s, e) => Console.WriteLine($"🔴高温告警: {e.Temperature}℃");
> sensor.OnCalibrationNeeded += (s, e) => Console.WriteLine("⚠需要重新校准");

> sensor.Temperature = 85;  // 触发告警
> ```

> [!scene] 适用场景
> ✅ WPF 事件、设备告警、状态变化通知
> ✅ 组件间松耦合通信

> [!pitfall] 常见踩坑
> 坑 1：**`?.Invoke` 在多线程下仍有竞态** → 事件可能被多个线程同时触发，判空与调用之间存在窗口期。用"拍快照"模式：`var handler = OnAlarm; handler?.Invoke(this, e);`。
> 坑 2：**订阅后忘记退订** → 发布者引用订阅者，订阅者（如窗口控件）无法被 GC 回收，内存持续上涨。窗口关闭、对象销毁时记得 `-=`。
> 坑 3：**事件处理器里做耗时操作** → 事件触发是同步的，处理器有多慢发布者就卡多久。上位机数据到达事件里别做磁盘写入/UI 重绘，交给后台任务。
> 坑 4：**用 `== null` 判断"有没有人订阅"来判断业务状态** → 应显式设计状态（如 `HasSubscribers` 或独立标志），别依赖订阅人数。

> [!best] 最佳实践
> - 使用 `EventHandler<T>` 标准模式
> - 自定义 EventArgs 类名以 EventArgs 结尾
> - 触发前 `?.Invoke`
> - 不再需要时 `-=` 避免内存泄漏

> [!practice] 上手练习
> **Lv.1**：创建带简易事件的类
> **Lv.2**：为设备实现完整的事件通知（连接/断开/数据到达/告警）
> **Lv.3**：用事件总线解耦上位机模块

> [!related] 相关知识链接
> - ← delegate、Action/Func
> - → Lambda
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/event
