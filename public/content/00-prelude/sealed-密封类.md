---
title: sealed 密封类
section: 00-prelude
parent: 继承与多态
---

# sealed 密封类

> [!plain] 白话理解
> `sealed` 是继承链条上的"终点站"——被它标记的类不能再被继承，方法不能再被重写。就像军事禁区的"禁止入内"标志：你自己已经是最好的实现了，不需要别人来继承你。`string` 就是 `sealed` 的典型代表——微软不希望任何人去继承 string 然后搞出一个四不像。上位机中，当一个类的设计已经完成、不希望被修改核心行为时，加 `sealed` 是一种防御性编程。

> [!def] 官方定义
> - `sealed class`：不能被其他类继承。如果尝试继承 sealed 类，编译器报错。
> - `sealed override`：在派生类中阻止该方法继续被重写（终结虚方法链）。
> - `sealed` 和 `abstract` 互斥——`abstract` 要求被继承，`sealed` 禁止被继承。

> [!origin] 由来背景
> `sealed` 体现了 .NET 设计哲学中的"安全第一"。开源的框架类库往往不 `sealed`，留空间给社区扩展；但像 `System.String` 这种基础类型必须 `sealed`，因为它被 CLR 深度优化，任何子类化都可能引入不可预知的问题。另外，`sealed` 有一个隐藏的性能优势：JIT 编译器看到 `sealed` 类上的 `virtual` 调用时可以直接消除虚调用（Devirtualization）——因为确定不会有子类覆盖。

> [!essentials] 核心要点
> - `sealed class`：不能被继承
> - `sealed override`：阻止该方法在更深层子类中被继续重写
> - 结构（struct）是隐式 sealed 的
> - `static class` 也是隐式 sealed 的
> - 第三方库暴露 `sealed` 类 → 你就没法通过继承扩展它

> [!example] 完整示例
> ```csharp
> // sealed 类：最终实现，不接受继承
> public sealed class ModbusCrcValidator
> {
>     public static ushort Calculate(byte[] data) { /* CRC算法 */ return 0; }
>     public static bool Validate(byte[] frame) => Calculate(frame) == 0;
> }
> // ❌ class ExtendedValidator : ModbusCrcValidator { } // 编译错误！

> // sealed override：终结虚方法链
> public class BaseLogger
> {
>     public virtual void Log(string msg) => Console.WriteLine(msg);
> }

> public class FileLogger : BaseLogger
> {
>     public sealed override void Log(string msg)  // 重写但密封
>     {
>         // 写入文件...
>         base.Log($"[FILE] {msg}");
>     }
> }

> public class EncryptedLogger : FileLogger
> {
>     // ❌ public override void Log(string msg) { } // 已被sealed，不能重写！
> }
> ```

> [!scene] 适用场景
> ✅ 工具类/辅助类不应该被继承
> ✅ 安全敏感类（密码处理、权限检查）
> ✅ 高确定性算法类（CRC校验、编码转换）
> ✅ 性能敏感的热路径（允许JIT去虚拟化）
> ❌ 框架/插件架构（不应 sealed，留给用户扩展空间）

> [!pitfall] 常见踩坑
> 坑 1：**过度使用 sealed** → 把不该 sealed 的类封死了，后续想继承扩展只能改代码。
> 坑 2：**尝试继承 sealed 类** → 编译错误，可能需要组合或包装模式替代。

> [!best] 最佳实践
> - 不确定要不要 `sealed` 时先不加——未 sealed 可以被 sealed，反之不行
> - 内部实现类/工具类可以 `sealed`，公共扩展点不要 `sealed`
> - 性能关键路径上的类考虑 `sealed`（允许 JIT 去虚拟化）

> [!practice] 上手练习
> **Lv.1**：创建一个 `sealed` 工具类和尝试继承它
> **Lv.2**：用 `sealed override` 终结一个虚方法链
> **Lv.3**：分析你的上位机项目：哪些类该 `sealed`？哪些不该？

> [!related] 相关知识链接
> - ← 前置知识：abstract（sealed 的对立面）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/sealed
