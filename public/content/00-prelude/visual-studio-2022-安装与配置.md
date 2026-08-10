---
title: Visual Studio 2022 安装与配置
---

# Visual Studio 2022 安装与配置

> [!plain] 白话理解
> Visual Studio 就是你的"编程工具箱"。写 WPF 上位机，你需要一个能写代码、拖拽界面、调试程序的完整工具，VS 就是微软官方出品的这个全能工具箱。装好它，你才能开始写 C# 和 XAML。

> [!def] 官方定义
> Visual Studio 2022 是微软推出的集成开发环境（IDE），支持 .NET 6/7/8/9 等框架。它提供了代码编辑器、XAML 设计器、调试器、性能分析器、NuGet 包管理器等一整套开发工具，是 WPF 开发的首选 IDE。

> [!origin] 由来背景
> Visual Studio 最早可追溯到 1997 年的 Visual Studio 97，最初主要为 Visual Basic 和 Visual C++ 服务。随着 .NET 和 WPF 的推出，VS 逐步发展为微软生态的核心开发工具。2022 版首次从 32 位迁移到 64 位，大幅提升了大型项目（如工业级上位机）的性能表现。

> [!essentials] 核心要点
> - 推荐版本：Visual Studio 2022 Community（免费）
> - 必须勾选的工作负载：**.NET 桌面开发**
> - 包含组件：.NET SDK、C# 编译器、XAML 设计器、调试器
> - 可选组件：Git for Windows、GitHub Extension
> - 安装路径建议使用默认路径（C 盘），不要随便改

> [!example] 完整示例
> ```bash
> # 安装步骤：
> 1. 访问 https://visualstudio.microsoft.com/zh-hans/downloads/
> 2. 下载 Visual Studio 2022 Community 版
> 3. 运行安装程序，在"工作负载"标签页
> 4. 勾选 ".NET 桌面开发"
> 5. 在右侧"安装详细信息"中确认包含：
>    - .NET Framework 4.8 开发工具
>    - .NET 9.0 开发工具
>    - C# 和 Visual Basic
>    - Blend for Visual Studio
> 6. 点击安装，等待完成（约 20-30 分钟）
> 7. 安装完成后，启动 VS 2022，登录微软账号（可选）
> ```

> [!scene] 适用场景
> ✅ 所有 WPF/WinForms/.NET 项目开发
> ✅ 工业上位机软件开发的唯一官方推荐 IDE
> ✅ 个人学习、企业商用均可（Community 版完全免费且功能完整）
> ❌ 如果你用 Mac 或纯 Linux —— VS 2022 for Mac 已停止维护，建议用 Rider 替代

> [!pitfall] 常见踩坑
> 坑 1：**安装时只勾了"开发"没勾具体工作负载** → 创建项目时找不到 WPF 模板。解决方法：打开 Visual Studio Installer → 修改 → 勾选 ".NET 桌面开发"
> 
> 坑 2：**VS 2022 打不开旧版 .NET Framework 项目** → 需在 Installer 中额外安装 .NET Framework 4.6/4.7/4.8 目标包
>
> 坑 3：**安装路径改到 D 盘导致某些组件找不到** → 建议 C 盘空间够的话保持默认路径

> [!best] 最佳实践
> - 安装完成后立即去 **扩展 → 管理扩展** 安装 XAML Styler（自动格式化 XAML 代码）
> - 开启 **编辑 → 高级 → 自动换行** 以适应长行代码
> - 在 **工具 → 选项 → 环境 → 字体和颜色** 中推荐使用 Cascadia Code 字体（更适合代码阅读）
> - 启用 **热重载**（调试时修改 XAML 无需重启）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：按上方步骤安装 VS 2022，确认能启动到主界面
> **Lv.2 小试牛刀**：在扩展市场搜索并安装 "XAML Styler"，配置代码保存时自动格式化
> **Lv.3 融会贯通**：更改 VS 主题为深色模式，将代码字体改为 Cascadia Code，调整到自己舒适的配色

> [!related] 相关知识链接
> - → 后续必学：.NET SDK 安装（有了 VS 不等于有了最新 SDK）
> - → 后续必学：创建第一个 WPF 项目
> - ⇄ 关联概念：NuGet 包管理器（VS 内置的依赖管理工具）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/visualstudio/install/install-visual-studio
