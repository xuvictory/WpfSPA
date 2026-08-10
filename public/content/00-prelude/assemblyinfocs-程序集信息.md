---
title: AssemblyInfo.cs 程序集信息
section: 00-prelude
parent: WPF 项目创建
---

# AssemblyInfo.cs 程序集信息

> [!plain] 白话理解
> `AssemblyInfo.cs` 是编译出来那个 .exe 文件的「出生证」——记录了程序的姓名（程序集标题）、身份证号（GUID）、出生日期（版本号）、户主（公司名）、国籍（语言文化）等信息。你在文件资源管理器里右键 .exe → 属性 → 详细信息，看到的「文件版本」「产品名称」「版权」就是从 AssemblyInfo 来的。上位机部署到客户现场后，技术支持问「你跑的哪个版本？」，你右键看属性就能确认。

> [!def] 官方定义
> AssemblyInfo.cs 是 .NET 程序集的元数据配置文件，通过程序集级别的自定义属性（Assembly-level Attributes）描述程序集的标识、版本、版权、可见性等信息。这些属性在编译时嵌入到程序集清单（Assembly Manifest）中，运行时可通过 `System.Reflection.Assembly` 类反射读取。在 SDK 风格项目（.NET 5+）中，部分属性可以迁移到 .csproj 中直接设置，AssemblyInfo.cs 不再是必需文件。

> [!origin] 由来背景
> AssemblyInfo.cs 从 .NET Framework 1.0（2002 年）就存在了。当年 Windows 沿用 COM 组件的理念，每个 DLL 必须有自己的版本号、类型库标识等元数据。虽然 .NET 不需要注册 COM，但保留了元数据的概念。早期 AssemblyInfo.cs 内容非常多，包含 `AssemblyVersion`、`AssemblyFileVersion`、`ComVisible`、`Guid` 等十几行属性。到了 SDK 风格项目（.NET Core 3.0+），微软开始推动「简化」，大部分属性可以直接写在 .csproj 里，AssemblyInfo.cs 逐渐变成一个可选文件——但默认模板还是帮你生成了它。

> [!essentials] 核心要点

> **AssemblyInfo.cs 核心属性解读**（按重要程度排序）：

> ```csharp
> using System.Reflection;
> using System.Runtime.InteropServices;
> using System.Windows;

> // ── 最重要的四个版本属性 ──

> // 1. 程序集版本（强名称版本，.NET 运行时用这个做程序集绑定）
> [assembly: AssemblyVersion("1.0.0.0")]

> // 2. 文件版本（显示在文件属性 → 详细信息中的版本号）
> [assembly: AssemblyFileVersion("1.0.0.0")]

> // 3. 产品版本（产品层面的版本号，可和文件版本不同）
> // [assembly: AssemblyInformationalVersion("1.0.0-beta1")]

> // ── 身份信息 ──
> [assembly: AssemblyTitle("PLC 设备监控系统")]
> [assembly: AssemblyDescription("基于 WPF 的 PLC 设备实时监控与管理平台")]
> [assembly: AssemblyCompany("ABC 自动化科技有限公司")]
> [assembly: AssemblyProduct("PLC Monitor")]

> // ── 版权与商标 ──
> [assembly: AssemblyCopyright("© 2024 ABC 自动化科技. 保留所有权利.")]
> [assembly: AssemblyTrademark("")]

> // ── 其他 ──
> [assembly: AssemblyCulture("")]  // 语言文化（空=中性语言）

> // COM 互操作（上位机一般不碰 COM，可以不管）
> [assembly: ComVisible(false)]

> // 程序集 GUID（唯一标识符，VS 自动生成，不要手动改）
> [assembly: Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890")]

> // WPF 主题信息（告诉 WPF 这个程序使用什么主题感知）
> [assembly: ThemeInfo(
>     ResourceDictionaryLocation.None,  // 非特定主题资源位置
>     ResourceDictionaryLocation.SourceAssembly // 特定主题资源位置
> )]
> ```

> **SDK 风格项目的简化方式**（在 .csproj 中替代 AssemblyInfo）：

> ```xml
> <PropertyGroup>
>     <!-- 这些在 .csproj 里设，AssemblyInfo.cs 里就不用再写了 -->
>     <Version>1.2.0</Version>
>     <AssemblyVersion>1.2.0.0</AssemblyVersion>
>     <FileVersion>1.2.0.0</FileVersion>
>     <Company>ABC 自动化科技</Company>
>     <Product>PLC Monitor</Product>
>     <Copyright>© 2024</Copyright>
>     <Description>PLC 设备监控系统</Description>
> </PropertyGroup>
> ```

