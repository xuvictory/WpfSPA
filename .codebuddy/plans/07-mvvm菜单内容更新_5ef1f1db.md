---
name: 07-mvvm菜单内容更新
overview: 将 public/content/07-mvvm/ 下 28 篇文章的 [!example] 完整示例占位符替换为贴合上位机/工控场景的真实可运行 WPF 示例（XAML + C# 两段代码块），遵循既定模板规范，完成后提交 git。
todos:
  - id: mvvm-basics-examples
    content: 为 MVVM 基础概念 5 篇（什么是-mvvm、为什么要用-mvvm、mvvm-各层职责、mvvm-vs-mvc-vs-mvp-对比、项目结构与目录规划）替换示例占位符
    status: completed
  - id: binding-command-examples
    content: 为绑定与命令 5 篇（datacontext-绑定到-viewmodel、command-绑定、icommand-实现relaycommand-系列、inotifypropertychanged-实现、纯-xaml-展示）替换示例占位符
    status: completed
    dependencies:
      - mvvm-basics-examples
  - id: data-layer-examples
    content: 为数据层 4 篇（数据实体定义、dto-vs-entity、数据访问repository-模式、数据验证逻辑）替换示例占位符
    status: completed
    dependencies:
      - binding-command-examples
  - id: di-container-examples
    content: 为 DI 与容器 5 篇（什么是依赖注入、di-在-mvvm-中的应用、常用-di-容器、容器组成与生命周期、配置服务）替换示例占位符
    status: completed
    dependencies:
      - data-layer-examples
  - id: service-communication-examples
    content: 为服务与通信 4 篇（导航服务实现、对话框服务、日志服务集成、viewmodel-间的通信）替换示例占位符
    status: completed
    dependencies:
      - di-container-examples
  - id: framework-tool-examples
    content: 为框架与工具 5 篇（communitytoolkitmvvm推荐、mvvm-light-toolkit、prism-企业级框架、reactiveui-响应式框架、viewmodel-生命周期）替换示例占位符
    status: completed
    dependencies:
      - service-communication-examples
  - id: verify-and-commit
    content: 校验占位符残留为 0 且 git diff 仅动 07-mvvm，提交"7.MVVM设计模式菜单内容更新"
    status: completed
    dependencies:
      - mvvm-basics-examples
      - binding-command-examples
      - data-layer-examples
      - di-container-examples
      - service-communication-examples
      - framework-tool-examples
---

