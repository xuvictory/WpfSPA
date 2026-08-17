---
title: MatrixTransform 矩阵变换
section: 06-graphics
parent: 6.5 Transform 变换
---

# MatrixTransform 矩阵变换

> [!plain] 白话理解
> 前面学的缩放、旋转、平移，底层其实都是同一个东西——**变换矩阵**。MatrixTransform 就是"直接写矩阵"的变换：`M11`（水平缩放）、`M22`（垂直缩放）、`M12`/`M21`（斜切/旋转）、`OffsetX`/`OffsetY`（平移）。日常用专用变换更直观，但当你需要"一个矩阵同时表达缩放+旋转+平移"（如把屏幕坐标映射到设备坐标）时，MatrixTransform 就是那把万能钥匙。
>
> 类比：专用变换是"成品家具"（直接买），矩阵是"木料"（自由裁切）——大多数时候用成品，特殊尺寸才自己锯。

> [!def] 官方定义
> `System.Windows.Media.MatrixTransform` 用 `System.Windows.Media.Matrix` 结构定义 3×3 仿射矩阵（WPF 矩阵为 6 参数：`M11`、`M12`、`M21`、`M22`、`OffsetX`、`OffsetY`）。`Matrix.Identity` 是单位矩阵（不变换）。所有其他 Transform（旋转/缩放/平移/倾斜）最终都会被引擎表示为矩阵，`Transform.Value` 属性可读取对应的 `Matrix`。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.matrixtransform

> [!origin] 由来背景
> 图形学中一切 2D 仿射变换都可以统一为 3×3 矩阵乘法，WPF 的渲染管线正是基于矩阵变换实现。MatrixTransform 让开发者可以绕过专用变换的"语义层"直接操作矩阵：比如读取/写入 `Transform.Value` 做复合矩阵计算、把自定义矩阵（如工业视觉标定矩阵）直接应用到 UI。它是所有 Transform 的"底层真相"，理解了矩阵，其他变换就是它的语法糖。

> [!essentials] 核心要点
> - **六参数含义**：`M11`/`M22` 缩放、`M12`/`M21` 斜切与旋转、`OffsetX`/`OffsetY` 平移
> - **单位矩阵**：`Matrix.Identity`（1,0,0,1,0,0）表示不变换，用于复位
> - **矩阵乘法复合**：`m1 * m2` 表示先 m2 后 m1 的复合变换（注意顺序）
> - **只读 Value**：任何 Transform 都能通过 `.Value` 拿到等价的 Matrix
> - **适用边界**：组合复杂且固定时用矩阵；需要语义清晰的独立属性时用专用变换 + TransformGroup