> [!example] 完整示例
> ```csharp
> // Properties/AssemblyInfo.cs — 上位机项目完整示例
> using System.Reflection;
> using System.Runtime.InteropServices;
> using System.Windows;
> 
> // 版本号规则：主版本.次版本.构建号.修订号
> // 1.0.0.0 → 1 = 大版本, 0 = 功能更新, 0 = Bug修复, 0 = 当天第几次构建
> [assembly: AssemblyVersion("1.2.0.0")]
> [assembly: AssemblyFileVersion("1.2.0.0")]
> 
> [assembly: AssemblyTitle("PLC 设备监控系统")]
> [assembly: AssemblyDescription("基于 Modbus TCP 协议的三菱/西门子 PLC 实时监控平台")]
> [assembly: AssemblyConfiguration("Release")]
> [assembly: AssemblyCompany("深圳市XYZ自动化科技有限公司")]
> [assembly: AssemblyProduct("PLC Monitor Pro")]
> [assembly: AssemblyCopyright("© 2024 XYZ Automation. All rights reserved.")]
> [assembly: AssemblyTrademark("")]
> [assembly: AssemblyCulture("")]
> 
> // 这行会让 .exe 的文件属性的「语言」栏为「中文(简体)」
> // 如果不需要，保持空字符串即可
> 
> [assembly: ComVisible(false)]
> 
> // 此 GUID 由 VS 创建项目时自动生成，不要手动改
> [assembly: Guid("f8a7b6c5-d4e3-2109-8765-4321abcdef01")]
> 
> // WPF 主题资源位置声明
> // None: 主题无关资源放在当前程序集
> // SourceAssembly: 主题特定资源放在当前程序集
> [assembly: ThemeInfo(
>     ResourceDictionaryLocation.None,
>     ResourceDictionaryLocation.SourceAssembly
> )]
> ```
>
> **运行时读取 AssemblyInfo 信息**：
> ```csharp
> using System.Reflection;
> 
> // 在任何位置读取程序集信息
> var assembly = Assembly.GetExecutingAssembly();
> 
> string title = assembly.GetCustomAttribute<AssemblyTitleAttribute>()?.Title;
> string version = assembly.GetName().Version?.ToString();     // "1.2.0.0"
> string company = assembly.GetCustomAttribute<AssemblyCompanyAttribute>()?.Company;
> string copyright = assembly.GetCustomAttribute<AssemblyCopyrightAttribute>()?.Copyright;
> 
> // 上位机用法：在关于对话框中显示版本
> MessageBox.Show($"{title}\n版本：{version}\n{copyright}", "关于");
> ```

> [!scene] 适用场景
> ✅ 上位机部署时确认版本：技术支持在现场右键 .exe 看文件版本号，和服务器上的版本对比
> ✅ 自动更新检查：程序启动时读取自身 AssemblyFileVersion，联网比对最新版本
> ✅ 关于对话框：把 AssemblyTitle、AssemblyVersion、AssemblyCopyright 显示在「关于」窗口
> ✅ 日志记录：程序启动日志中写上版本号，排查问题时知道客户跑的是哪个版本
> ❌ 日常编码——AssemblyInfo 改一次能用很久，不需要频繁改动

> [!pitfall] 常见踩坑
> 坑 1：**改了 AssemblyFileVersion 但右键属性还是显示老版本号** → Windows 文件资源管理器有缓存。改完重新编译后，复制 exe 到另一个文件夹再看属性，或用 PowerShell 命令 `(Get-Item .\MyApp.exe).VersionInfo.FileVersion` 查看。另外确认你改的是 `AssemblyFileVersion`（这个显示在文件属性里），而不是只改了 `AssemblyVersion`。
>
> 坑 2：**AssemblyInfo.cs 和 .csproj 同时设了同一属性，冲突了** → SDK 风格项目下，如果 .csproj 和 AssemblyInfo.cs 都设置了 `AssemblyVersion`，编译时会报错 CS0579（重复属性）。**解决方案**：删掉 AssemblyInfo.cs 中对应的那行，只保留在 .csproj 中设。或者反过来，把 .csproj 中自动生成的元数据关闭：`<GenerateAssemblyInfo>false</GenerateAssemblyInfo>`。
>
> 坑 3：**AssemblyVersion 和 AssemblyFileVersion 傻傻分不清** → `AssemblyVersion` 是 .NET 运行时的强名称版本——如果通过强名称签名发布，CLR 用这个版本做程序集绑定，改了它就破坏了兼容性。`AssemblyFileVersion` 是 Windows 文件属性中显示的版本，你可以随意改它而不影响兼容性。上位机通常不搞强名称签名，所以两个设一样就行。

> [!best] 最佳实践
> - 版本号语义化：`主版本.次版本.修订号.构建号`。如 `2.1.0.0` = 第二个大版本的第一次功能更新
> - CI/CD 自动打版本：在构建流水线中用日期作为构建号，如 `1.2.0.20240801`（2024年8月1日构建）
> - 版权年份动态化：`[assembly: AssemblyCopyright("© 2024-{DateTime.Now.Year}")]` 不可行（属性值必须编译时常量）。替代方案：CI/CD 脚本在替换版本号时一并替换版权年份
> - .csproj 优先原则：新项目优先把元数据写在 .csproj 中，减少 AssemblyInfo.cs 的内容，一文件管全局更清晰
> - 用 `dotnet --info` 或 `dotnet --version` 无法看你的 exe 版本——那是 .NET SDK 的版本。看你自己的程序请用右键属性或反射

> [!practice] 上手练习
> **Lv.1 照猫画虎**：打开现有 WPF 项目，找到 `Properties/AssemblyInfo.cs`。把 `AssemblyTitle` 改成你的项目名，`AssemblyFileVersion` 改成 `1.0.0.1`。重新编译，右键生成的 .exe → 属性 → 详细信息，确认版本号和标题已更改。
>
> **Lv.2 小试牛刀**：在 MainWindow 中加一个「关于」按钮，点击后用 `Assembly.GetExecutingAssembly()` 读取 AssemblyTitle、AssemblyVersion、AssemblyCopyright，展示在 MessageBox 中。尝试故意写错属性名，看编译报什么错。
>
> **Lv.3 融会贯通**：制定公司级版本号规范：所有上位机项目用统一的版本号格式 `年份.月份.修订号.构建号`（如 `24.08.01.001`）。写一个简单的 PowerShell 脚本，读取 .csproj 中的 `<Version>` 并在编译前自动递增构建号。在「关于」对话框中同时显示程序版本和 .NET 运行时版本。

> [!related] 相关知识链接
> - ← .csproj 项目文件说明——部分 AssemblyInfo 属性可迁移到 .csproj
> - ⇄ WPF App 项目模板——模板自动生成初始 AssemblyInfo.cs
> - → NuGet 包管理器使用——第三方包也有自己的 AssemblyInfo
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/assembly/set-attributes
