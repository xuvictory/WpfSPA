---
name: 10-data-collection-示例填充
overview: 将 public/content/10-data-collection/ 下 21 篇文章的 [!example] 完整示例 占位符替换为真实可运行、贴合上位机/工控场景的 WPF 示例(XAML + C# 两段代码块),完成第 10 章"数据采集与处理"菜单代办事项。
todos:
  - id: fill-design-concepts
    content: 填充采集系统设计与策略类 5 篇示例（总体设计、采集策略、线程模型、存储策略、时序数据库）
    status: completed
  - id: fill-data-processing
    content: 填充数据处理核心类 5 篇示例（数据解析、CRC校验、工程值转换、过滤清洗、本地文件存储）
    status: completed
  - id: fill-database-export
    content: 填充数据库与导出类 5 篇示例（关系型数据库、sqlite、导出csv、导出excel、导出pdf）
    status: completed
  - id: fill-visualization
    content: 填充可视化监控类 6 篇示例（livecharts2、oxyplot、仪表盘、状态指示灯、报警系统、报表生成）
    status: completed
  - id: verify-all
    content: 校验：占位符计数为0、git diff 仅动 10-data-collection、无 + 前缀残留
    status: completed
    dependencies:
      - fill-design-concepts
      - fill-data-processing
      - fill-database-export
      - fill-visualization
---

