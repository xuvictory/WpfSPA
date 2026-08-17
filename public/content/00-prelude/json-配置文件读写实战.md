---
title: JSON 配置文件的读写实战
section: 00-prelude
parent: JSON 序列化
---

# JSON 配置文件的读写实战

> [!plain] 白话理解
> 上位机软件一定需要配置文件——设备列表、通信参数、告警阈值总不能写死在代码里吧？JSON 是配置文件的最佳格式。流程就是：程序启动 → 读 `appconfig.json` → 反序列化为 C# 对象 → 程序用这些配置运行。用户改了 JSON 文件 → 程序重启后新的配置就生效了。

> [!def] 官方定义
> 配置驱动是上位机软件的常见架构：程序从外部 JSON 文件读取设备表、通信参数与告警阈值，运行期可修改、重启即生效。本实战以 `System.Text.Json` 的 `JsonSerializer` 为核心，封装一个 `ConfigManager`，统一处理"默认值生成、加载、保存"三个环节。

> [!origin] 由来背景
> 配置到底放哪？早期方案是 INI 文件或 XML——INI 不支持嵌套结构，XML 冗长难读，都要手写解析器。JSON 出现后凭"结构化、轻量、可读、生态完整"迅速成为配置文件的事实标准：设备列表这种嵌套数据能自然表达，C# 反序列化一行搞定，现场工程师用记事本就能改。从 .NET 的 `appsettings.json` 到桌面程序的 `config.json`，配置管理全面走向"模型驱动"，上位机也不例外。

> [!essentials] 核心要点
> - 模型类属性用 `{ get; set; }`，集合/对象属性给默认值 `= new()`，避免反序列化得到 null 集合
> - 反序列化要兜底：`?? new AppConfig()`，别让配置文件写错一个逗号就崩
> - 首次运行自动生成默认配置文件，现场无需手动创建
> - 敏感字段（密码、令牌）不应明文存 JSON，应加密存储或放环境变量
> - 保存用 `WriteIndented = true` 缩进，现场改文件更友好
> - 配置读取后缓存为静态/单例，避免频繁读磁盘

> [!example] 完整示例
> ```csharp
> using System.Text.Json;

> public class AppConfig
> {
>     public string AppName { get; set; } = "上位机监控";
>     public CommunicationConfig Communication { get; set; } = new();
>     public List<DeviceEntry> Devices { get; set; } = new();
>     public AlarmConfig Alarms { get; set; } = new();
> }
> public class CommunicationConfig { public int TimeoutMs { get; set; } = 3000; public int RetryCount { get; set; } = 3; }
> public class DeviceEntry { public string Id { get; set; } = ""; public string Ip { get; set; } = ""; public int Port { get; set; } = 502; }
> public class AlarmConfig { public double TemperatureHigh { get; set; } = 80; public double PressureHigh { get; set; } = 2.0; }

> public class ConfigManager
> {
>     private static readonly string ConfigPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appconfig.json");
    
>     public static AppConfig Load()
>     {
>         if (!File.Exists(ConfigPath))
>         {
>             var defaults = new AppConfig
>             {
>                 Devices = { new() { Id = "PLC-001", Ip = "192.168.1.100" } }
>             };
>             Save(defaults);
>             return defaults;
>         }
>         string json = File.ReadAllText(ConfigPath);
>         return JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
>     }
    
>     public static void Save(AppConfig config)
>     {
>         var options = new JsonSerializerOptions { WriteIndented = true };
>         string json = JsonSerializer.Serialize(config, options);
>         File.WriteAllText(ConfigPath, json);
>     }
> }

> // 使用
> var config = ConfigManager.Load();
> Console.WriteLine($"应用: {config.AppName}, 设备数: {config.Devices.Count}");
> config.Devices.Add(new() { Id = "PLC-002", Ip = "192.168.1.101" });
> ConfigManager.Save(config);
> ```

> [!scene] 适用场景
> ✅ 设备列表、通信参数、告警阈值等运行参数
> ✅ 需要现场人员可编辑、可版本管理的配置
> ❌ 高频热更新数据 → 放内存/数据库，别每次读文件
> ❌ 涉密凭据（密码、令牌）→ 加密存储，别明文进 JSON

> [!pitfall] 常见踩坑
> 坑 1：**属性没有默认值** → JSON 缺字段时集合/对象属性反序列化为 null，运行期空引用崩溃。初始化 `= new()`。
> 坑 2：**写错一个逗号全崩** → 反序列化抛 `JsonException` 不处理，程序起不来。try-catch 回退默认配置并提示用户检查文件。
> 坑 3：**保存时机不当** → 每次配置改动就落盘，频繁写磨损磁盘，写一半断电还可能损坏文件。重要改动才 Save。
> 坑 4：**路径依赖当前目录** → 用 `AppContext.BaseDirectory` 定位，否则以服务方式启动时找不到配置文件。

> [!best] 最佳实践
> - 第一次运行时自动生成默认配置文件
> - JSON 放执行文件同目录，方便现场修改
> - 配置改动后提供"重载"按钮（管理权限）

> [!practice] 上手练习
> **Lv.1**：保存/加载简单配置
> **Lv.2**：实现完整上位机配置管理器（含默认值生成）
> **Lv.3**：实现配置加密（敏感字段如密码）

> [!related] 相关知识链接
> - ← Newtonsoft、System.Text.Json
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/configuration
