---
title: 常量与只读字段（const vs readonly）
section: 00-prelude
parent: 变量与数据类型
---

# 常量与只读字段（const vs readonly）

> [!plain] 白话理解
> `const` 和 `readonly` 都是"不许改"，但时机不同。`const` 是"刻在石头上的铭文"——编译前就定死了，运行时碰都碰不到它（编译器直接把值嵌进了每一处引用）。`readonly` 是"上锁的抽屉"——对象创建时可以把东西放进去并锁上（构造函数里赋值），之后谁也改不了。一个最简单的区分方法：你写的 `const double PI = 3.14159;` 在编译后，所有用 `PI` 的地方都被直接替换成了 `3.14159`——运行时的内存里根本没有 `PI` 这个变量。

> [!def] 官方定义
> - **`const`（编译时常量）**：在编译时就必须能确定值的常量。只能是内置值类型、`string` 或 `null`。必须声明时初始化，之后永远不能改。属于类型本身，默认是 `static`。
> - **`readonly`（运行时常量）**：在运行时确定值的只读字段。可以在声明时或构造函数中赋值，之后不可修改。可以是任何类型。每个实例可以有不同的值（实例 `readonly`），也可以是 `static readonly`。

> [!origin] 由来背景
> `const` 来自 C/C++ 的 `#define` 宏的改进——`#define MAX 100` 只是文本替换，没有类型安全检查。C# 的 `const` 保留了"编译时内联"的性能优势，同时加上了类型检查。但 `const` 有个致命缺陷：如果 `const` 值变了，所有引用了它的程序集都必须重新编译，否则你还是旧值。这个坑直接催生了 `readonly`——它的值在运行时才绑定，更新 DLL 不需要重新编译调用方。上位机场景里，Modbus 寄存器地址、串口波特率这些"配置性常量"应该是 `readonly`，毕竟你不想换了个 PLC 就得把整个程序重新编译一遍。

> [!essentials] 核心要点
> - `const` 只能用在内置值类型 + `string` + `null`；`readonly` 可以是任何类型
> - `const` 是隐式 `static`；`readonly` 可以是实例成员或 `static readonly`
> - `const` 必须在声明时赋值；`readonly` 可以在声明时或构造函数里赋值
> - `const` 值在编译时被内联替换（所以改 const 值需要重新编译所有引用方）
> - `readonly` 值在运行时从内存读取（改 readonly 值只需重新编译定义方）
> - 经验法则：数学常量用 `const`，配置性常量用 `readonly` 或配置文件

> [!example] 完整示例
> ```csharp
> public class DeviceProtocol
> {
>     // ========== const：真正的常量，编译时确定 ==========
>     // 适合：数学常量、协议标准中永不变化的定值
>     public const int MODBUS_DEFAULT_PORT = 502;       // Modbus TCP 标准端口，永不变
>     public const byte BROADCAST_ADDRESS = 0x00;        // 广播地址
>     public const double KELVIN_OFFSET = 273.15;        // 物理常数
>     public const string PROTOCOL_NAME = "Modbus RTU";  // string 可以是 const
    
>     // ❌ 这些不能是 const：
>     // public const DateTime BUILD_TIME = DateTime.Now;     // 编译时不知道
>     // public const DeviceConfig DefaultConfig = new();     // 引用类型
>     // public const int Port = GetDefaultPort();             // 方法返回的值
    
>     // ========== readonly：运行时常量 ==========
>     // 适合：配置值、从外部读取的参数
>     public readonly int SlaveId;                    // 从站地址（构造函数设置）
>     public readonly TimeSpan ReadTimeout;            // 读取超时
    
>     // static readonly：全局共享但可能需要变更的常量
>     public static readonly Version ProtocolVersion = new Version(1, 0, 0);
>     public static readonly DateTime BuildTime = DateTime.Now; // 编译时间！
    
>     // 构造函数设置 readonly 字段
>     public DeviceProtocol(int slaveId, int timeoutMs = 3000)
>     {
>         SlaveId = slaveId;                          // ✅ readonly 可在构造函数赋值
>         ReadTimeout = TimeSpan.FromMilliseconds(timeoutMs);
        
>         // MODBUS_DEFAULT_PORT = 503;                // ❌ const 永远不能改
>     }
    
>     public void DisplayConfig()
>     {
>         Console.WriteLine($"协议: {PROTOCOL_NAME}");
>         Console.WriteLine($"端口: {MODBUS_DEFAULT_PORT}");
>         Console.WriteLine($"从站: {SlaveId}");
>         Console.WriteLine($"超时: {ReadTimeout.TotalMilliseconds}ms");
>         Console.WriteLine($"协议版本: {ProtocolVersion}");
>         Console.WriteLine($"编译时间: {BuildTime}");
>     }
> }

> // ========== 使用演示 ==========
> var protocol1 = new DeviceProtocol(1);
> var protocol2 = new DeviceProtocol(2, 5000);

> protocol1.DisplayConfig();
> Console.WriteLine("---");
> protocol2.DisplayConfig();
> // 注意：SlaveId 不同（实例级别 readonly），但 MODBUS_DEFAULT_PORT 相同（const）
> ```

