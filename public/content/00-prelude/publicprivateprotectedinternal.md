---
title: 访问修饰符（public/private/protected/internal）
section: 00-prelude
parent: 封装与访问修饰符
---

# 访问修饰符（public/private/protected/internal）

> [!plain] 白话理解
> 访问修饰符就是类成员的"通行证"。`public` = 大门敞开，谁都能进；`private` = 上了锁，只有类自己能用；`protected` = 家人特权，自己+子类能用；`internal` = 公司内部，同一个项目（程序集）的人都能用。上位机开发中 90% 的字段都是 `private`，属性和方法按需设为 `public` 或 `internal`。封装的大原则：**能用 private 就不用 public，能用 internal 就不用 public**。

> [!def] 官方定义
> - `public`：完全公开，无访问限制
> - `private`：仅限当前类（或结构）内部访问（默认访问级别）
> - `protected`：当前类及其派生类可访问
> - `internal`：同一程序集（DLL/EXE）内可访问（类/成员默认级别）
> - `protected internal`：同一程序集 **或** 派生类（满足任一条件即可）
> - `private protected`（C# 7.2）：同一程序集 **且** 是派生类（两个条件都要）

> [!origin] 由来背景
> 封装是面向对象三大支柱中最基础的一个。C# 的访问修饰符比 Java 更精细——Java 的"包级别访问"（default）约等于 C# 的 `internal`，但 C# 还有 `protected internal` 和 `private protected` 的组合。`internal` 在上位机开发中极为实用：你的通信库暴露给本项目的 API 用 `public`，而内部的协议解析细节用 `internal`——外部项目引用你的 DLL 时看不到这些细节。

> [!essentials] 核心要点速查

> | 修饰符 | 同类 | 派生类(同程序集) | 派生类(跨程序集) | 同程序集 | 任意 |
> |--------|------|-----------------|-----------------|----------|------|
> | `public` | ✅ | ✅ | ✅ | ✅ | ✅ |
> | `private` | ✅ | ❌ | ❌ | ❌ | ❌ |
> | `protected` | ✅ | ✅ | ✅ | ❌ | ❌ |
> | `internal` | ✅ | ✅ | ❌ | ✅ | ❌ |
> | `protected internal` | ✅ | ✅ | ✅ | ✅ | ❌ |
> | `private protected` | ✅ | ✅ | ❌ | ❌ | ❌ |

> [!example] 完整示例
> ```csharp
> // AssemblyA（通信库 DLL）
> public class ModbusClient
> {
>     // public：外部调用者可以用
>     public string IpAddress { get; }
    
>     // private：仅类内部使用
>     private Socket? _socket;
>     private byte[] _buffer = new byte[256];
    
>     // protected：派生类可用
>     protected int RetryCount { get; set; } = 3;
    
>     // internal：库内部共享
>     internal bool DebugMode { get; set; }
    
>     public ModbusClient(string ip)
>     {
>         IpAddress = ip;
>     }
    
>     public bool Connect() => TryConnect();
    
>     private bool TryConnect()  // 实现细节，外部不可见
>     {
>         // 连接逻辑...
>         return true;
>     }
    
>     protected virtual byte[] BuildFrame(byte funcCode)  // 子类可重写
>     {
>         return new byte[] { 0x01, funcCode };
>     }
> }

> // 同程序集的另一个类
> internal class ModbusInternalHelper  // internal 类：库外不可见
> {
>     internal static void LogDebug(ModbusClient client)
>     {
>         // 可以访问 internal 成员
>         if (client.DebugMode)
>             Console.WriteLine("Debug: ...");
>     }
> }

> // 派生类
> public class ModbusRtuClient : ModbusClient
> {
>     public ModbusRtuClient(string ip) : base(ip) { }
    
>     public void Configure()
>     {
>         // 子类可以访问 protected 成员
>         RetryCount = 5;
>     }
    
>     protected override byte[] BuildFrame(byte funcCode)  // 重写
>     {
>         // 添加 CRC
>         var frame = base.BuildFrame(funcCode);
>         // ...添加 CRC
>         return frame;
>     }
> }
> ```

> [!scene] 适用场景
> ✅ `private`：内部状态字段、辅助方法、实现细节
> ✅ `public`：对外 API（库的公开方法、ViewModel 的属性）
> ✅ `protected`：设计给子类重写的虚方法、模板方法模式
> ✅ `internal`：项目内共享的工具类、不需要暴露给外部的类型

> [!pitfall] 常见踩坑
> 坑 1：**类的默认访问级别是 `internal`，成员的默认是 `private`** → 忘了加 `public` 导致跨程序集引用报错。
> 坑 2：**`protected internal` 是"或"不是"且"** → 满足任一条件即可。
> 坑 3：**单元测试需要 `internal` 成员** → 在测试项目中加 `[assembly: InternalsVisibleTo("TestProject")]`。

> [!best] 最佳实践
> - 字段一律 `private`（或 `protected`），对外暴露用属性
> - 工具类不需要被外部引用时标记 `internal`
> - 派生类模板方法用 `protected virtual`
> - 公开 API 要稳定，internal 的可以随时改

> [!practice] 上手练习
> **Lv.1**：创建 `DeviceBase` 类，用不同修饰符为各成员标注，在 Main 中测试哪些能访问
> **Lv.2**：用 `protected` 实现模板方法模式：基类定义处理流程，子类重写具体步骤
> **Lv.3**：创建一个类库项目 + 一个引用它的控制台项目，验证 `public`/`internal` 的跨程序集行为

> [!related] 相关知识链接
> - → 后续必学：继承（`protected` 的核心舞台）
> - ⇄ 关联概念：属性封装（访问修饰符让属性 get/set 可以有不同的访问级别）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/access-modifiers
