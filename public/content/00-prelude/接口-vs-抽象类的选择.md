---
title: 接口 vs 抽象类的选择
section: 00-prelude
parent: 继承与多态
---

# 接口 vs 抽象类的选择

> [!plain] 白话理解
> 接口是"合同"——规定了你的类**能做**什么（能力证书）。抽象类是"模板"——提供了代码的**骨架**和部分**默认实现**。选哪个？一个简单的判断法：如果你要说"所有 Modbus 设备**都是**设备"（is-a 关系），用抽象类；如果你要说"这个类**能够**通信"（can-do 能力），用接口。接口像贴在身上的标签，可以贴多张；抽象类是血缘关系，只能有一个爸爸。

> [!def] 官方定义
> | 特性 | 接口（Interface） | 抽象类（Abstract Class） |
> |------|------------------|-------------------------|
> | 多重继承 | 可实现多个接口 | 只能继承一个基类 |
> | 成员实现 | 只能签名（C# 8 可有默认实现） | 可以有具体实现 |
> | 构造函数 | 不能有 | 可以有 |
> | 字段 | 不能有 | 可以有 |
> | 访问修饰符 | 成员默认 public | 成员可用各种修饰符 |
> | 实例化 | 不能 | 不能 |

> [!origin] 由来背景
> 这个问题在 .NET 社区辩了 20 年。微软的官方建议在 .NET Framework Design Guidelines 里：**优先选择抽象类**因为它可以随时加新成员而不会破坏现有实现（C# 8 默认接口方法缓解了这个问题），但**必须多继承时只能选接口**。上位机中的一个经典场景：`DeviceBase`（抽象类）定义设备共性（ID、名称、状态），`ICommunication`（接口）赋予通信能力——两者组合使用，而非二选一。

> [!example] 完整示例
> ```csharp
> // ====== 抽象类：设备共性 ======
> public abstract class DeviceBase
> {
>     public string Id { get; }
>     public string Name { get; protected set; }
>     public bool IsOnline { get; protected set; }
    
>     protected DeviceBase(string id, string name)
>     {
>         Id = id;
>         Name = name;
>     }
    
>     public abstract string GetDeviceType();
>     public virtual string GetInfo() => $"[{Id}] {Name}";
> }

> // ====== 接口：通信能力 ======
> public interface ICommunication
> {
>     bool Connect();
>     void Disconnect();
> }

> // ====== 接口：告警能力 ======
> public interface IAlertable
> {
>     event EventHandler<string> OnAlert;
>     void CheckAlert();
> }

> // ====== 组合使用：抽象类 + 多个接口 ======
> public class PlcDevice : DeviceBase, ICommunication, IAlertable
> {
>     public string IpAddress { get; }
>     public event EventHandler<string>? OnAlert;
    
>     public PlcDevice(string id, string ip) : base(id, $"PLC-{id}")
>     {
>         IpAddress = ip;
>     }
    
>     public override string GetDeviceType() => "PLC";
    
>     public bool Connect()
>     {
>         Console.WriteLine($"[{Id}] TCP连接 {IpAddress}...");
>         IsOnline = true;
>         return true;
>     }
    
>     public void Disconnect()
>     {
>         IsOnline = false;
>     }
    
>     public void CheckAlert()
>     {
>         // 检查逻辑...
>         OnAlert?.Invoke(this, "温度超标");
>     }
> }

> // 没有通信能力的设备：只靠抽象类就够了
> public class ManualSwitch : DeviceBase
> {
>     public ManualSwitch(string id) : base(id, "手动开关") { }
>     public override string GetDeviceType() => "手动开关";
> }
> ```

> [!scene] **选择的黄金法则**
> - **抽象类**：is-a 关系 + 有默认实现 + 共享字段
> - **接口**：can-do 能力 + 多继承 + 无状态
> - **两者组合**：大型架构的标准做法（抽象类提供共性，接口提供能力）

> [!best] 最佳实践
> - 先从接口开始设计——接口更灵活，随时可转为抽象类
> - 抽象类 + 接口组合 > 纯抽象类 or 纯接口
> - 上位机：`DeviceBase`(抽象类) + `ICommunication`/`IConfigurable`/`IAlarmable`(接口)

> [!practice] 上手练习
> **Lv.1**：设计"交通工具"体系，体会什么时候用抽象类、什么时候用接口（`IFlyable`）
> **Lv.2**：设计上位机设备模型：抽象类定义共性，接口赋予通信/告警/配置能力
> **Lv.3**：写一份技术决策文档：什么场景选接口，什么场景选抽象类

> [!related] 相关知识链接
> - ← 前置知识：abstract、接口
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/design-guidelines/choosing-between-class-and-struct
