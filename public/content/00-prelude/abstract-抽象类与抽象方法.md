---
title: abstract 抽象类与抽象方法
section: 00-prelude
parent: 继承与多态
---

# abstract 抽象类与抽象方法

> [!plain] 白话理解
> 抽象类是"不能直接 new 的类"——它只定义了"该怎么做"的骨架，但没把肉填上。就像你不能直接买一辆"车"，你只能买"比亚迪秦"或"特斯拉 Model 3"——"车"就是抽象的。`abstract` 方法更绝：只有签名没有实现体，像一纸合同——"谁继承我，谁就必须实现这个方法"。上位机架构中最常见的抽象类：`DeviceBase`（定义了 Connect/Read/Write 的契约，但具体实现交给 PLC、传感器、执行器）。

> [!def] 官方定义
> - `abstract class`：不能被实例化的类，只能被继承。可以包含抽象成员（无实现）和具体成员（有实现）。
> - `abstract method`：没有方法体（`;` 结尾），必须在非抽象的派生类中被 `override` 实现。
> - 抽象方法**只能**存在于抽象类中。
> - 抽象类可以有构造函数（供子类 `base(...)` 调用），可以有字段、属性、非抽象方法。
> - 和接口的区别：抽象类可以有实现（代码复用），接口只能有契约声明。

> [!origin] 由来背景
> 抽象类实现了面向对象设计的"里氏替换原则"——任何基类出现的地方都可以用子类替换。在 .NET 框架中，`Stream` 是抽象类（定义了 `Read`/`Write`/`Seek` 的契约），`FileStream`/`MemoryStream`/`NetworkStream` 是具体实现。上位机开发中这个模式极为实用：定义一个 `ProtocolBase` 抽象类，`ModbusProtocol` 和 `ProfinetProtocol` 各自实现——上层调用代码完全不需要知道下面跑的是哪种协议。

> [!essentials] 核心要点
> - `abstract class` 不能 `new`，只能被继承
> - `abstract` 方法无实现体，分号结尾
> - 派生类必须实现所有抽象方法（除非它自己也是 abstract）
> - 抽象类**可以**有构造函数、字段、具体方法
> - `abstract` 和 `virtual` 的区别：abstract 必须被重写，virtual 可选择重写

> [!example] 完整示例
> ```csharp
> public abstract class ProtocolBase
> {
>     public string Name { get; }
>     public int DefaultPort { get; }
    
>     protected ProtocolBase(string name, int defaultPort)
>     {
>         Name = name;
>         DefaultPort = defaultPort;
>     }
    
>     // ====== 抽象方法：必须被实现 ======
>     public abstract bool Connect(string ip, int port);
>     public abstract byte[] BuildReadCommand(byte slaveId, ushort addr, ushort count);
>     public abstract double ParseResponse(byte[] response);
    
>     // ====== 非抽象方法：提供默认实现 ======
>     public virtual bool IsValidIp(string ip)  // virtual：可选重写
>     {
>         return System.Net.IPAddress.TryParse(ip, out _);
>     }
    
>     // ====== 模板方法：流程固定，步骤由子类定义 ======
>     public double ReadRegister(string ip, byte slaveId, ushort addr)
>     {
>         if (!IsValidIp(ip)) throw new ArgumentException("无效IP");
>         if (!Connect(ip, DefaultPort)) throw new Exception("连接失败");
        
>         byte[] cmd = BuildReadCommand(slaveId, addr, 1);
>         byte[] response = new byte[0]; // 模拟发送...
>         return ParseResponse(response);
>     }
> }

> // ====== 具体实现：必须实现所有 abstract 方法 ======
> public class ModbusProtocol : ProtocolBase
> {
>     public ModbusProtocol() : base("Modbus TCP", 502) { }
    
>     public override bool Connect(string ip, int port)
>     {
>         Console.WriteLine($"[Modbus] 连接 {ip}:{port}");
>         return true;
>     }
    
>     public override byte[] BuildReadCommand(byte slave, ushort addr, ushort count)
>         => new byte[] { slave, 0x03, (byte)(addr >> 8), (byte)addr, (byte)(count >> 8), (byte)count };
    
>     public override double ParseResponse(byte[] response)
>     {
>         // 实际解析逻辑...
>         return 85.5;
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 设备驱动基类、协议基类、插件架构
> ✅ 一组类有部分共性+部分差异
> ✅ 强制派生类实现特定方法
> ❌ 纯粹的多重能力声明 → 接口

> [!pitfall] 常见踩坑
> 坑 1：**抽象类不能实例化** → 试图 `new ProtocolBase()` 会编译错误。
> 坑 2：**子类没实现所有抽象方法** → 编译错误，除非子类自己也声明为 `abstract`。
> 坑 3：**静态方法不能标记为 `abstract`** → 静态方法属于类型本身，不受多态支配。

> [!best] 最佳实践
> - "有一些默认行为+一些必须定制的行为" → 抽象类
> - 用模板方法模式固定流程，protected abstract 步骤方法让子类实现
> - 抽象类不应该是空的（那是接口该做的事）

> [!practice] 上手练习
> **Lv.1**：创建 `Shape` 抽象类含 `abstract double GetArea()`
> **Lv.2**：创建 `DeviceDriverBase` 抽象类，强制实现 `Initialize`/`Shutdown`
> **Lv.3**：用模板方法模式设计上位机通信抽象层

> [!related] 相关知识链接
> - ← 前置知识：virtual/override
> - → 后续必学：接口、接口 vs 抽象类
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/abstract
