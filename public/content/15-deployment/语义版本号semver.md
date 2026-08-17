---
title: 语义版本号（SemVer）
section: 15-deployment
parent: 15.3 版本管理
---

# 语义版本号（SemVer）

> [!plain] 白话理解
> 版本号是软件的"沟通语言"：`1.2.3` 三个数字各司其职——主版本变 = 不兼容的大改动，次版本变 = 加新功能但向后兼容，修订号变 = 修 bug。约定好这套规则，客户、现场工程师、你自己，光看版本号就知道这次升级"动了什么、能不能直接升"。否则就会出现"1.2 和 1.10 谁大"这种低级事故，以及"升个级把配置搞坏"的惨案。

> [!def] 官方定义
> **语义化版本（Semantic Versioning，SemVer）**：由 Tom Preston-Werner（GitHub 创始人）提出、`semver.org` 维护的版本号规范。格式为 `主版本.次版本.修订`（Major.Minor.Patch），前置零非法；`1.0.0-alpha` 等预发布后缀按规则参与排序。.NET 侧 `System.Version` 提供 `Major`/`Minor`/`Build`/`Revision` 属性与 `CompareTo` 比较（示例代码即用此实现）。官方规范：https://semver.org/lang/zh-CN/ ；.NET Version 类：https://learn.microsoft.com/zh-cn/dotnet/api/system.version

> [!origin] 由来背景
> 版本号混乱曾是软件协作的大坑：不同项目各写各的规则，"2.1"和"2.1.0"谁大、`1.10` 会不会被当 `1.1`？2010 年 Tom Preston-Werner 发布 SemVer 2.0.0 规范，把版本号规则固化为"主.次.修订 + 递增规则 + 预发布标识"，GitHub、npm、NuGet 生态迅速采用。.NET 的 `System.Version` 更早（.NET Framework 1.0）就内置了四段式版本解析与比较，配合 SDK 风格 csproj 的 `<Version>` 属性即可落地 SemVer；NuGet 包版本同样遵循 SemVer 子集。对上位机来说，版本规则统一后，"现场装的是哪个版本、能不能直接升"一眼可判。

> [!essentials] 核心要点
> - **三段含义**：`主版本`（不兼容变更）/ `次版本`（向后兼容的新功能）/ `修订号`（向后兼容的 bug 修复）
> - **比较规则**：按"主 → 次 → 修订"逐级比较，`Version.CompareTo` 内置该逻辑（示例已用）
> - **递增原则**：任何升级至少递增最右侧一位；主/次版本变更时右侧归零（`1.2.3` → `1.3.0`）
> - **预发布**：`-alpha`、`-beta` 等后缀按规范排序，正式版（无后缀）大于同版本预发布
> - **配置落地**：`.csproj` 的 `<Version>1.2.3</Version>` 同时驱动 Assembly/File 版本（默认一致，拆开见下一节）

