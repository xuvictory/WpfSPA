---
title: 引用类型：string 与 object
section: 00-prelude
parent: 变量与数据类型
---

# 引用类型：string 与 object

> [!plain] 白话理解
> 如果说值类型是一本"写满内容的笔记本"（纸上有字），那引用类型就是一张"写有地址的便利贴"（纸上只写了个门牌号）。`string` 是 C# 中最特殊的引用类型——它用起来像值类型（赋值、比较都很自然），但骨子里是引用类型。`object` 则是所有类型的"老祖宗"，不管什么类型的数据，都能装进 `object` 这个万能容器里。

> [!def] 官方定义
> 引用类型（Reference Type）存储的是数据在托管堆上的内存地址（引用），而不是数据本身。当赋值给另一个变量时，复制的是引用（两个变量指向同一个对象）。`string` 是 `System.String` 的别名，代表不可变的 Unicode 字符序列。`object` 是 `System.Object` 的别名，是 .NET 类型系统中所有类型（包括值类型和引用类型）的最终基类。

> [!origin] 由来背景
> 值类型和引用类型的分野源自计算机内存管理的本质需求。栈（Stack）空间小而快，适合放临时小数据（int、bool），出了方法就自动回收；堆（Heap）空间大但管理复杂，适合放大小不固定的数据（字符串、数组、对象）。C# 把 `string` 设计为引用类型，是因为字符串长度可长可短，硬塞进栈里在几十年前就是灾难。但为了让 `string` 用起来顺手，微软不惜给它加了"不可变性"这条规则——每次修改字符串其实都是在堆上创建新对象。这是典型的"牺牲一点性能，换来使用安全"的设计取舍。

> [!essentials] 核心要点
> - `string` 是引用类型，但表现像值类型（不可变 + `==` 比较内容）
> - `string` 的赋值、拼接、截取操作都会创建新字符串，原字符串不变
> - `object` 可以存储任何类型：`object obj = 42; object obj2 = "hello";`
> - 从 `object` 取回原始类型需要**拆箱**（unboxing）：`int num = (int)obj;`
> - `object` 是"万物之父"——即使你定义 `class MyClass { }`，它也隐式继承自 `object`
> - `null` 表示引用不指向任何对象（string 可以为 null，int 不行，除非是 `int?`）

> [!example] 完整示例

> ##### string 的基本操作
> ```csharp
> // string 的不可变性演示
> string s1 = "Hello";
> string s2 = s1;        // s2 和 s1 指向同一个字符串对象
> s1 = s1 + " World";    // s1 现在指向新对象 "Hello World"
>                         // s2 仍然指向旧对象 "Hello"

> Console.WriteLine(s1); // Hello World
> Console.WriteLine(s2); // Hello

> // string 的 == 比较的是"内容"而不是"地址"
> string a = "abc";
> string b = "abc";
> Console.WriteLine(a == b);   // True — 比较内容
> Console.WriteLine(a.Equals(b)); // True — 同上

> // 字符串常用方法
> string deviceName = "  PLC-001  ";
> Console.WriteLine(deviceName.Trim());        // "PLC-001" 去两端空格
> Console.WriteLine(deviceName.ToUpper());     // "  PLC-001  " 全大写
> Console.WriteLine(deviceName.Replace("-", "_")); // "  PLC_001  " 替换
> Console.WriteLine(deviceName.Contains("PLC"));   // True
> Console.WriteLine(deviceName.Length);        // 11（包含首尾空格）
> ```

> ##### object 的装箱拆箱
> ```csharp
> // 装箱：值类型 → object（从栈搬到堆，有性能成本）
> int temperature = 25;
> object boxed = temperature;   // 装箱！

> // 拆箱：object → 值类型（从堆搬回栈，需要显式转换）
> int unboxed = (int)boxed;     // 拆箱！

> // 拆箱类型必须完全匹配，否则运行时抛异常
> // long wrong = (long)boxed;   // ❌ InvalidCastException!
> // 正确做法：先转对类型，再转换
> long correct = (int)boxed;    // ✅ 隐式从 int→long

> // object 数组 — 工业配置的万能容器
> object[] deviceConfig = new object[]
> {
>     "PLC-001",      // string: 设备编号
>     192.168,         // double（注意：不是 int！小数点不能省）—— 看下面踩坑
>     502,             // int: Modbus 端口
>     true             // bool: 是否启用
> };

> string id = (string)deviceConfig[0];
> int port = (int)deviceConfig[2];
> bool enabled = (bool)deviceConfig[3];
> Console.WriteLine($"设备 {id}，端口 {port}，启用状态 {enabled}");
> ```