> [!scene] 适用场景
> ✅ `const`：数学常量（`Math.PI`）、协议标准值（`MODBUS_PORT=502`）、错误码、枚举替代值
> ✅ `static readonly`：一次性初始化的单例或全局配置、程序编译时间戳
> ✅ 实例 `readonly`：构造函数注入的依赖、每个对象不同的不可变属性
> ✅ 上位机项目的选择法则：
>   - Modbus 功能码 `0x03`（读保持寄存器）→ `const`，协议标准永不变
>   - 串口波特率 `9600` → `readonly` 或配置文件，可能换设备
>   - PLC IP 地址 → 配置文件（`appsettings.json`），连 `readonly` 都别用

> [!pitfall] 常见踩坑
> 坑 1：**改了 `const` 值但引用方还是旧的！** → 这是 `const` 最经典的坑。
> ```csharp
> // Library.dll 中：
> public const int MaxRetry = 3;
> 
> // App.exe 引用 Library.dll，编译后 MaxRetry=3 被内联
> // 后来 Library.dll 把 MaxRetry 改为 5，只重新编译了 Library.dll
> // App.exe 运行时还是用 3！
> ```
> 解决：对外公开的常量用 `static readonly` 代替 `const`，避免跨程序集的编译时内联。
>
> 坑 2：**`readonly` 不是不可变对象！** → 
> ```csharp
> public readonly List<string> DeviceNames = new List<string>();
> // DeviceNames = new List<string>();  // ❌ 不能重新赋值
> DeviceNames.Add("PLC-001");           // ✅ 但可以修改内容！
> // readonly 只保护引用，不保护引用的对象
> ```
> 要真正不可变，用 `IReadOnlyList<T>` 或 `ImmutableList<T>`。
>
> 坑 3：**把应该放配置文件的值写成了 `const`** → 串口端口号、服务器地址、超时时间——这些"可能变但不需要改代码"的值别用 `const`。`const` 意味着"需要改代码+重新编译+重新部署"。

> [!best] 最佳实践
> - **对外公开的 API 常量，用 `static readonly`，不用 `const`**（避免跨程序集内联陷阱）
> - 内部私有常量可以用 `const`（反正都在同一个程序集里）
> - 命名规范：`const` 用 PascalCase（`ModbusPort`），`private` 可加下划线前缀
> - 上位机项目分层管理：
>   - 协议标准值 / 物理常数 → `const`
>   - 设备参数 / 可配置项 → `static readonly` 或 `appsettings.json`
>   - 运行时参数 / 依赖注入值 → 实例 `readonly` 字段
> - 如果真的永远不变（如 `Math.PI`、`int.MaxValue`），`const` 是最好选择，性能最优

> [!practice] 上手练习
> **Lv.1 照猫画虎**：定义 `const string AppName = "上位机监控系统";` 和 `static readonly DateTime StartTime = DateTime.Now;`，在程序启动时打印两者，体会编译时 vs 运行时的区别
> **Lv.2 小试牛刀**：创建 `ModbusConfig` 类，用 `const` 定义功能码（0x03/0x06/0x10），用 `readonly` 定义从站地址和超时时间（构造函数传入），写方法打印完整配置
> **Lv.3 融会贯通**：创建一个跨程序集实验——写一个类库项目定义 `public const int X = 10;`，一个控制台项目引用它并打印 `X`。然后改 `const` 值为 `20`，只重新编译类库不编译控制台，运行看结果。再用 `public static readonly int Y = 10;` 重复实验，对比差异

> [!related] 相关知识链接
> - ← 前置知识：值类型与引用类型（理解什么类型能做 const）
> - → 后续必学：访问修饰符（public/internal/private 与 const/readonly 的可见性搭配）
> - → 后续必学：静态成员（static readonly 的深入应用）
> - ⇄ 关联概念：不可变类型（readonly 只保护引用，ImmutableList 保护内容）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/const / https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/readonly
