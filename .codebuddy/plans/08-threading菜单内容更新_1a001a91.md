---
name: 08-threading菜单内容更新
overview: 将 public/content/08-threading/ 下 21 篇文章的 [!example] 完整示例占位符替换为真实可运行、贴合上位机/工控场景的 WPF 示例（XAML + C# 两段代码块），其余 Callout 及结构不动。
todos:
  - id: replace-thread-basics
    content: 替换线程基础 5 篇示例：主线程与后台线程、线程池vs专用线程、sta单线程单元、为什么不能跨线程访问控件、检查是否需要调度
    status: completed
  - id: replace-task-async
    content: 替换 Task 异步 4 篇示例：taskrun与taskdelay、async与await详解、取消异步操作、并行任务whenallwhenany
    status: completed
  - id: replace-dispatcher
    content: 替换 Dispatcher 与 UI 更新 5 篇示例：dispatcherinvoke与begininvoke、dispatcherpriority优先级、dispatchertimer、从UI线程安全更新控件、backgroundworker使用与对比
    status: completed
  - id: replace-sync-primitives
    content: 替换同步原语 5 篇示例：lock与monitor、semaphore信号量、mutex跨进程互斥、死锁的成因与避免、并发集合
    status: completed
  - id: replace-patterns
    content: 替换实战模式 2 篇示例：生产者消费者模式、定时数据采集模式
    status: completed
  - id: verify-commit
    content: 用 [subagent:code-explorer] 校验占位符清零且仅动 08-threading，通过后 git 提交"8.线程与异步菜单内容更新"
    status: completed
    dependencies:
      - replace-thread-basics
      - replace-task-async
      - replace-dispatcher
      - replace-sync-primitives
      - replace-patterns
---

## 产品概述

完成"8.线程与异步"章节的代办事项：将 public/content/08-threading/ 下 21 篇文章中 `[!example] 完整示例` 卡片内的占位符（"// 📝 待补充实际示例代码"）全部替换为真实可运行、贴合上位机/工控场景的 WPF 示例（XAML + C# 双代码块）。

## 核心功能

- 覆盖 21 篇文章，每篇 1 个完整示例：并发集合、并行任务whenallwhenany、从UI线程安全更新控件、定时数据采集模式、检查是否需要调度、取消异步操作、生产者消费者模式、死锁的成因与避免、为什么不能跨线程访问控件、线程池vs专用线程、主线程与后台线程、async与await详解、backgroundworker使用与对比、dispatcherinvoke与begininvoke、dispatcherpriority优先级、dispatchertimer、lock与monitor、mutex跨进程互斥、semaphore信号量、sta单线程单元、taskrun与taskdelay
- 示例贴合上位机/工控场景（设备控制、数据采集、线程调度、UI 更新等），概念性文章也提供最小可运行演示
- 严格遵循模板规范：命名空间 HmiDemo、类 MainWindow、深色配色（#0D1117/#161B22/#21262D/#58A6FF/#8B949E/#238636/#DA3633）、中文注释、XAML 事件与 x:Name 和 C# 严格对应
- 只修改 `[!example]` 卡片，其余 9 个 Callout 及 meta.json、src/、styles/、index.html 一律不动

## 技术栈

- 纯 Markdown 内容更新任务，不修改项目任何代码文件
- 示例代码为 WPF（C# + XAML），格式参照已完成的 public/content/04-controls/button-按钮.md

## 替换模板（每篇统一格式）

```
> [!example] 完整示例
> **{贴合本节知识点的场景演示标题}：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow" ... Background="#0D1117">
>   ...（面板 #161B22、按钮 #21262D、强调蓝 #58A6FF、文本 #8B949E、成功 #238636、危险 #DA3633）
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using ...;
> namespace HmiDemo { public partial class MainWindow : Window { ... } }
> ```
```

## 实施要点

- 每篇文章的示例必须紧扣标题知识点（如 lock 文章演示多线程竞态与加锁、dispatchertimer 演示定时刷新 UI），并保持上位机/工控语境
- 已知坑：PowerShell 中文路径乱码需 chcp 65001；替换内容避免混入 `+` 前缀；StackPanel 内位移用 TranslateTransform 而非 Canvas.Left
- 校验标准：search_content 查"待补充实际示例代码"计数为 0；git diff --stat 确认仅动 08-threading 目录；无 `^\+` 前缀残留
- 提交信息："8.线程与异步菜单内容更新"

## Agent Extensions

### SubAgent

- **code-explorer**
- 用途：最终校验阶段跨文件搜索"待补充实际示例代码"残留、确认 git diff 仅涉及 08-threading 目录、检查替换内容是否混入 `+` 前缀
- 预期结果：校验通过后才执行 git 提交，保证本次改动范围与完整性符合验收标准