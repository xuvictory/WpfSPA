---
title: .NET SDK 安装
section: 00-prelude
parent: 开发环境
---

# .NET SDK 安装

> [!plain] 白话理解
> VS 2022 是做饭的"厨房"，而 .NET SDK 是那套"锅碗瓢盆+菜谱"——没有 SDK，你连 `dotnet new` 都敲不出来。SDK 提供了编译器（把 C# 代码变成可运行的程序）、运行时（让程序跑起来）和一整套命令行工具。装了 VS 不等于装好了最新 SDK，它们是可以独立安装的。

> [!def] 官方定义
> .NET SDK（Software Development Kit）是用于构建 .NET 应用程序的一套工具和库。它包含 .NET Runtime（运行时）、.NET CLI（命令行工具，如 `dotnet build`、`dotnet run`）、Roslyn 编译器以及一组基础类库。对于 WPF 开发，你需要安装支持 Windows 桌面开发的 .NET SDK（如 .NET 8.0 或 .NET 9.0 SDK）。

> [!origin] 由来背景
> 在 Visual Studio 诞生之初，编译器和库和 IDE 是深度绑定的——你没法脱离 VS 单独编译 C# 项目。2016 年微软推出 .NET Core 后，SDK 被设计为独立于 IDE 的轻量化工具链。这意味着即使在服务器（没有 VS）上也能用 `dotnet build` 编译项目，在 CI/CD 流水线里也能自动化构建。对于上位机开发者来说，能脱离 VS 在工厂现场的工控机上快速部署依赖环境，就是 SDK 独立化的实际价值。

> [!essentials] 核心要点
> - 推荐版本：**.NET 9.0 SDK**（2025年最新 LTS 版本支持）
> - 或者 **.NET 8.0 SDK**（当前最稳定的 LTS 版本，企业项目首选）
> - SDK 包含 Runtime，无需单独安装 Runtime
> - `dotnet --list-sdks` 查看已安装的 SDK 版本
> - `dotnet --list-runtimes` 查看已安装的运行时版本
> - 可以同时安装多个 SDK 版本，互不冲突

> [!example] 完整示例
> ##### 方式一：通过 Visual Studio Installer（推荐新手）
> ```bash
> 1. 打开 Visual Studio Installer
> 2. 点击 VS 2022 旁边的「修改」
> 3. 在"工作负载"标签页，确保勾选 ".NET 桌面开发"
> 4. 切换到"单个组件"标签页
> 5. 搜索 ".NET 9.0"，勾选 ".NET 9.0 SDK" 和 ".NET 9.0 运行时"
> 6. 点击"修改"开始安装
> ```
>
> ##### 方式二：独立安装（推荐，更灵活）
> ```bash
> # 1. 访问 https://dotnet.microsoft.com/zh-cn/download
> # 2. 下载 .NET 9.0 SDK (Windows x64 安装程序)
> # 3. 双击运行，一路下一步即可
> ```
>
> ##### 安装后验证
>
> 打开 PowerShell 或 CMD，运行以下命令：
>
> ```powershell
> dotnet --version
> ```
>
> 正常应输出类似：
>
> ```powershell
> # 9.0.100
> ```
>
> 再运行：
>
> ```powershell
> dotnet --list-sdks
> ```
>
> 输出示例：
>
> ```powershell
> # 8.0.100 [C:\Program Files\dotnet\sdk]
> # 9.0.100 [C:\Program Files\dotnet\sdk]
> ```
>
> ##### 创建一个 WPF 项目来验证 SDK 是否好用
>
> ```powershell
> dotnet new wpf -n TestWpfApp -o D:\Projects\TestWpfApp
> cd D:\Projects\TestWpfApp
> dotnet build
> # 看到 "生成成功" 就说明 SDK 安装完全正常
> ```

> [!scene] 适用场景
> ✅ 所有 .NET 项目的编译、运行、发布都依赖 SDK
> ✅ 在没装 VS 的工控机上用 `dotnet publish` 发布独立运行包
> ✅ CI/CD 自动化构建流水线中必需（如 GitHub Actions、Azure DevOps）
> ✅ 用 `dotnet new` 快速生成 WPF/类库/测试项目模板
> ❌ 如果只写脚本型小工具，可以只用 `dotnet-script`（但这种情况极少）
>
> 上位机场景：工厂现场的工控机通常不会装 VS，但你需要把程序"发布"成能在上面运行的包——这时候 SDK 的 `dotnet publish` 命令就是核心工具。

> [!pitfall] 常见踩坑
> 坑 1：**SDK 版本和项目目标框架不匹配** → 用 `dotnet new wpf` 建了项目发现编译报错 `NETSDK1045: 当前 .NET SDK 不支持将 .NET 9.0 设置为目标`。解决：运行 `dotnet --list-sdks` 看自己装的是哪个版本，修改 `.csproj` 中的 `<TargetFramework>` 为你已安装的版本，或者升级 SDK。
>
> 坑 2：**环境变量 Path 没生效** → `dotnet` 命令提示"不是内部或外部命令"。解决：安装后**重启**终端（PowerShell/CMD），如果还不行，检查环境变量 `PATH` 中是否包含 `C:\Program Files\dotnet\`。极端情况需要手动添加后重启电脑。
>
> 坑 3：**装了 SDK 但 VS 里还是找不到模板** → SDK 安装程序和 Visual Studio 是独立的，SDK 只管命令行。要在 VS 里用，需要在 VS Installer 里同步勾选对应版本的 SDK 组件。

> [!best] 最佳实践
> - 安装 .NET 8.0 SDK（LTS 长期支持）+ .NET 9.0 SDK（最新版）双版本，既稳定又能尝鲜
> - 在项目根目录创建 `global.json` 文件锁定 SDK 版本，避免团队开发时版本不一致：
>   ```json
>   {
>     "sdk": {
>       "version": "8.0.100",
>       "rollForward": "latestFeature"
>     }
>   }
>   ```
> - 定期运行 `dotnet sdk check` 检查 SDK 是否有更新
> - 对于生产环境的上位机项目，优先选择 LTS 版本（偶数版本号：.NET 6、.NET 8、.NET 10）
> - 卸载旧 SDK 前先用 `dotnet --list-sdks` 确认没有项目还在依赖它

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `dotnet --version` 确认你的 SDK 版本号，用 `dotnet --list-sdks` 列出所有已安装版本
> **Lv.2 小试牛刀**：用 `dotnet new console -n MySdkTest` 创建一个控制台项目，`dotnet build` 编译，`dotnet run` 运行，确认整个流程走通
> **Lv.3 融会贯通**：创建 `global.json` 锁定你当前用的 SDK 版本，尝试安装一个不同版本的 SDK，观察 `dotnet --list-sdks` 的输出变化

> [!related] 相关知识链接
> - ← 前置知识：Visual Studio 2022 安装与配置（IDE 和 SDK 的关系要理清）
> - → 后续必学：第一个控制台程序 Hello World（装完 SDK 后的第一次编码）
> - ⇄ 关联概念：NuGet 包管理器（SDK 内置的依赖管理工具，`dotnet add package`）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/core/sdk
