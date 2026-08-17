---
title: Assembly Version vs File Version
section: 15-deployment
parent: 15.3 版本管理
---

# Assembly Version vs File Version

> [!plain] 白话理解
> 一个程序有两个"版本号"：`AssemblyVersion`（程序集版本）是给 .NET 运行时看的"身份证号"，改它会破坏引用绑定，不能乱动；`FileVersion`（文件版本）是给 Windows 资源管理器、"属性 → 详细信息"看的"展示牌"，每次构建都可以变。很多现场事故都源于把两者混为一谈——本节讲清"谁在什么时候动、怎么配置"，让版本号各司其职。

> [!def] 官方定义
> **AssemblyVersion**：程序集标识（`name, Version, Culture, PublicKeyToken`）的一部分，CLR 用它解析程序集引用，改变会破坏已编译依赖的绑定（强命名程序集尤其敏感）；**FileVersion**：写入 Win32 文件版本资源（`FileVersionInfo`），仅供资源管理器/安装包展示，不影响 CLR 加载；**ProductVersion**：产品版本，通常给安装包/更新显示。`.csproj` 中分别由 `<AssemblyVersion>` / `<FileVersion>` 控制；未单独设置时 `<Version>` 默认同时驱动两者。官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/assembly/versioning

> [!origin] 由来背景
> 两个版本号的存在源于"运行时标识"与"人类可读展示"的分离。.NET Framework 1.0 设计时，程序集版本必须精确（CLR 强名称绑定按它来），但团队又需要"每次构建一个可看的新版本号"来排障——于是 Win32 文件版本（FileVersion）被复用为展示层版本。实践上微软官方也明确：FileVersion 可自由递增，AssemblyVersion 变更需谨慎评估。现代 .NET（SDK 风格）用 `<Version>` 同时生成两者，既简化配置，也埋下"两者被当一回事"的坑——这正是本节要拆开的。

> [!essentials] 核心要点
> - **职责分工**：`AssemblyVersion` 管"CLR 能否加载这个程序集"；`FileVersion` 管"属性面板里显示什么"
> - **改动纪律**：AssemblyVersion 变了，引用它的程序集需重新编译；FileVersion 每次构建都可变
> - **读取 API**：`Assembly.GetName().Version` 读 AssemblyVersion；`FileVersionInfo.GetVersionInfo(path)` 读 File/Product 版本（示例已用）
> - **配置项**：`.csproj` 分别用 `<AssemblyVersion>`、`<FileVersion>`，共用 `<Version>` 模板可避免不同步
> - **展示对齐**：现场对版本时用 FileVersion/ProductVersion，别拿 AssemblyVersion 报号（见上一节）

> [!example] 完整示例
> **版本信息查看器：Assembly.GetName().Version 读取程序集版本、FileVersionInfo 读取文件版本与产品版本并对比展示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Assembly Version vs File Version" Height="420" Width="580"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="版本信息查看器" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtAssemblyName" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtAssemblyVersion" Foreground="#58A6FF" Margin="0,2" FontWeight="Bold"/>
>                 <TextBlock x:Name="TxtFileVersion" Foreground="#238636" Margin="0,2" FontWeight="Bold"/>
>                 <TextBlock x:Name="TxtProductVersion" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtLocation" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="重新读取" Click="OnReadClick" Padding="8" Margin="0,0,0,10"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="TxtExplain" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Diagnostics;
> using System.Reflection;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnReadClick(null, null);
>         }
>
>         private void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // AssemblyVersion：程序集标识的一部分，影响强名称绑定与引用兼容性，改动需谨慎
>                 Assembly asm = Assembly.GetExecutingAssembly();
>                 TxtAssemblyName.Text = "程序集：" + asm.GetName().Name;
>                 TxtAssemblyVersion.Text = "Assembly Version：" + asm.GetName().Version;
>                 // FileVersion：写入文件属性，面向展示与排障，每次构建都可以递增
>                 FileVersionInfo fvi = FileVersionInfo.GetVersionInfo(asm.Location);
>                 TxtFileVersion.Text = "File Version：" + fvi.FileVersion;
>                 TxtProductVersion.Text = "Product Version：" + fvi.ProductVersion;
>                 TxtLocation.Text = "程序集路径：" + asm.Location;
>                 TxtExplain.Text = "区别：Assembly Version 决定程序集引用解析，变更可能破坏依赖；" +
>                     "File Version 仅用于资源管理器/安装包显示，可随发布随意递增。";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("读取版本失败：" + ex.Message, "版本信息");
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 版本配置规划：决定程序集版本、文件版本各怎么设，避免"改一次崩一片"
> ✅ 现场版本核对：客户报"版本号对不上"，用示例代码一次性读出多种版本，快速定位差异
> ✅ 依赖引用控制：修改了公共库的 API，评估要不要动 AssemblyVersion、要不要让引用方重新编译
> ✅ 安装包/更新显示的版本统一：让"客户看到的版本"与文件版本一致（见 `语义版本号semver`）
> ❌ 单 exe 无依赖的小工具：两者同源即可，不必刻意拆分维护
> ❌ 内部频繁构建产物：构建号建议放 FileVersion 或 `+build` 元数据，别动 AssemblyVersion

