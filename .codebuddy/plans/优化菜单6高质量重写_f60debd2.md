---
name: 优化菜单6高质量重写
overview: 按第8节高质量写作规范，重写 06-graphics 章全部 43 篇文章的 9 个 Callout 段落（plain/def/origin/essentials/scene/pitfall/best/practice/related），保留已有完整示例，使每篇文章成为贴合上位机/工控场景的深度内容。
todos:
  - id: rewrite-61-62
    content: 按第8节规范重写6.1-6.2共8篇的9个Callout段落
    status: completed
  - id: rewrite-63-64
    content: 按第8节规范重写6.3-6.4共10篇的9个Callout段落
    status: completed
    dependencies:
      - rewrite-61-62
  - id: rewrite-65-66
    content: 按第8节规范重写6.5-6.6共10篇的9个Callout段落
    status: completed
    dependencies:
      - rewrite-63-64
  - id: rewrite-67-68
    content: 按第8节规范重写6.7-6.8共7篇的9个Callout段落
    status: completed
    dependencies:
      - rewrite-65-66
  - id: rewrite-69-610
    content: 按第8节规范重写6.9-6.10共8篇的9个Callout段落
    status: completed
    dependencies:
      - rewrite-67-68
  - id: verify-chapter6
    content: 校验全章：废话词清零、diff仅限06-graphics、抽查示例对应
    status: completed
    dependencies:
      - rewrite-69-610
  - id: commit-chapter6
    content: 用UTF-8消息文件提交06-graphics改动并删除_msg.txt
    status: completed
    dependencies:
      - verify-chapter6
---

## 产品概述

将第 6 章"图形与多媒体"（`public/content/06-graphics/`）的 43 篇课程文章整体升级为高质量内容：以第 7 章确立、全站推广的高质量写作规范为标杆，把每篇中 9 个"废话模板"段落（白话理解、官方定义、由来背景、核心要点、适用场景、常见踩坑、最佳实践、上手练习、相关知识链接）逐段重写为贴合该知识点、面向 WPF 上位机/工控开发场景的真实内容；已完成的"完整示例"段落保留并复核。

## 核心功能

- 覆盖 6.1 图形渲染概述、6.2 Shape、6.3 Path 与 Geometry、6.4 Brush、6.5 Transform、6.6 Effect、6.7 图像处理、6.8 音频视频、6.9 2D/3D、6.10 动画共 10 个子章节 43 篇
- 白话理解：用上位机/工控场景的类比讲透概念本质，不复读标题
- 官方定义：真实准确，区分控件/概念/框架，给出全限定 API 归属与微软官方文档具体页链接
- 由来背景：真实历史与设计动机（如 WPF 2006 年随 .NET Framework 3.0 发布、保留模式渲染等）
- 核心要点：该主题真正相关的属性/API/机制清单，各篇不雷同
- 适用场景：按主题写具体适用与不适用场景，各篇不得重复套话
- 常见踩坑：每条按"现象→原因→解决/预防"三段式写真实坑
- 最佳实践：主题相关、可落地的实践建议
- 上手练习：Lv.1-Lv.4 分级练习与主题挂钩
- 相关知识链接：站内真实互链（06 章内用文件名，跨章用「第 N 章·文章名」）+ learn.microsoft.com 具体页面
- 清理由来背景后残留的游离段落（如"本章节背景：…"）

## 技术方案

本任务为纯 Markdown 内容重写，不涉及代码、`meta.json`、`quizzes.json` 的改动。

### 实现方法

- 以 `public/content/07-mvvm/什么是-mvvm.md` 为高质量标杆、`public/content/06-graphics/wpf-图形渲染概述.md` 为示例结构参照
- 逐篇流程：read_file 读原文 → 重写 9 个 Callout 段落（保留 `[!example]` 完整示例，仅按规范复核）→ 删除 `[!origin]` 后游离段落
- 执行纪律：同文件必须串行编辑（改完一篇读一篇再改下一篇），避免并行写锁冲突；每批写完后立即搜索 `^\+` 检查格式污染
- 命名规范沿用 HmiDemo 工控暗色主题；`[!related]` 链接必须真实指向站内文件与官方文档

### 校验方法

- search_content 统计 `06-graphics` 中废话模板关键词"是 WPF 上位机开发中的一项重要知识"、"微软官方定义和实现"、"Lv.1 照猫画虎"、"请确保你已经理解了本章节之前的内容"计数均为 0
- `git diff --stat` 确认改动仅限 `public/content/06-graphics/`
- 抽查 2-3 篇的 XAML 事件/x:Name 与 C# 后台代码对应关系

### 提交规范

- `git add public/content/06-graphics/` 后，先写 UTF-8 消息文件 `_msg.txt`，再 `git commit -F _msg.txt`，提交后删除 `_msg.txt`；禁止 `git commit -m "中文"`（会存成 GBK）

## 目录结构

```
public/content/06-graphics/
├── wpf-图形渲染概述.md            # [MODIFY] 6.1 渲染概述
├── line-直线.md … path-路径.md    # [MODIFY] 6.2 Shape 共 7 篇
├── geometry-类型.md … 上位机应用场景.md  # [MODIFY] 6.3 共 3 篇
├── solidcolorbrush-纯色画刷.md … 上位机画刷应用.md  # [MODIFY] 6.4 共 7 篇
├── rotatetransform-旋转.md … rendertransform-vs-layouttransform.md  # [MODIFY] 6.5 共 7 篇
├── blureffect-模糊.md … 性能注意事项.md      # [MODIFY] 6.6 共 3 篇
├── image-控件.md … rendertargetbitmap-渲染到位图.md  # [MODIFY] 6.7 共 4 篇
├── mediaelement-媒体播放.md … 上位机音频场景.md  # [MODIFY] 6.8 共 3 篇
├── 2d-绘图综合.md、3d-图形入门.md   # [MODIFY] 6.9 共 2 篇
└── 动画基础概念.md … 动画在上位机的应用.md  # [MODIFY] 6.10 共 6 篇
```