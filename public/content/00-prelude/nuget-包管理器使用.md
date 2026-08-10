---
title: NuGet 包管理器使用
section: 00-prelude
parent: 解决方案结构
---

# NuGet 包管理器使用

> [!plain] 白话理解
> NuGet 就是 .NET 世界的「应用商店」——全球开发者把自己的代码库打包上传上去，你需要什么功能（JSON 处理、串口通讯、Excel 导出、Modbus 协议），打开 NuGet 搜索、点击安装，几秒钟后就能直接 `using` 调用。你不用去找 GitHub 地址、不用下载源码、不用手动拷 DLL、不用管版本冲突——NuGet 帮你全部搞定。上位机开发中最常用的 NuGet 包有：`Newtonsoft.Json`（配置读写）、`System.IO.Ports`（串口通讯）、`NModbus`（Modbus 协议）、`CommunityToolkit.Mvvm`（MVVM 框架）。

> [!def] 官方定义
> NuGet 是 .NET 平台的包管理器（Package Manager），由微软维护。它提供包的创建、托管（nuget.org）、分发和消费的完整工具链。在 VS 中通过「管理 NuGet 程序包」GUI 或 PMC（Package Manager Console）操作；在 CLI 中用 `dotnet add package` 命令。安装的包记录在 .csproj 的 `<PackageReference>` 中，还原时由 NuGet 客户端从配置的包源下载并解析依赖树。

> [!origin] 由来背景
> NuGet 诞生于 2010 年，最初叫 NuPack，后来改名 NuGet。它的出现解决了 .NET 开发两大痛点：① 引用 DLL 需要手动下载、解压、拷文件、Add Reference，版本升级时噩梦连连；② 不同团队之间共享代码没有标准化渠道。NuGet 借鉴了 Ruby 的 Gem 和 Linux 的 apt-get 的设计，引入了包源（Package Source）、依赖树解析、版本约束、nuget.org 中央仓库等概念。2017 年 SDK 风格项目用 `<PackageReference>` 替代了臃肿的 `packages.config`，让 NuGet 真正「无感」。

> [!essentials] 核心要点

> **四种 NuGet 操作方式对比**：

> | 方式 | 操作 | 优点 | 适用场景 |
> |------|------|------|---------|
> | VS GUI | 右键项目 →「管理 NuGet 程序包」 | 可视化浏览、搜索、版本选择 | 日常开发（最常用） |
> | PMC 命令行 | `Install-Package Newtonsoft.Json` | 在 VS 内不离开键盘 | 熟悉命令的老手 |
> | dotnet CLI | `dotnet add package Newtonsoft.Json` | 跨平台、可脚本化 | CI/CD 脚本、跨平台开发 |
> | 手动编辑 .csproj | 添加 `<PackageReference>` | 最精确 | 批量加包、条件引用 |

> **上位机项目必备 NuGet 包清单**：

> | 包名 | 用途 | 安装命令 |
> |------|------|---------|
> | `Newtonsoft.Json` | JSON 序列化/反序列化（配置文件） | `dotnet add package Newtonsoft.Json` |
> | `System.IO.Ports` | 串口通讯 | `dotnet add package System.IO.Ports` |
> | `NModbus` | Modbus RTU/TCP 协议 | `dotnet add package NModbus` |
> | `CommunityToolkit.Mvvm` | MVVM 框架（ObservableObject/RelayCommand） | `dotnet add package CommunityToolkit.Mvvm` |
> | `Serilog.Sinks.File` | 结构化日志 | `dotnet add package Serilog.Sinks.File` |
> | `Microsoft.Extensions.DependencyInjection` | 依赖注入容器 | `dotnet add package Microsoft.Extensions.DependencyInjection` |

> [!example] 完整示例
>
> **场景：从零搭建上位机项目的 NuGet 环境**：
>
> ```bash
> # 1. 创建 WPF 项目
> dotnet new wpf -n PlcMonitor
> cd PlcMonitor
> 
> # 2. 安装 JSON 处理包（配置文件读写）
> dotnet add package Newtonsoft.Json --version 13.0.3
> 
> # 3. 安装串口通讯包（和设备通信）
> dotnet add package System.IO.Ports --version 8.0.0
> 
> # 4. 安装 MVVM 工具包（界面架构）
> dotnet add package CommunityToolkit.Mvvm --version 8.2.2
> 
> # 5. 安装日志包（记录运行日志）
> dotnet add package Serilog.Sinks.File --version 5.0.0
> 
> # 6. 查看已安装的包
> dotnet list package
> ```
>
> **安装后 .csproj 中的 PackageReference**：
> ```xml
> <ItemGroup>
>   <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
>   <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
>   <PackageReference Include="Serilog.Sinks.File" Version="5.0.0" />
>   <PackageReference Include="System.IO.Ports" Version="8.0.0" />
> </ItemGroup>
> ```
>
> ```csharp
> // 安装后直接在代码中使用
> using Newtonsoft.Json;          // 来自 Newtonsoft.Json 包
> using System.IO.Ports;          // 来自 System.IO.Ports 包
> using Serilog;                  // 来自 Serilog 包
> using CommunityToolkit.Mvvm.ComponentModel; // 来自 CommunityToolkit.Mvvm 包
> 
> // JSON 序列化（感谢 Newtonsoft.Json）
> var config = JsonConvert.DeserializeObject<AppConfig>(jsonString);
> 
> // 串口通讯（感谢 System.IO.Ports）
> using var port = new SerialPort("COM3", 9600);
> port.Open();
> 
> // 日志记录（感谢 Serilog）
> Log.Information("PLC 设备连接成功");
> ```