> [!example] 完整示例
> **矩阵变换坐标演示：用 MatrixTransform 的 M11/M12/M21/M22/OffsetX/OffsetY 直接以矩阵方式表达缩放、旋转、平移，点击按钮切换变换矩阵：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="坐标矩阵 - MatrixTransform" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="坐标系变换（矩阵）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 用矩阵描述缩放(1.2,0.8)+旋转30°的组合效果 -->
>         <Grid Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Grid x:Name="MatrixBox" Width="130" Height="100" Background="#238636" Opacity="0.85"
>                   RenderTransformOrigin="0.5,0.5" HorizontalAlignment="Center" VerticalAlignment="Center">
>                 <Grid.RenderTransform>
>                     <MatrixTransform x:Name="Matrix1"/>
>                 </Grid.RenderTransform>
>                 <TextBlock Text="设备 A" Foreground="White" HorizontalAlignment="Center"
>                            VerticalAlignment="Center" FontSize="16"/>
>             </Grid>
>         </Grid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="切换矩阵" Click="OnSwitchMatrix" Padding="10" Background="#21262D"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <TextBlock Text="M11=…" Foreground="#8B949E" VerticalAlignment="Center"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private bool _scaled;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             ApplyMatrix();
>         }
>
>         // 单位矩阵（不变换） 与 缩放+平移矩阵 之间切换
>         private void OnSwitchMatrix(object sender, RoutedEventArgs e)
>         {
>             _scaled = !_scaled;
>             ApplyMatrix();
>         }
>
>         private void ApplyMatrix()
>         {
>             if (_scaled)
>             {
>                 // 水平放大 1.3、垂直缩小 0.8，再向右下平移
>                 Matrix1.Matrix = new Matrix(1.3, 0, 0, 0.8, 60, 30);
>             }
>             else
>             {
>                 Matrix1.Matrix = Matrix.Identity;
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 坐标映射：把屏幕坐标/设备坐标用矩阵映射到 UI 坐标系（视觉标定）
> ✅ 复合固定变换：一个矩阵同时表达"缩放+旋转+平移"，一次赋值
> ✅ 矩阵动画：从单位矩阵过渡到目标矩阵（配合 MatrixAnimation）
> ✅ 读取/检查：通过 `Transform.Value` 调试任意变换的矩阵表示
> ✅ 自定义相机变换：画面平移旋转缩放统一用一个矩阵管理
> ❌ 日常简单动画：rotatetransform-旋转 等专用变换更直观
> ❌ 多种变换独立控制：用 transformgroup-变换组合

> [!pitfall] 常见踩坑
> 坑 1：**矩阵参数含义记混** → 现象：M12/M21 填错，图形变成奇怪斜切 → 原因：`Matrix(m11, m12, m21, m22, offsetX, offsetY)` 的行列顺序与直觉不符 → 解决：记口诀"先缩放行（M11/M22），再斜切（M12/M21），最后平移（OffsetX/Y）"
> 
> 坑 2：**忘记用 Identity 复位** → 现象：切换矩阵后图形叠加了上次的变换 → 原因：直接在新矩阵基础上继续修改，而非整体赋值 → 解决：整体给 `Matrix1.Matrix = new Matrix(...)` 或 `Matrix.Identity`，不要逐字段拼
>
> 坑 3：**矩阵乘法顺序错误** → 现象：复合变换结果与预期相反 → 原因：`m1 * m2` 的语义是"先应用 m2 再应用 m1"，顺序写反 → 解决：写前明确"矩阵乘法 = 先右后左"的规则，或用 TransformGroup 避免手算

> [!best] 最佳实践
> - 日常开发用专用变换（语义清晰），需要"一个矩阵搞定一切"时才用 MatrixTransform
> - 复位固定写法 `Matrix1.Matrix = Matrix.Identity`，别手写 1,0,0,1,0,0
> - 视觉标定类矩阵单独封装成方法（如 `Matrix BuildCalibration(...)`），带注释说明每个参数
> - 需要调试矩阵效果时，用 `Transform.Value` 打印其他变换的矩阵做对照
> - 矩阵动画用 `MatrixAnimationUsingPath`/`MatrixAnimation`（见 6.10），勿手动逐帧累加

> [!practice] 上手练习
> **Lv.1 运行体验**：运行矩阵示例，点"切换矩阵"，观察绿色"设备 A"从原样变为放大+右下平移
> **Lv.2 动手改造**：把矩阵改成"水平镜像"（M11=-1, OffsetX 补偿居中），观察翻转效果
> **Lv.3 综合实战**：写一个方法返回"旋转 30° 的矩阵"（cos/sin 计算），点击按钮应用它
> **Lv.4 挑战进阶**：做"矩阵渐变"——用 Storyboard 的 MatrixAnimation 从单位矩阵动画到缩放矩阵，观察平滑过渡

> [!related] 相关知识链接
> - ← 前置知识：rotatetransform-旋转 等专用变换理解矩阵含义；transformgroup-变换组合 看复合顺序
> - → 后续必学：2d-绘图综合 综合运用；3d-图形入门 延伸三维矩阵
> - ⇄ 关联概念：rendertransform-vs-layouttransform 选应用路径；故事板动画 做矩阵过渡
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.matrixtransform
