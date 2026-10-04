export type GeometryStageId = "point" | "line" | "plane" | "solid";

export type GeometryNode = {
  id: string;
  stageId: GeometryStageId;
  title: string;
  summary: string;
  example: string;
  takeaway: string;
  activity: string;
  prerequisites: string[];
  question: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  };
};

export const geometryStages: {
  id: GeometryStageId;
  label: string;
  subtitle: string;
  color: string;
  verb: string;
}[] = [
  {
    id: "point",
    label: "点",
    subtitle: "找到一个位置",
    color: "#6378df",
    verb: "找一找",
  },
  {
    id: "line",
    label: "线",
    subtitle: "连接两个位置",
    color: "#d38a30",
    verb: "连一连",
  },
  {
    id: "plane",
    label: "面",
    subtitle: "认识平面图形",
    color: "#278b78",
    verb: "拼一拼",
  },
  {
    id: "solid",
    label: "体",
    subtitle: "探索立体形状",
    color: "#9970c6",
    verb: "想一想",
  },
];

// Original spatial exploration lessons, separate from textbook course packages.
// Node order follows the prerequisite graph from positions to solid shapes.
export const geometryNodes: GeometryNode[] = [
  {
    id: "point-place",
    stageId: "point",
    title: "点在哪里",
    summary: "点用来表示一个位置。数学里的点没有大小，纸上的小圆点是帮我们看见位置的标记。",
    example: "在地图上点一下，就能标出学校的位置。这个标记不表示学校有多大。",
    takeaway: "点告诉我们“在哪里”。",
    activity: "在格子交叉的地方点一下，说说你选的位置。",
    prerequisites: [],
    question: {
      prompt: "地图上的一个点标出了学校。这个点主要告诉我们什么？",
      options: ["学校的位置", "学校有多大", "学校有多少学生"],
      answer: 0,
      explanation: "点用来标记位置。学校的大小和学生人数，需要另外的信息。",
    },
  },
  {
    id: "point-grid",
    stageId: "point",
    title: "格子里的位置",
    summary: "格子能帮我们把位置说清楚。先约定从哪边开始数，再一行一行、一列一列地找。",
    example: "从上往下数第 2 行，从左往右数第 3 列，两处相遇的地方就是要找的位置。",
    takeaway: "方向说清楚，位置才找得准。",
    activity: "选一个格点，先从上往下数行，再从左往右数列。",
    prerequisites: ["point-place"],
    question: {
      prompt: "找“从上往下第 2 行、从左往右第 3 列”时，应该怎样数？",
      options: ["行和列都从右边数", "行从上往下，列从左往右", "行和列都从下面数"],
      answer: 1,
      explanation: "题目已经约定方向：行从上往下数，列从左往右数。按同一个约定，大家就能找到同一位置。",
    },
  },
  {
    id: "point-corners",
    stageId: "point",
    title: "找到图形的顶点",
    summary: "三角形、正方形的边相接处叫顶点。顶点也是位置，可以用点标出来。",
    example: "沿着三角形的边走一圈，会经过 3 个顶点。每个顶点只数一次。",
    takeaway: "边相接的位置，可以用点来表示。",
    activity: "沿三角形的边找一圈，把每个顶点标出来。",
    prerequisites: ["point-grid"],
    question: {
      prompt: "把三角形的每个顶点都标上一个点，一共要标几个点？",
      options: ["1 个", "2 个", "3 个"],
      answer: 2,
      explanation: "三角形有 3 个顶点。每个顶点标一次，就是 3 个点。",
    },
  },
  {
    id: "line-connect",
    stageId: "line",
    title: "两点之间的线段",
    summary: "把两个不同的点直直地连起来，得到一条线段。这两个点就是线段的端点。",
    example: "用尺子把 A 点和 B 点连起来，画出的直直的一段就是线段。",
    takeaway: "线段是直的，有两个端点。",
    activity: "观察两个端点，再看看它们之间直直的连接。",
    prerequisites: ["point-corners"],
    question: {
      prompt: "一条线段有几个端点？",
      options: ["2 个", "3 个", "没有端点"],
      answer: 0,
      explanation: "线段从一个端点开始，到另一个端点结束，所以有 2 个端点。",
    },
  },
  {
    id: "line-paths",
    stageId: "line",
    title: "直着走，弯着走",
    summary: "连接相同的两个位置，可以走直路，也可以走弯路。在没有障碍的平面上，沿线段走最短。",
    example: "小蚂蚁从 A 到 B，直着走比绕一个弯再到 B 走的路短。",
    takeaway: "起点、终点相同，直直的线段最短。",
    activity: "比较直线段和弯曲路线。先确认它们的起点和终点相同。",
    prerequisites: ["line-connect"],
    question: {
      prompt: "在没有障碍的平地上，从 A 到 B，哪条路线最短？",
      options: ["先绕一个圈再到 B", "沿 A、B 之间的线段走", "弯着走很远再到 B"],
      answer: 1,
      explanation: "比较的是相同的起点和终点。两点之间，沿直直的线段走最短。弯曲路线不是一条线段。",
    },
  },
  {
    id: "line-closed",
    stageId: "line",
    title: "把边界围起来",
    summary: "沿着一条不交叉的路线走，最后回到起点，没有留下缺口，就围出了一块区域。",
    example: "三根小棒首尾相接，摆成三角形。小棒围成边界，边界里面是一块区域。",
    takeaway: "围住的边界和里面的区域，要分清。",
    activity: "沿图中的路线看一圈，找找有没有缺口，能不能回到起点。",
    prerequisites: ["line-paths"],
    question: {
      prompt: "怎样摆三根小棒，才能围出一个三角形？",
      options: ["摆成三条互不相接的线段", "首尾相接，但留一个缺口", "首尾相接，没有缺口"],
      answer: 2,
      explanation: "三根小棒首尾相接，没有缺口，才能围出三角形。小棒是边界，里面的部分是围出的区域。",
    },
  },
  {
    id: "plane-shapes",
    stageId: "plane",
    title: "认识平面图形",
    summary: "三角形、正方形、长方形和圆，都是平面图形。我们可以在平坦的纸面上画出它们。",
    example: "沿着杯口画一圈，可以得到圆的边界。圆里面的部分也是我们观察的区域。",
    takeaway: "平面图形没有厚度，纸片只是它的模型。",
    activity: "观察图形的边界，再看看边界里面的区域。",
    prerequisites: ["line-closed"],
    question: {
      prompt: "下面哪一个名称表示平面图形？",
      options: ["圆", "球", "正方体"],
      answer: 0,
      explanation: "圆是平面图形。球和正方体是立体图形，它们占有空间。",
    },
  },
  {
    id: "plane-sides",
    stageId: "plane",
    title: "数一数边和顶点",
    summary: "三角形有 3 条边、3 个顶点。正方形有 4 条一样长的边、4 个顶点。圆没有顶点。",
    example: "用手指沿正方形的边界走一圈，会经过 4 条边和 4 个顶点。",
    takeaway: "数边和顶点，能帮助我们认识图形。",
    activity: "观察正方形，从一个顶点出发，沿边界数一圈。",
    prerequisites: ["plane-shapes", "point-corners"],
    question: {
      prompt: "正方形有几条边、几个顶点？",
      options: ["3 条边、3 个顶点", "4 条边、4 个顶点", "4 条边、没有顶点"],
      answer: 1,
      explanation: "正方形有 4 条一样长的边，相邻的边相接，形成 4 个顶点。",
    },
  },
  {
    id: "plane-compose",
    stageId: "plane",
    title: "小图形拼大图形",
    summary: "把小图形移动、转一转，再把合适的边接起来，可以拼成新的图形。拼的时候留意空隙和重叠。",
    example: "把一个长方形沿对角线分成两块，得到两个三角形。沿分开的边接回去，又变成长方形。",
    takeaway: "图形可以分开，也可以重新组合。",
    activity: "观察两块三角形分开和合拢，找一找它们接在一起的边。",
    prerequisites: ["plane-sides"],
    question: {
      prompt: "两个一样大的正方形，沿一整条边紧挨着拼在一起，没有重叠，会拼成什么？",
      options: ["圆", "三角形", "长方形"],
      answer: 2,
      explanation: "两个一样大的正方形沿完整的一条边相接，外面的边界组成一个长方形。中间相接的边在里面。",
    },
  },
  {
    id: "solid-shapes",
    stageId: "solid",
    title: "从图形到立体",
    summary: "立体图形占有空间。积木、纸盒和皮球，能帮助我们想象正方体、长方体和球。",
    example: "一个方方正正的积木接近正方体，鞋盒接近长方体，皮球接近球。",
    takeaway: "平面图形没有厚度，立体图形占有空间。",
    activity: "观察方块，想象把它拿在手里。它和画在纸上的正方形有什么不同？",
    prerequisites: ["plane-compose"],
    question: {
      prompt: "一个鼓鼓的、圆滚滚的皮球，最接近哪一种立体形状？",
      options: ["球", "正方体", "长方体"],
      answer: 0,
      explanation: "皮球的立体形状接近球。画在纸上的圆是平面图形，和球不同。",
    },
  },
  {
    id: "solid-faces",
    stageId: "solid",
    title: "找找立体的表面",
    summary: "正方体有 6 个平平的面，每个面都是正方形。球的表面是弯曲的曲面，不能当作一个平面。",
    example: "摸摸方块的一个面，再摸摸皮球。一个平平的，一个弯弯的。",
    takeaway: "物体的表面，有的平，有的弯。",
    activity: "看看正方体露出的面，也想一想被挡住的面。数面时，每个面只数一次。",
    prerequisites: ["solid-shapes", "plane-shapes"],
    question: {
      prompt: "一个正方体一共有几个面？",
      options: ["3 个", "6 个", "8 个"],
      answer: 1,
      explanation: "正方体有上、下、前、后、左、右 6 个面。图上被挡住、看不见的面也要算。",
    },
  },
  {
    id: "solid-nets",
    stageId: "solid",
    title: "展开，再折起来",
    summary: "把正方体纸盒沿一些棱剪开、铺平，会得到展开图。6 个正方形要排在合适的位置，才能折回正方体。",
    example: "中间竖着排 4 个正方形，在从上往下第 2 个的左右各接 1 个。这个十字展开图能折成正方体。",
    takeaway: "展开图连接着平面图形和立体图形。",
    activity: "切换展开和合拢，追踪同一个颜色的面去了哪里。",
    prerequisites: ["solid-faces", "plane-compose"],
    question: {
      prompt: "6 个一样大的正方形随便连在一起，就一定能折成正方体吗？",
      options: ["一定可以", "涂成同一种颜色就可以", "不一定，要看排列方式"],
      answer: 2,
      explanation: "只有合适的排列才能折成正方体。有的排列折起来会重叠，或不能把 6 个面围好。",
    },
  },
];
