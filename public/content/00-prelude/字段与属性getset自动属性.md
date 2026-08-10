---
title: 字段与属性（get/set/自动属性）
section: 00-prelude
parent: 类与对象
---

# 字段与属性（get/set/自动属性）

> [!plain] 白话理解
> 字段（Field）是类里直接裸露的数据，像没穿衣服的模特——谁都能看、谁都能摸。属性（Property）是给字段穿了件外套，外套上有两个"门"：`get`（取出数据的门）和 `set`（放入数据的门）。你可以在门上加锁（`private set`）、加安检（验证数据是否合法）、甚至不放门（`get` only）。在 WPF 中，属性比字段多一个超能力——它支持数据绑定（Binding），这是 MVVM 的基石。所以上位机代码里你会看到遍地属性，而字段几乎只躲在幕后。

> [!def] 官方定义
> - **字段（Field）**：类或结构中直接声明的变量，存储在对象实例中。通常是 `private`，不对外暴露。
> - **属性（Property）**：封装了 `get` 和/或 `set` 访问器的成员。提供对私有字段的受控访问，支持数据绑定、验证逻辑、计算值。
> - **自动属性**：`{ get; set; }` 语法糖，编译器自动生成后台字段（`<Name>k__BackingField`）。
> - 属性的本质是方法：`get` 和 `set` 被编译为 `get_PropertyName()` 和 `set_PropertyName(value)` 方法。

> [!origin] 由来背景
> Java 的 `getXxx()`/`setXxx()` 方法模式（JavaBean）曾是面向对象封装的标准——但太啰嗦了。C# 1.0 就引入了属性语法，把方法调用伪装成字段访问：`obj.Name = "hello"` 看起来像字段赋值，实际上在调用 `set` 访问器。C# 3.0 加入自动属性，进一步减少样板代码。C# 6.0 加入 `get;` only 自动属性和表达式体属性。这个演进路线体现了一个核心哲学：**封装不应该成为写代码的负担**。

> [!essentials] 核心要点
> - 字段：`private int _age;` —— 惯例用 `_` 前缀（或 `m_`，看团队风格）
> - 完整属性：手写 `get { return _age; } set { if (value >= 0) _age = value; }`
> - 自动属性：`public string Name { get; set; }` —— 编译器生成后台字段
> - 只读属性：`public int Id { get; }` —— 只能在构造函数里设置
> - 表达式体：`public string Display => $"{Name}({Id})";` —— 计算属性
> - `init` 访问器（C# 9.0）：`public string Code { get; init; }` —— 只能在对象初始化时设置

> [!example] 完整示例
> ```csharp
> public class SensorConfig
> {
>     // ========== 字段：私有，不对外暴露 ==========
>     private double _rawMin;
>     private double _rawMax;
    
>     // ========== 完整属性（带验证逻辑）==========
>     private double _engineeringMin;
>     public double EngineeringMin
>     {
>         get => _engineeringMin;
>         set
>         {
>             if (value >= EngineeringMax)
>                 throw new ArgumentException("量程下限不能大于等于上限");
>             _engineeringMin = value;
>         }
>     }
    
>     // ========== 完整属性（带验证）==========
>     private double _engineeringMax = 100.0;
>     public double EngineeringMax
>     {
>         get => _engineeringMax;
>         set
>         {
>             if (value <= EngineeringMin)
>                 throw new ArgumentException("量程上限不能小于等于下限");
>             _engineeringMax = value;
>         }
>     }
    
>     // ========== 自动属性 ==========
>     public string Name { get; set; } = "未命名传感器";
>     public string Unit { get; set; } = "℃";
    
>     // ========== get-only 自动属性 ==========
>     public Guid Id { get; } = Guid.NewGuid();
    
>     // ========== init-only 属性（一次赋值）==========
>     public string DeviceSerial { get; init; } = "";
    
>     // ========== 计算属性（只读）=========
>     public double Range => EngineeringMax - EngineeringMin;
    
>     // ========== 带转换的计算属性 ==========
>     public string RangeDisplay => $"{EngineeringMin} ~ {EngineeringMax} {Unit}";
    
>     // ========== 构造函数 ==========
>     public SensorConfig(string name, double min, double max)
>     {
>         Name = name;
>         EngineeringMin = min;
>         EngineeringMax = max;
>     }
    
>     // ========== 方法：利用属性完成量程转换 ==========
>     public double ConvertRawToEngineering(double rawValue)
>     {
>         double ratio = (rawValue - _rawMin) / (_rawMax - _rawMin);
>         return EngineeringMin + ratio * Range;
>     }
> }

> // ========== 使用演示 ==========
> var sensor = new SensorConfig("温度传感器", 4.0, 20.0)
> {
>     Unit = "mA",
>     DeviceSerial = "SN-2024-0001"
> };
> Console.WriteLine($"{sensor.Name} | 量程:{sensor.RangeDisplay} | ID:{sensor.Id.ToString()[..8]}...");

> // init-only 属性在对象创建后不能改
> // sensor.DeviceSerial = "new";  // ❌ 编译错误！
> ```

> [!scene] 适用场景
> ✅ `{ get; set; }`：普通数据字段
> ✅ `{ get; }`：只读标识符（ID、创建时间）
> ✅ `{ get; init; }`：不可变配置（序列号、协议类型）
> ✅ 计算属性：`=>` 表达式体，动态计算的值
> ✅ 带验证的属性：需要范围检查、非空检查
> ❌ 类内部纯计算辅助变量 → 局部变量或私有方法

> [!pitfall] 常见踩坑
> 坑 1：**WPF 绑定用字段而不是属性** → WPF 绑定只认**属性**，不认字段！`{Binding Name}` 能工作，`{Binding _name}` 绑不到。
> 坑 2：**自动属性的 `private set` 不等于不可变** → 类内部还是可以随意改，真正不可变用 `init` 或 `readonly` 字段。
> 坑 3：**递归属性** → `get { return this.Name; }` 无限递归导致 `StackOverflowException`！用后台字段来打破循环。

> [!best] 最佳实践
> - 字段永远 `private`，对外暴露用属性
> - 不需要验证的属性用自动属性：`{ get; set; }`
> - WPF 中需要通知 UI 变化的属性必须实现 `INotifyPropertyChanged`
> - 不可变数据用 `{ get; init; }`（C# 9.0+）
> - `private` 字段用 `_camelCase`，`public` 属性用 `PascalCase`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用完整属性+自动属性+计算属性定义 `MotorConfig` 类
> **Lv.2 小试牛刀**：为 `SensorConfig` 添加"超限告警"计算属性（基于 `EngineeringMin/Max` 判断原始值是否超限）
> **Lv.3 融会贯通**：设计 `ModbusRegister<T>` 泛型类——封装单个 Modbus 寄存器的原始值和工程值转换，内部用属性处理写入时的范围校验

> [!related] 相关知识链接
> - ← 前置知识：类的定义与实例化
> - → 后续必学：INotifyPropertyChanged、MVVM 数据绑定
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/classes-and-structs/properties
