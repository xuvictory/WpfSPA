---
title: JSON 序列化与反序列化（Newtonsoft.Json）
section: 00-prelude
parent: JSON 序列化
---

# JSON 序列化与反序列化（Newtonsoft.Json）

> [!plain] 白话理解
> JSON 序列化就是把 C# 对象变成字符串（方便存文件、发网络），反序列化就是把字符串变回对象。比如你有一个 `DeviceConfig` 对象，调用 `JsonConvert.SerializeObject(config)` 就能得到 `{"ip":"192.168.1.100","port":502}` 这样的 JSON 字符串——保存到 `config.json`，下次程序启动读回来，`JsonConvert.DeserializeObject<DeviceConfig>(json)` 还原成对象。Newtonsoft.Json（NuGet: `Newtonsoft.Json`，俗称 Json.NET）是 .NET 生态中事实标准的 JSON 库。

> [!def] 官方定义
> Json.NET 是高性能的 .NET JSON 框架。核心类 `JsonConvert` 提供：
> - `SerializeObject(obj)`：对象 → JSON 字符串
> - `DeserializeObject<T>(json)`：JSON 字符串 → 强类型对象
> - `JObject`：动态解析 JSON（不建类也能访问）

> [!example] 完整示例
> ```csharp
> using Newtonsoft.Json;

> public class DeviceConfig
> {
>     public string Ip { get; set; } = "192.168.1.100";
>     public int Port { get; set; } = 502;
>     public List<string> Sensors { get; set; } = new() { "TEMP-01" };
> }

> // 序列化
> var config = new DeviceConfig();
> string json = JsonConvert.SerializeObject(config, Formatting.Indented);
> Console.WriteLine(json);
> File.WriteAllText("config.json", json);

> // 反序列化
> string read = File.ReadAllText("config.json");
> var loaded = JsonConvert.DeserializeObject<DeviceConfig>(read);
> Console.WriteLine($"IP: {loaded!.Ip}, 端口: {loaded.Port}");

> // 动态解析（不建类）
> string raw = @"{""temperature"":85.5,""alarms"":[""高温"",""高压""]}";
> dynamic dyn = JsonConvert.DeserializeObject(raw)!;
> Console.WriteLine($"温度: {dyn.temperature}℃, 告警数: {dyn.alarms.Count}");
> ```

> [!scene] 适用场景
> ✅ 配置文件（appsettings 的替代/补充）、设备参数保存、网络API

> [!best] 最佳实践
> - 使用 `[JsonProperty("name")]` 映射不同命名
> - 用 `Formatting.Indented` 让配置文件可读
> - `JsonSerializerSettings` 统一配置日期格式、null 处理

> [!practice] 上手练习
> **Lv.1**：序列化和反序列化一个配置对象
> **Lv.2**：保存和加载设备列表
> **Lv.3**：实现配置管理单例模式

> [!related] 相关知识链接
> - → System.Text.Json
> - 📖 官方文档：https://www.newtonsoft.com/json/help