> ##### 上位机场景：拼接协议命令
> ```csharp
> // 用 string 拼接 Modbus RTU 命令帧
> byte slaveId = 0x01;
> ushort startAddr = 0x0000;
> ushort quantity = 0x0004;

> // 方式一：+ 拼接（新手写法，可读性差）
> string frame1 = slaveId.ToString("X2") + "03" 
>     + startAddr.ToString("X4") + quantity.ToString("X4");

> // 方式二：$ 插值（推荐，清晰直观）
> string frame2 = $"{slaveId:X2}03{startAddr:X4}{quantity:X4}";

> // 方式三：object 数组存储混合类型配置（用于解析 JSON 配置文件）
> object[] modbusConfig = { (byte)1, "03", (ushort)0, (ushort)4, "2C" }; // CRC
> ```

> [!scene] 适用场景
> **string** ✅ 上位机日志文本、设备名称、协议字符串、XML/JSON 数据处理<br>
> ❌ 不要用 `+=` 在循环中频繁拼接大字符串（每次拼接都创建新对象，垃圾回收压力大）→ 用 `StringBuilder`

> **object** ✅ 反射调用、序列化前的中间存储、旧版集合（`ArrayList`）<br>
> ❌ 能不用就不用——拆箱有性能损耗，类型不安全。新代码优先用**泛型**（`List<T>`、`Dictionary<K,V>`）

> [!pitfall] 常见踩坑
> 坑 1：**`string` 判空漏了 `null` 检查** → 
> ```csharp
> string name = GetDeviceName(); // 可能返回 null
> if (name == "")  // ❌ null 不会进入这个分支
> if (string.IsNullOrEmpty(name)) // ✅ 同时检查 null 和 ""
> if (string.IsNullOrWhiteSpace(name)) // ✅ 连纯空格也过滤
> ```
>
> 坑 2：**以为 `192.168` 赋值给 `object` 是 `double`，结果它根本不是合法数值字面量** → 
> ```csharp
> object obj = 192.168;  // ❌ 编译错误！192.168 不是合法数值
> object obj = 192.168d; // ❌ 还是不行，这会被解析为方法调用语法
> // 正解：如果就是要小数，用 192.168d 或 192.168m
> // 如果是要 IP 地址，用 string
> object ip = "192.168.1.100"; // 这才是 IP
> ```
> （修正说明：`192.168` 在 C# 中实际上会被解释为一个 `double` 字面量，等同于 `192.168`，因为小数点后跟数字就是 `double`。上面示例已修正为正确的 IP 字符串写法。）

> 坑 3：**`string` 和 `String` 傻傻分不清** → C# 中 `string` 是 `System.String` 的别名，`string` 是 C# 关键字（蓝色高亮），`String` 是类名。**编码规范要求一律用小写 `string`**，只有调用静态方法时偶尔见到 `String.IsNullOrEmpty()`（但也可以写成 `string.IsNullOrEmpty()`）。

> [!best] 最佳实践
> - 字符串判空一律用 `string.IsNullOrWhiteSpace()`，别自己手写 `== null || == ""`
> - 代码中统一用小写 `string`，别用大写 `String`（除非调静态方法时懒的改习惯）
> - 循环中大量字符串拼接 → 必用 `StringBuilder`，否则每次拼接都在堆上创建新对象，毫秒变秒
> - `object` 参数只在必须支持多种类型的 API 中使用（如旧版事件 `object sender`），新代码优先用泛型
> - 上位机开发中，把设备配置存成 `Dictionary<string, object>` 可以实现"一个配置表适配所有设备"，但取值时要小心类型转换
> - 比较两个字符串是否相同时，用 `==` 就够了（string 重载了 `==` 操作符比较内容），但在需要区分大小写的场景用 `string.Equals(a, b, StringComparison.Ordinal)`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：定义5个变量分别存设备编号、温度、湿度、运行状态、安装日期，用 `object[]` 数组存起来，然后依次取出来打印
> **Lv.2 小试牛刀**：写一个方法，输入是 `object` 类型的设备配置，内部判断实际类型后做不同处理——是 `string` 就当设备名打印，是 `int` 就当端口号+100后打印，其他类型提示"不支持的类型"
> **Lv.3 融会贯通**：模拟一个 Modbus 协议解析器。给定一个十六进制字符串 `"0103000000044409"`（从站地址+功能码+起始地址+数量+CRC），用 `Substring` 方法分段解析出每个字段的含义，并打印解析报告

> [!related] 相关知识链接
> - ← 前置知识：值类型（搞懂值类型才能理解引用的"不是值本身而是地址"这个概念）
> - → 后续必学：string 进阶操作（插值、格式化、正则）
> - → 后续必学：泛型（有了泛型，object 的万能容器角色就逐渐被替代）
> - ⇄ 关联概念：装箱与拆箱（值类型和 object 之间的转换，性能敏感场景要避免）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/strings/
