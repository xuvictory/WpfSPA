---
title: virtual、override 与 new 关键字
section: 00-prelude
parent: 继承与多态
---

# virtual、override 与 new 关键字

> [!plain] 白话理解
> 基类说"我的 `Connect()` 方法是 **virtual** 的——子类你要是觉得不合适，可以 **override**（重写）它"。于是子类说"好，我 override 你的 `Connect()`，加上 TCP 三次握手的逻辑"。但假如子类写了 `new void Connect()`——这是说"我不认你那个方法了，我有个全新的同名方法，但跟你的没关系"——多态调用时就可能出 Bug。简单说：`virtual` 是"我允许被重写"，`override` 是"我来重写你"，`new` 是"你那个我不认，我另起炉灶"。

> [!def] 官方定义
> - `virtual`：标记基类方法为可被派生类重写。没有 `virtual` 的方法不能被 `override`。
> - `override`：派生类中重写基类的 `virtual`/`abstract`/`override` 方法。运行时根据实际对象类型调用。
> - `new`：在派生类中**隐藏**基类的同名成员（不参与多态分发）。通过基类引用调用时走基类版本。

> [!origin] 由来背景
> C# 的设计者故意让方法默认是"不可重写"的（不像 Java 默认所有方法都是 virtual）。这不是偷懒——而是一个深思熟虑的防御性设计：每个可被重写的方法都需要基类作者**明确许可**（加 `virtual`）。这让基类的 public API 更稳定——你不会意外地被子类改变了行为。而上位机开发中，`virtual` + `override` 最常见的模式是"模板方法模式"：`Process()` 是总流程（非 virtual），`Parse()` 和 `Validate()` 是 virtual 步骤。

> [!essentials] 核心要点
> - 默认方法不能重写，必须加 `virtual`
> - `override` 后的方法默认也是 `virtual`（可被下一层子类继续重写）
> - `sealed override` 阻止继续重写
> - `new` 是隐藏而不是重写——基类引用调基类版本，子类引用调子类版本
> - 调用 `base.Method()` 可以在 override 中调用基类的原始实现

> [!example] 完整示例
> ```csharp
> public class CommunicationBase
> {
>     // virtual：允许子类重写
>     public virtual bool Connect()
>     {
>         Console.WriteLine("[BASE] 通用连接（3次尝试）");
>         return true;
>     }
    
>     // 非 virtual：子类不能重写，只能 new 隐藏
>     public string GetProtocolVersion() => "v1.0";
    
>     // 模板方法（非 virtual，控制流程；内部调用 virtual 方法）
>     public void Process()
>     {
>         Console.WriteLine("[BASE] 开始处理...");
>         Validate();
>         Execute();
>         Console.WriteLine("[BASE] 处理完成");
>     }
    
>     protected virtual void Validate() => Console.WriteLine("[BASE] 默认校验");
>     protected virtual void Execute() => Console.WriteLine("[BASE] 默认执行");
> }

> public class ModbusTcpComm : CommunicationBase
> {
>     // override：真正重写
>     public override bool Connect()
>     {
>         Console.WriteLine("[ModbusTCP] TCP三次握手...");
>         bool result = base.Connect();  // 调用基类实现
>         Console.WriteLine("[ModbusTCP] 握手完成");
>         return result;
>     }
    
>     // new：隐藏（不推荐）
>     public new string GetProtocolVersion() => "ModbusTCP v2.0";
    
>     // 重写模板方法的步骤
>     protected override void Validate() 
>         => Console.WriteLine("[ModbusTCP] CRC校验");
>     protected override void Execute() 
>         => Console.WriteLine("[ModbusTCP] 发送Modbus帧");
> }

> // ====== 多态行为对比 ======
> Console.WriteLine("=== 子类引用 ===");
> var tcp = new ModbusTcpComm();
> tcp.Connect();                    // 调 ModbusTcpComm.Connect
> Console.WriteLine(tcp.GetProtocolVersion());  // "ModbusTCP v2.0"（new隐藏版）

> Console.WriteLine("\n=== 基类引用（多态）===");
> CommunicationBase baseRef = tcp;
> baseRef.Connect();                // 仍是 ModbusTcpComm.Connect（多态！）
> Console.WriteLine(baseRef.GetProtocolVersion());  // "v1.0"（new不走多态！）

> Console.WriteLine("\n=== 模板方法 ===");
> baseRef.Process();  // 流程固定，但步骤被子类重写
> ```

> [!scene] 适用场景
> ✅ `virtual`+`override`：模板方法模式、策略模式、设备协议的差异化实现
> ✅ `new`：非常罕见——仅在无法修改基类但必须提供同名方法时用
> ✅ `sealed override`：明确某方法不允许再被重写

> [!pitfall] 常见踩坑
> 坑 1：**忘了写 `override` → 变成 `new`** → 编译器会警告，但代码能通过——方法不走多态！
> 坑 2：**基类引用调不到 `new` 版本** → `new` 隐藏不走多态分发。
> 坑 3：**`override` 的方法可以继续用 `virtual`** → 不想让孙子类重写就加 `sealed override`。

> [!best] 最佳实践
> - 模板方法模式：非 virtual 流程方法 + `protected virtual` 步骤方法
> - 永远别用 `new` 隐藏基类成员（除非遇到无法改基类的场景）
> - `override` 中先或后调 `base.Method()` 要明确顺序意图

> [!practice] 上手练习
> **Lv.1**：创建带 `virtual Draw()` 的基类和 `override Draw()` 的子类
> **Lv.2**：用 `virtual`+`override` 实现设备初始化模板方法
> **Lv.3**：对比 `override` 和 `new` 在多态下的行为差异

> [!related] 相关知识链接
> - ← 前置知识：基类与派生类
> - → 后续必学：abstract、sealed
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/virtual