> [!pitfall] 常见踩坑
> 坑 1：**改了 AssemblyVersion 导致"程序集找不到"** → 现象：更新公共 dll 后，主程序启动报 `FileLoadException`/`FileNotFoundException` → 原因：引用方按旧 AssemblyVersion 绑定，新版本号对不上 → 解决：AssemblyVersion 保持稳定（只在破坏性变更时递增），日常迭代只动 FileVersion
>
> 坑 2：**现场对版本对不上** → 现象：客户报的版本号在资源管理器里查不到 → 原因：程序显示的是 AssemblyVersion，资源管理器显示的是 FileVersion，两者不同步 → 解决：显示层一律读 `FileVersionInfo.ProductVersion`，与安装包/关于窗口对齐
>
> 坑 3：**以为 `<Version>` 一处改完万事大吉** → 现象：只改了 `<Version>`，FileVersion 是旧值或两者错位 → 原因：SDK 风格项目 `<Version>` 默认同时驱动两者，但一旦显式写了 `<AssemblyVersion>` 或 `<FileVersion>` 就会拆开 → 解决：要么只用 `<Version>` 同源，要么三处显式定义并保持一致

> [!best] 最佳实践
> - AssemblyVersion 尽量稳定：主版本对齐产品线（如 `1.0.x`），破坏性 API 变更才升主版本；日常修复/新功能只动 FileVersion
> - 用 `<Version>` 作单一事实源：不显式拆开时两者自动一致；要拆开就三处写在同一位置（如 `Directory.Build.props`），避免散落
> - 现场/日志展示统一用 ProductVersion：关于窗口、日志、安装包、更新提示都显示它，排障对号不打架
> - 版本号自动生成可考虑 CI：用 `git describe` 或时间戳生成构建号注入 FileVersion，AssemblyVersion 仍手动控制
> - 与 SemVer 联动：`语义版本号semver` 的"主.次.修订"规则映射到 FileVersion 展示，AssemblyVersion 遵循自身纪律

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例程序，读出当前 exe 的 Assembly/File/Product 三种版本，对照"属性 → 详细信息"面板
> **Lv.2 小试牛刀**：在 `.csproj` 里把 `<Version>` 改成 `2.1.0` 重新编译，观察三种版本如何变化；再单独加 `<FileVersion>2.1.0.5</FileVersion>` 看差异
> **Lv.3 融会贯通**：给示例加"关于窗口"：显示 ProductVersion 与最后构建时间，与安装包版本号保持一致
> **Lv.4 拆层挑战**：把版本配置挪到 `Directory.Build.props`：`<Version>` 由 git tag 推导（MSBuild 内联任务或预构建脚本），实现"打 tag 即出对应版本号"

> [!related] 相关知识链接
> - ← 前置知识：`语义版本号semver`（版本号三段规则，先定版本策略再配置）
> - → 后续必学：`clickonce-发布` / `msi-安装包wix-toolset`（发布与更新都依赖版本号）
> - ⇄ 关联概念：12 章 `增量更新与版本管理`（版本在更新链路的作用）、`目标机器-net-runtime-检查`（运行时版本与程序版本区分）
> - 📖 官方文档：程序集版本管理：https://learn.microsoft.com/zh-cn/dotnet/standard/assembly/versioning ；SDK 版本属性：https://learn.microsoft.com/zh-cn/dotnet/core/project-sdk/msbuild-props