> [!scene] 适用场景
> ✅ 引入任何第三方功能：从 JSON 处理到图表控件，先搜 NuGet
> ✅ 团队标准化：团队维护一个内部 NuGet 源，把通用组件打进去
> ✅ 版本升级：NuGet 自动检查包是否有更新
> ✅ 依赖管理：一个包依赖另一个包时，NuGet 自动解析并安装整个依赖链
> ❌ 内部未发布的代码——用项目引用，不要临时打个 NuGet 包再装

> [!pitfall] 常见踩坑
> 坑 1：**NuGet 还原失败，红字报错** → 常见原因：① 网络问题（nuget.org 连不上）；② 公司内网需要配私有 NuGet 源；③ 某些包被作者删除了；④ 包的版本号不存在。**解决方案**：先 `dotnet restore --verbosity detailed` 看详细错误。如果是网络问题，在 VS 中「工具 → 选项 → NuGet 包管理器 → 程序包源」添加公司内部源或代理。
>
> 坑 2：**`packages.config` vs `<PackageReference>`，搞不清楚该用哪个** → SDK 风格项目（.NET Core/5+）一律用 `<PackageReference>`（写在 .csproj 里）。老式 .NET Framework 项目如果还在用 `packages.config`，建议右键解决方案 →「将 packages.config 迁移到 PackageReference」。前者要额外管理 `packages/` 文件夹，后者清爽太多。
>
> 坑 3：**装了包的某个版本，但实际使用时报版本不匹配** → NuGet 的依赖树可能装了比你预期更新的版本（依赖传递）。你的项目指定了 A v1.0，但 A 依赖 B v2.0，最终项目中 B 会是 v2.0 而不是你可能期望的 v1.0。**解决方案**：遇到版本冲突时，在 .csproj 中显式指定冲突包的版本来「固定」版本。

> [!best] 最佳实践
> - 安装前先搜：nuget.org 上可能有比你知道的更好的替代包
> - 关注下载量和更新频率：下载量 < 1000 且两年没更新的包慎用（可能已废弃）
> - 版本号用精确版（如 `13.0.3`）而不是浮动版（`13.*`）——确保全团队一致，CI/CD 结果可复现
> - 内部 NuGet 源：公司建自己的 NuGet Server（Azure Artifacts / BaGet / Nexus），发布团队通用库
> - 定期升级：每月花半小时用「管理 NuGet 程序包」→「更新」标签扫描一遍，避免技术债堆积
> - 包锁文件：在 .csproj 同级目录生成 `packages.lock.json`（`dotnet restore --use-lock-file`），确保依赖版本绝对确定

> [!practice] 上手练习
> **Lv.1 照猫画虎**：新建 WPF 项目，通过 VS 的「管理 NuGet 程序包」界面安装 `Newtonsoft.Json`。在代码中用 `JsonConvert.SerializeObject()` 把一个 `new { Name = "PLC-01", Temp = 36.5 }` 对象转成 JSON 字符串，显示在 MessageBox 中。
>
> **Lv.2 小试牛刀**：同时安装 `Newtonsoft.Json` 和 `System.Text.Json`，分别用两个包实现同一个对象的序列化，对比生成的 JSON 有什么区别。然后用 `dotnet list package` 查看已安装的所有包及版本。
>
> **Lv.3 融会贯通**：搭建一个完整的上位机项目 NuGet 环境。安装：`System.IO.Ports`（串口）、`NModbus`（协议）、`Newtonsoft.Json`（配置）、`Serilog.Sinks.File`（日志）、`CommunityToolkit.Mvvm`（MVVM）。用一个 `appsettings.json` 配置这些包的使用（串口参数、日志路径）。写一个初始化方法验证所有包都可用。

> [!related] 相关知识链接
> - ← 项目引用与依赖管理——NuGet 引用和项目引用是两种不同的依赖方式
> - ← .csproj 项目文件说明——PackageReference 写在 .csproj 里
> - → JSON 序列化与反序列化——Newtonsoft.Json 包的具体用法
> - ⇄ 类库项目的作用——你也可以把自己的类库打成 NuGet 包
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/nuget/