> [!example] 完整示例
> **语义版本号比较工具：解析 主.次.修订 格式并逐级比较，结合 SemVer 规则给出升级类型提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="语义版本号（SemVer）工具" Height="400" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="语义版本号比较工具" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="版本 A（主.次.修订）" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBox x:Name="TxtVerA" Text="1.2.3" Margin="0,0,0,8" Padding="6"
>                          Background="#0D1117" Foreground="#58A6FF" BorderBrush="#21262D"/>
>                 <TextBlock Text="版本 B（主.次.修订）" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBox x:Name="TxtVerB" Text="1.3.0" Padding="6"
>                          Background="#0D1117" Foreground="#58A6FF" BorderBrush="#21262D"/>
>             </StackPanel>
>         </Border>
>         <Button Content="比较版本" Click="OnCompare" Padding="8" Margin="0,0,0,10"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="TxtResult" Foreground="#238636" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnCompare(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // 语义版本号格式：主版本.次版本.修订版本，缺失段按 0 处理
>                 Version a = ParseVersion(TxtVerA.Text);
>                 Version b = ParseVersion(TxtVerB.Text);
>                 int cmp = a.CompareTo(b);   // 内置比较：主版本优先，其次次版本，最后修订
>                 string relation = cmp < 0 ? "<" : (cmp > 0 ? ">" : "=");
>                 TxtResult.Text = "比较结果：" + a + " " + relation + " " + b;
>                 // 按 SemVer 规则提示升级类型
>                 if (a.Major != b.Major)
>                     TxtResult.Text += "\n提示：主版本号不同，属于不兼容的重大变更";
>                 else if (a.Minor != b.Minor)
>                     TxtResult.Text += "\n提示：次版本号不同，属于向后兼容的新功能更新";
>                 else if (a.Build != b.Build)
>                     TxtResult.Text += "\n提示：修订号不同，属于向后兼容的 bug 修复";
>                 else
>                     TxtResult.Text += "\n提示：两个版本完全一致";
>             }
>             catch (Exception ex)
>             {
>                 // 输入非法时给出友好提示，程序不崩溃
>                 TxtResult.Text = "版本号格式错误：" + ex.Message +
>                     "\n请按 主.次.修订 格式输入，如 2.1.0";
>             }
>         }
>
>         // 解析 主.次.修订；1 段 -> 主.0.0，2 段 -> 主.次.0
>         private static Version ParseVersion(string text)
>         {
>             string[] parts = text.Trim().Split('.');
>             return parts.Length switch
>             {
>                 1 => new Version(int.Parse(parts[0]), 0, 0),
>                 2 => new Version(int.Parse(parts[0]), int.Parse(parts[1]), 0),
>                 _ => Version.Parse(text.Trim())
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 版本号规划与沟通：给客户、现场工程师、团队成员定一套"一看就懂"的版本规则
> ✅ 升级前兼容性判断：判断 `1.2.3 → 1.3.0` 能不能直接升（次版本 = 新功能、可升；主版本 = 要评估）
> ✅ 更新系统比较版本：`clickonce-发布`、自研更新的"是否有新版"判断都基于版本比较
> ✅ 程序内版本展示/诊断：关于窗口、日志里打印版本，方便现场报障对版本
> ❌ 需要精确到构建号的频繁内部构建：内部构建用 `+build` 元数据或时间戳，不必每次都动主版本
> ❌ 团队没有发布纪律的场景：规则再好，没人执行也白搭，先建立发布流程再谈 SemVer

> [!pitfall] 常见踩坑
> 坑 1：**把版本号当字符串比** → 现象：`"1.10.0"` 被判断小于 `"1.2.0"`（字典序），或 `"1.2"` 与 `"1.2.0"` 不相等 → 原因：字符串比较是逐字符的 → 解决：一律用 `System.Version` 解析后用 `CompareTo`，不要手写字符串比较
>
> 坑 2：**段数不足/多余导致解析报错** → 现象：客户填 `1.2` 或 `1.2.3.4.5` 程序崩溃 → 原因：`Version.Parse` 只接受 2-4 段数字 → 解决：像示例 `ParseVersion` 那样先补零（`1.2` → `1.2.0`）或拦截非法输入
>
> 坑 3：**升级时主版本号乱跳** → 现象：一个 bug 修复把版本从 `1.2.3` 改成 `2.0.0`，客户不敢升级；或改了 API 却只升修订号 → 原因：没按 SemVer 规则递增 → 解决：制定规则并写进发布流程：修复升修订、新功能升次版本、破坏性变更升主版本，右侧归零

> [!best] 最佳实践
> - 在 `.csproj` 统一用 `<Version>1.2.3</Version>`，让 Assembly/File/NuGet 三处版本同源，不各自维护
> - 版本递增写进发布清单：提交记录/发布说明里标注"本次变更类型（修复/功能/破坏）→ 版本如何变"
> - 程序内展示版本用 `FileVersionInfo.ProductVersion`（见下一节），对齐"客户看到的版本"
> - 预发布阶段用 `-beta` 后缀，并让更新系统"默认不推送预发布"，正式版再放量
> - 版本比较逻辑集中封装：`VersionComparer` 工具类，更新模块、诊断模块共用，规则一处维护

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例程序，输入 `1.2.3` 与 `1.3.0` 比较，观察"次版本不同 = 新功能更新"的提示
> **Lv.2 小试牛刀**：输入 `1.2`、`1.2.0`、`01.2.3` 等边界格式，确认补零/报错行为符合预期
> **Lv.3 融会贯通**：给示例加"递增建议"：根据两个版本的差异自动给出"建议从 X 升到 Y"及原因
> **Lv.4 拆层挑战**：在 `.csproj` 里用 `<Version>` 配置示例项目版本，把"当前程序版本"显示到关于窗口；再实现一个"版本号规则自检"：校验当前版本是否符合 SemVer 三段式

> [!related] 相关知识链接
> - ← 前置知识：12 章 `增量更新与版本管理`（版本在更新流程中的角色）
> - → 后续必学：`assembly-version-vs-file-version`（AssemblyVersion/FileVersion 的区别与配置）
> - ⇄ 关联概念：`clickonce-发布`（发布版本与更新判断）、`msi-安装包wix-toolset`（MSI 三段式版本号）
> - 📖 官方文档：SemVer 规范（中文）：https://semver.org/lang/zh-CN/ ；.NET Version 类：https://learn.microsoft.com/zh-cn/dotnet/api/system.version
