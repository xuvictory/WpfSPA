---
title: System.Text.Json
section: 00-prelude
parent: JSON 序列化
---

# System.Text.Json

> [!plain] 白话理解
> `System.Text.Json`（STJ）是微软在 .NET Core 3.0 推出的"亲儿子"JSON 库，内置于运行时、零依赖、比 Newtonsoft 更快。如果 Newtonsoft 是第三方高手，STJ 就是国家队——性能和安全性更好，但 API 风格更严格、功能覆盖不如 Newtonsoft 全面。新项目优先上 STJ，遇到 STJ 不支持的特性再切 Newtonsoft。

> [!def] 官方定义
> `System.Text.Json` 是 .NET 内置的高性能 JSON 序列化框架。核心类 `JsonSerializer`：
> - `Serialize(obj)` / `Deserialize<T>(json)`
> - 默认严格区分大小写
> - 默认不处理循环引用
> - 通过 `JsonSerializerOptions` 配置

> [!example] 完整示例
> ```csharp
> using System.Text.Json;

> var config = new { Ip = "192.168.1.100", Port = 502 };

> // 序列化
> var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
> string json = JsonSerializer.Serialize(config, options);
> Console.WriteLine(json);

> // 反序列化
> var loaded = JsonSerializer.Deserialize<DeviceConfig>(json);
> Console.WriteLine($"还原: {loaded!.Ip}:{loaded.Port}");

> public class DeviceConfig
> {
>     public string Ip { get; set; } = "";
>     public int Port { get; set; }
> }
> ```

> [!scene] 适用场景
> ✅ .NET Core/5+ 新项目默认选择
> ✅ 性能敏感场景（比 Newtonsoft 快 1.5~3倍）

> [!best] 最佳实践
> - 新项目首选 STJ
> - `PropertyNamingPolicy = CamelCase` 适配 Web API
> - `JsonSerializerOptions` 单例复用

> [!practice] 上手练习
> **Lv.1**：STJ 基本序列化
> **Lv.2**：配置 STJ 选项（驼峰/忽略null/缩进）

> [!related] 相关知识链接
> - ← Newtonsoft.Json
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json
