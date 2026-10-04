export type MathActivityKind =
  | "count" | "compare" | "compose" | "add" | "subtract" | "groups"
  | "share" | "measure" | "fraction" | "pattern" | "data" | "shape"
  | "area" | "volume" | "decimal" | "ratio";

export type MathLesson = {
  id: string;
  title: string;
  domainId: string;
  stageId: string;
  prerequisites: string[];
  goal: string;
  why: string;
  story: { title: string; text: string };
  activity: { kind: MathActivityKind; instruction: string; values: number[]; labels?: string[] };
  explanation: string[];
  takeaway: string;
  checks: { id: string; prompt: string; options: string[]; answer: number; explanation: string }[];
};

export const mathDomains = [
  { id: "number", title: "数与运算", description: "从数一数，走向运算和数量关系。", color: "#5476c8" },
  { id: "space", title: "图形与测量", description: "认形状、定单位，认识长度、面积与体积。", color: "#35947c" },
  { id: "data", title: "数据与规律", description: "有顺序地观察，用记录发现规律和差别。", color: "#b17a2b" },
  { id: "problem", title: "解决问题", description: "把已知与问题连起来，说清做法并检查。", color: "#9570b8" },
];

export const mathStages = [
  { id: "notice", title: "发现数量和形状", subtitle: "先看见、数清，再比较。" },
  { id: "represent", title: "学会表示与比较", subtitle: "把观察到的东西说清楚。" },
  { id: "operate", title: "理解加减与单位", subtitle: "认识数量怎样变化。" },
  { id: "relate", title: "认识分组和关系", subtitle: "从一个一个数，到一组一组想。" },
  { id: "extend", title: "认识部分与空间", subtitle: "不满一个怎样说？铺一面、搭一层怎样量？" },
  { id: "apply", title: "综合应用与推理", subtitle: "连接学过的知识，解决新问题。" },
];

type LessonDraft = Omit<MathLesson, "checks"> & {
  checks: [Omit<MathLesson["checks"][number], "id">, Omit<MathLesson["checks"][number], "id">];
};

function lesson(draft: LessonDraft): MathLesson {
  return {
    ...draft,
    checks: draft.checks.map((check, index) => ({
      ...check,
      id: `${draft.id}-${index === 0 ? "understand" : "transfer"}`,
    })),
  };
}

// Original introductory lessons, not a complete textbook or a mastery assessment.
// Ordered as a prerequisite DAG: each dependency appears before the lesson using it.
// Fractions use [numerator, denominator]; measurements on screen are schematic.
export const mathLessons: MathLesson[] = [
  lesson({
    id: "count", title: "一个一个，数清有多少", domainId: "number", stageId: "notice", prerequisites: [],
    goal: "每个物品只数一次，知道最后一个数表示一共有多少。",
    why: "先数清楚，才能比较多少；以后合起来、拿走一些，都要用到数量。",
    story: { title: "给小熊数饼干", text: "盘子里有几块饼干？一边指一边数，数过的就不再数。最后说出的数，告诉小熊一共有多少块。" },
    activity: { kind: "count", instruction: "每次点一个圆片，不漏数，也不重复。最后一共点了几个？", values: [5] },
    explanation: ["指一个物品，说一个数：1、2、3……", "数到最后的 5，表示这盘一共有 5 块，不只是最后那一块的名字。", "只改变摆放位置，没有添上或拿走，数量就没有变。"],
    takeaway: "一件物品对应一个数，最后一个数表示总数。",
    checks: [
      { prompt: "数饼干时，哪种办法最不容易出错？", options: ["只看盘子有多大", "喜欢哪块就多点几次", "每块只点一次，按顺序数"], answer: 2, explanation: "每块只数一次，既不漏掉，也不重复，才能知道总数。" },
      { prompt: "5 个积木摆成一排，再围成一圈，没有增减。现在有几个？", options: ["6 个", "4 个", "5 个"], answer: 2, explanation: "摆法变了，但没有增添或拿走积木，仍然是 5 个。" },
    ],
  }),
  lesson({
    id: "match", title: "一个配一个，比多少", domainId: "number", stageId: "notice", prerequisites: ["count"],
    goal: "用一一配对发现一样多、多一些或少一些。",
    why: "数数告诉我们各有多少，配对帮助我们看清谁多；这会变成以后求相差多少的办法。",
    story: { title: "每只兔子一根胡萝卜", text: "4 只兔子来吃饭，桌上有 6 根胡萝卜。先给每只兔子配一根，看看有没有剩下的。" },
    activity: { kind: "compare", instruction: "把左边 4 个和右边 6 个一个配一个，想一想哪边有剩余。", values: [4, 6], labels: ["兔子", "胡萝卜"] },
    explanation: ["一只兔子配一根胡萝卜，就是一个配一个。", "两边正好配完，叫一样多；哪边还有剩余，哪边就多。", "4 只兔子都配到了胡萝卜，还剩 2 根，所以胡萝卜更多。"],
    takeaway: "一个配一个，看哪边剩下，就能比较多少。",
    checks: [
      { prompt: "杯子和吸管一个配一个，最后都没有剩余，说明什么？", options: ["吸管更多", "杯子和吸管一样多", "杯子一定更大"], answer: 1, explanation: "正好一一配完，说明它们的数量一样多，与大小无关。" },
      { prompt: "3 位小朋友，每人拿 1 顶帽子，还剩 2 顶。谁的数量多？", options: ["小朋友多", "一样多", "帽子多"], answer: 2, explanation: "每人配一顶后帽子还有剩余，所以帽子更多。" },
    ],
  }),
  lesson({
    id: "compare", title: "把多少写成大小", domainId: "number", stageId: "notice", prerequisites: ["match"],
    goal: "把数量比较和 >、<、= 连起来。",
    why: "配对看出了多少，现在用符号把关系记下来；以后比较长度、钱数和结果也能这样表达。",
    story: { title: "两篮苹果", text: "一篮有 4 个苹果，另一篮有 6 个。配一配能看出 4 个更少，我们还可以写成 4 < 6。" },
    activity: { kind: "compare", instruction: "比较两边的数量，试着读出“4 小于 6”和“6 大于 4”。", values: [4, 6] },
    explanation: ["4 < 6 读作 4 小于 6；6 > 4 读作 6 大于 4。", "符号开口朝向较大的数，尖端朝向较小的数。", "两边数量相同，用 =；它表示两边的数量相等。"],
    takeaway: "比较符号是在记录两边的数量关系。",
    checks: [
      { prompt: "左边有 3 个，右边有 5 个，应该怎样写？", options: ["3 > 5", "3 < 5", "3 = 5"], answer: 1, explanation: "3 个比 5 个少，所以 3 小于 5，写成 3 < 5。" },
      { prompt: "红队和蓝队各得 7 颗星，哪个写法合适？", options: ["7 > 7", "7 < 7", "7 = 7"], answer: 2, explanation: "两队星星一样多，所以用等号连接。" },
    ],
  }),
  lesson({
    id: "zero", title: "一个也没有，用 0 表示", domainId: "number", stageId: "notice", prerequisites: ["count", "compare"],
    goal: "知道 0 可以表示一个也没有，而且 0 也是数。",
    why: "数数通常从 1 开始，但拿光以后也需要表示；认识 0，才能完整记录数量的变化。",
    story: { title: "空空的盘子", text: "盘子里的饼干全吃完了。问“还剩几块”时，可以回答 0 块。盘子还在，饼干的数量是 0。" },
    activity: { kind: "count", instruction: "看看这里有没有圆片。一个也没有时，该用哪个数记录？", values: [0] },
    explanation: ["没有要数的物品，就用 0 表示这个数量。", "0 比 1 小；从 0 添上 1 个，数量就变成 1。", "0 在不同地方也有不同用途，例如尺子上的 0 可以标记测量的起点。"],
    takeaway: "一个也没有，也能用数说清楚：0。",
    checks: [
      { prompt: "盒子里没有铅笔，铅笔的数量是多少？", options: ["0", "不能表示", "1"], answer: 0, explanation: "一个铅笔也没有，数量就是 0。" },
      { prompt: "空篮子里放入 1 个橘子，数量怎样变化？", options: ["从 1 变成 0", "从 0 变成 1", "还是 0"], answer: 1, explanation: "原来一个也没有是 0，放进一个后就有 1 个。" },
    ],
  }),
  lesson({
    id: "shape", title: "形状有什么不同", domainId: "space", stageId: "notice", prerequisites: ["count"],
    goal: "观察边和顶点，初步区分圆、三角形与正方形。",
    why: "会数以后，可以数图形的边和顶点；认清图形，才能接着研究边界有多长、里面有多大。",
    story: { title: "寻找三角形路牌", text: "把三角形路牌转一转，它还是三角形。判断形状，要看它的边怎样围起来，不能只看它朝哪个方向。" },
    activity: { kind: "shape", instruction: "沿三角形看一圈，找出 3 条直边和边相接的 3 个顶点。", values: [3] },
    explanation: ["三角形由 3 条线段首尾相接围成，有 3 个顶点。", "圆的边界是弯的，没有三角形那样的顶点。", "正方形有 4 条一样长的边，4 个角都像课本的角那样方正；只有四条边，还不一定是正方形。"],
    takeaway: "看边和角的特点来认图形，转个方向不会改变形状。",
    checks: [
      { prompt: "一个三角形转了个方向，它的直边有几条？", options: ["1 条", "4 条", "3 条"], answer: 2, explanation: "方向变了，三角形的 3 条直边并没有变。" },
      { prompt: "一个图形有 4 条边，它一定是正方形吗？", options: ["一定是", "不一定，还要看边长和角", "只要涂绿色就是"], answer: 1, explanation: "长方形也有 4 条边。正方形还需要四边一样长、四个角都是直角。" },
    ],
  }),
  lesson({
    id: "compose", title: "一个数，可以分成两部分", domainId: "number", stageId: "represent", prerequisites: ["count", "zero"],
    goal: "发现部分变了，总数可以不变。",
    why: "先知道整体怎样分成部分，才容易理解加法是合起来、减法是在找剩下的部分。",
    story: { title: "给两只小熊分积木", text: "7 个积木放进两个篮子。一个篮子放 3 个，另一个放 4 个；换一种分法，积木总数还是 7。" },
    activity: { kind: "compose", instruction: "把 7 个圆片分到两边，换几种分法。观察两边合起来是否始终是 7。", values: [7, 3] },
    explanation: ["7 可以分成 3 和 4，也可以分成 2 和 5。", "一边多拿 1 个，另一边就少 1 个，合起来仍然是 7。", "一边是 0 个时，另一边就是全部 7 个。"],
    takeaway: "整体等于各部分合起来，移动位置不会改变总数。",
    checks: [
      { prompt: "7 个圆片，一边放 2 个，另一边应有几个？", options: ["5 个", "7 个", "2 个"], answer: 0, explanation: "7 由 2 和 5 组成，两个部分合起来才是全部 7 个。" },
      { prompt: "6 颗糖从左盒移 1 颗到右盒，没有拿进拿出。两盒一共有几颗？", options: ["5 颗", "6 颗", "7 颗"], answer: 1, explanation: "只是改变两部分的分配，总数还是 6。" },
    ],
  }),
  lesson({
    id: "ten", title: "十个一，组成一个十", domainId: "number", stageId: "represent", prerequisites: ["count", "compose"],
    goal: "把 10 个一看成一个新单位：十。",
    why: "一个一个数适合小数量；把十个装一包，就能更快表示更大的数，并理解数位。",
    story: { title: "把小棒扎成一捆", text: "数出 10 根小棒，扎成一捆。现在可以说“10 根”，也可以说“1 捆十根”，小棒并没有变少。" },
    activity: { kind: "count", instruction: "数满 10 个圆片，再点“把 10 个一合成 1 个十”，看看十个一怎样成为一组。", values: [10] },
    explanation: ["一个十和十个一表示同样的数量。", "把十个一组合起来，是换一种计数单位。", "12 可以想成 1 个十和 2 个一，为写出两位数做准备。"],
    takeaway: "10 个一 = 1 个十，换单位以后更容易数。",
    checks: [
      { prompt: "1 捆有 10 根小棒，拆开后有多少根？", options: ["10 根", "9 根", "1 根"], answer: 0, explanation: "扎捆或拆开只改变包装，1 个十就是 10 个一。" },
      { prompt: "1 捆十根，再加 3 根散棒，一共有多少根？", options: ["4 根", "13 根", "31 根"], answer: 1, explanation: "一捆表示 10 根，10 根和 3 根合起来是 13 根。" },
    ],
  }),
  lesson({
    id: "order", title: "数可以排成有顺序的队伍", domainId: "number", stageId: "represent", prerequisites: ["compare", "zero", "ten"],
    goal: "按照从小到大的顺序，找到一个数的前面和后面。",
    why: "比较两数后，把许多数排起来，就能看见每次加 1 的变化；这会帮助我们理解加减。",
    story: { title: "台阶上的号码", text: "台阶写着 0、1、2、3……每向上一个台阶，号码增加 1。7 后面是 8，再后面是 9。" },
    activity: { kind: "compare", instruction: "比较 7 和 9。想象按顺序从 7 数到 9，中间还经过哪个数？", values: [7, 9] },
    explanation: ["按 0、1、2、3……排列，每后一个数都比前一个多 1。", "7、8、9 中，8 在 7 后面、9 前面。", "顺着数像在添上，倒着数像在拿走。"],
    takeaway: "数的顺序里藏着每次多 1 或少 1 的关系。",
    checks: [
      { prompt: "按从小到大排列，7 后面紧接着是几？", options: ["6", "9", "8"], answer: 2, explanation: "从 7 再多 1，就是紧接着的 8。" },
      { prompt: "从 5 开始倒着数两步：4、3。最后到几？", options: ["3", "4", "7"], answer: 0, explanation: "倒着数一步少 1，两步从 5 到 3。" },
    ],
  }),
  lesson({
    id: "measure-unit", title: "用同样大小的一份来量", domainId: "space", stageId: "represent", prerequisites: ["count", "compare", "shape"],
    goal: "明白测量要用相同单位，首尾相接而不重叠。",
    why: "数数能回答有几个，把相同的小单位沿着物体排好，就能把长度也变成一个数。",
    story: { title: "积木小路有多长", text: "拿一样长的小积木沿小路排，每块紧接着前一块。排了 6 块，我们说小路有 6 个这样的单位长。" },
    activity: { kind: "measure", instruction: "观察示意尺上 6 个相同的小段。每段相接、不留空隙；图上的尺寸不是屏幕实际厘米。", values: [6] },
    explanation: ["先选定一小段作单位，再数这种单位用了几次。", "每个单位必须一样长，摆放不能有空隙或重叠。", "如果有人用长积木，有人用短积木，测出的数字可能不同；要比较就要统一单位。"],
    takeaway: "测量 = 统一单位，再数用了多少份。",
    checks: [
      { prompt: "用积木量书本长度，怎样摆才合适？", options: ["大积木小积木随意混用", "每块之间留一个空隙", "相同积木首尾相接，不留空隙"], answer: 2, explanation: "单位相同且不重叠、不留空隙，数出来才表示完整的长度。" },
      { prompt: "同一条绳子，用更短的同样大小小棒来量，需要的小棒通常怎样变？", options: ["更多", "更少", "一定一样多"], answer: 0, explanation: "绳子长度不变，每根小棒更短，就要更多根才能排满。" },
    ],
  }),
  lesson({
    id: "pattern", title: "找出不断重复的一小组", domainId: "data", stageId: "represent", prerequisites: ["count", "order"],
    goal: "找出重复单元，并根据它继续排列。",
    why: "会按顺序观察后，才能发现哪些顺序不断重来；重复的一组，也会帮助我们认识等量分组。",
    story: { title: "给花园排花砖", text: "花砖按红、蓝、红、蓝……排列。“红、蓝”这一小组反复出现，知道这一组，就知道接下来怎么排。" },
    activity: { kind: "pattern", instruction: "先找到反复出现的一小组，再猜下一项并补上。", values: [2], labels: ["红", "蓝"] },
    explanation: ["只看最后一个不够，要观察前面的排列是否重复。", "红、蓝是一组，每组都按同样顺序出现。", "规律不是随意猜一种颜色，要能用它解释已经出现的每一组。"],
    takeaway: "先找到重复的单元，再用它解释和预测。",
    checks: [
      { prompt: "红、蓝、红、蓝、红，接下来应是什么？", options: ["黄", "蓝", "红"], answer: 1, explanation: "每组都是红、蓝。最后一组已有红，接下来应接蓝。" },
      { prompt: "圆、圆、星，圆、圆、星……重复的一组是什么？", options: ["圆、星", "圆、圆、星", "星、星"], answer: 1, explanation: "每次都是两个圆后面接一个星，这三个组成重复单元。" },
    ],
  }),
  lesson({
    id: "addition", title: "合起来，为什么用加法", domainId: "number", stageId: "operate", prerequisites: ["compose", "order"],
    goal: "把两部分合起来求整体，并说清加号的意思。",
    why: "分与合让我们看见部分和整体；加法把“合起来”写下来，接着可以与减法互相检查。",
    story: { title: "池塘里又来了小鸭", text: "池塘原有 3 只鸭，又游来 2 只。把原来的和新来的合起来，就能知道现在有多少只。" },
    activity: { kind: "add", instruction: "把原来的 3 个和新来的 2 个合起来，再数总数。", values: [3, 2] },
    explanation: ["3 + 2 中，3 和 2 是两部分，+ 表示合起来。", "合起来有 5，所以写成 3 + 2 = 5。", "也可以从 3 接着数 2 次：4、5，不必每次都从 1 开始。"],
    takeaway: "知道两部分，用加法求合起来的整体。",
    checks: [
      { prompt: "盒里有 4 支笔，又放进 2 支。哪道算式表示现在的总数？", options: ["4 + 2", "4 = 2", "4 − 2"], answer: 0, explanation: "把原来的 4 支和放进的 2 支合起来，用 4 + 2。" },
      { prompt: "树上 2 只鸟，草地上 5 只鸟，一共有几只鸟？", options: ["5 只", "3 只", "7 只"], answer: 2, explanation: "这也是合并两个部分，不一定要发生“又来了”：2 + 5 = 7。" },
    ],
  }),
  lesson({
    id: "subtraction", title: "剩下多少，相差多少", domainId: "number", stageId: "operate", prerequisites: ["addition", "match"],
    goal: "用减法找剩下的部分，也用减法找两个数量的差。",
    why: "加法把部分合成整体；反过来知道整体和一个部分，就能用减法找另一个部分。",
    story: { title: "借走两本书", text: "书架原有 7 本书，借走 2 本。把借走的部分拿开，剩下 5 本，可以写成 7 − 2 = 5。" },
    activity: { kind: "subtract", instruction: "从 7 个里面拿走 2 个，观察拿走的和留下的各有多少。", values: [7, 2] },
    explanation: ["7 − 2 表示从 7 中去掉 2，求剩下的部分。", "比较 7 个和 2 个时，先配掉相同的 2 个，多出来的也是 5 个。", "所以减法既能求剩下多少，也能求相差多少。"],
    takeaway: "减法能找剩余，也能找差。",
    checks: [
      { prompt: "6 颗糖吃掉 2 颗，还剩多少颗？", options: ["4 颗", "8 颗", "2 颗"], answer: 0, explanation: "从原来 6 颗去掉 2 颗，6 − 2 = 4。" },
      { prompt: "哥哥有 8 张卡片，妹妹有 5 张。哥哥多几张？", options: ["13 张", "3 张", "5 张"], answer: 1, explanation: "先把一样多的 5 张配在一起，哥哥多出的部分是 8 − 5 = 3 张。" },
    ],
  }),
  lesson({
    id: "inverse", title: "加法和减法互相帮忙", domainId: "number", stageId: "operate", prerequisites: ["addition", "subtraction"],
    goal: "把同一个整体与两部分，写成相关的加减算式。",
    why: "看懂加减各自的意思后，把它们连起来，就能检查答案，也能寻找题目中未知的部分。",
    story: { title: "积木一家人", text: "一边 3 个、一边 4 个，合起来 7 个。知道这三个数的关系，就能写出 3 + 4 = 7 和 7 − 3 = 4。" },
    activity: { kind: "compose", instruction: "把 7 分成 3 和 4，再从两个部分想出一句加法和一句减法。", values: [7, 3] },
    explanation: ["3 + 4 = 7：知道两部分，找整体。", "7 − 3 = 4：知道整体和一部分，找另一部分。", "算出 7 − 3 = 4 后，可以用 4 + 3 = 7 检查是否回到原来的整体。"],
    takeaway: "同一组部分和整体，把加法与减法连起来。",
    checks: [
      { prompt: "知道 2 + 5 = 7，哪道减法也正确？", options: ["7 − 5 = 2", "5 − 2 = 7", "7 − 2 = 2"], answer: 0, explanation: "整体 7 去掉一部分 5，留下另一部分 2。" },
      { prompt: "你算出 9 − 4 = 5，用哪一道算式检查最直接？", options: ["5 − 4 = 1", "5 + 4 = 9", "9 + 4 = 13"], answer: 1, explanation: "把剩下的 5 和去掉的 4 合起来，能回到原来的 9，就验证了部分与整体。" },
    ],
  }),
  lesson({
    id: "place-value", title: "同一个数字，位置不同意思不同", domainId: "number", stageId: "operate", prerequisites: ["ten", "addition"],
    goal: "用几个十和几个一理解两位数的写法。",
    why: "十个一组成一个十，让我们用位置区分计数单位；理解数位后才能可靠地计算更大的数。",
    story: { title: "十二根小棒怎样写", text: "12 根小棒分成一捆十根和两根散棒。12 左边的 1 记一捆十，右边的 2 记两个一。" },
    activity: { kind: "count", instruction: "数完 12 个圆片，再把 10 个一合成 1 个十，观察还有几个单独的“一”。", values: [12] },
    explanation: ["12 的 1 在十位，表示 1 个十；2 在个位，表示 2 个一。", "21 的 2 在十位，表示 2 个十；1 在个位，表示 1 个一。", "30 的个位是 0，表示没有剩下的单个，但十位仍有 3 个十。"],
    takeaway: "数字放在哪个数位，就表示几个那样的计数单位。",
    checks: [
      { prompt: "23 中的 2 表示什么？", options: ["2 个十", "2 个百", "2 个一"], answer: 0, explanation: "2 在十位，所以表示 2 个十，也就是 20。" },
      { prompt: "4 个十和 0 个一，应写成哪个数？", options: ["40", "04", "4"], answer: 0, explanation: "十位写 4，个位没有单个写 0，组成 40。" },
    ],
  }),
  lesson({
    id: "read-problem", title: "先说清知道什么、要找什么", domainId: "problem", stageId: "operate", prerequisites: ["inverse"],
    goal: "从故事里找到有用信息，画出或说出数量关系。",
    why: "会加减以后，下一步是判断什么时候用它们；先理清关系，才能走向需要多步解决的问题。",
    story: { title: "图书角的书", text: "图书角有 7 本绘本，其中 3 本借出去了。书架是绿色的。要找还剩几本，哪些信息有用？" },
    activity: { kind: "subtract", instruction: "把 7 看作全部，拿走借出的 3。指出哪个部分是问题要找的。", values: [7, 3] },
    explanation: ["先说问题：要找剩下的书，不是书架的颜色。", "再找有用信息：原有 7 本，借走 3 本。", "用全部减去借走的部分，7 − 3 = 4；最后回答剩下 4 本，并检查单位。"],
    takeaway: "先弄清数量关系，再选运算，最后回到问题检查。",
    checks: [
      { prompt: "求借书后剩几本，哪条信息与计算无关？", options: ["借出 3 本", "原有 7 本", "书架是绿色的"], answer: 2, explanation: "书架颜色不影响书的数量；原有和借出的本数才是有用信息。" },
      { prompt: "车上原有 5 人，又上来 2 人。要找现在的人数，怎样想？", options: ["把原有和上来的合起来", "去掉上来的 2 人", "只看车是什么颜色"], answer: 0, explanation: "现在的人数包括原有和新上来的两个部分，所以应该合起来。" },
    ],
  }),
  lesson({
    id: "length", title: "大家用同样的厘米和米", domainId: "space", stageId: "operate", prerequisites: ["measure-unit", "place-value", "subtraction"],
    goal: "认识标准长度单位，并理解尺上两刻度的差表示长度。",
    why: "随手选的单位可能不同；统一用厘米和米，大家才能交流测量结果，并继续研究周长。",
    story: { title: "量铅笔", text: "把铅笔一端对准真尺的 0，另一端到 6 厘米刻度，铅笔就长 6 厘米。屏幕上的尺只是学习示意图。" },
    activity: { kind: "measure", instruction: "观察从 0 到 6 的 6 个单位段。示意图按厘米标注，不能当作真实尺子量物品。", values: [6] },
    explanation: ["厘米适合记录铅笔这样的较短长度，米常用来记录房间这样的较长长度。", "1 米 = 100 厘米，换了单位，真实长度没有改变。", "如果一端在 2 厘米、另一端在 8 厘米，长度是 8 − 2 = 6 厘米。"],
    takeaway: "长度看跨过几个单位段，不是只看末端刻度。",
    checks: [
      { prompt: "尺子上从 2 厘米到 8 厘米的一段，长多少厘米？", options: ["8 厘米", "10 厘米", "6 厘米"], answer: 2, explanation: "末端刻度减起点刻度：8 − 2 = 6 厘米。" },
      { prompt: "一根 1 米长的绳子，用厘米表示是多少？", options: ["10 厘米", "100 厘米", "1 厘米"], answer: 1, explanation: "1 米和 100 厘米表示同样的长度，只是使用的单位不同。" },
    ],
  }),
  lesson({
    id: "multiplication", title: "相同的几组，用乘法表示", domainId: "number", stageId: "relate", prerequisites: ["addition", "pattern"],
    goal: "从重复加相同数量，理解组数、每组数量和总数。",
    why: "加法能把各部分合起来；每部分一样多时，乘法可以更简洁地记录，为平均分作准备。",
    story: { title: "三盘草莓", text: "3 个盘子，每盘 4 颗草莓。4 + 4 + 4 是三个 4 合起来，也可以用乘法算出总数 12。" },
    activity: { kind: "groups", instruction: "先看有 3 组，再看每组有 4 个。试着一组一组地数总数。", values: [3, 4] },
    explanation: ["这里的关键是每盘同样多，都是 4 颗。", "3 组、每组 4 个，总数是 3 × 4 = 12，也可以写 4 × 3 = 12。", "不是看到两个数就相乘，要先说清它们表示组数还是每组数量。"],
    takeaway: "相同的几组相加，可以用乘法求总数。",
    checks: [
      { prompt: "4 + 4 + 4 表示什么？", options: ["4 组，每组 4 个", "3 组，每组 4 个", "3 个和 4 个合起来"], answer: 1, explanation: "有三个相同的加数 4，就是 3 组、每组 4 个。" },
      { prompt: "2 辆小车，每辆有 4 个轮子，一共有几个轮子？", options: ["6 个", "8 个", "4 个"], answer: 1, explanation: "每辆同样有 4 个，2 组 4 个是 2 × 4 = 8 个。" },
    ],
  }),
  lesson({
    id: "division", title: "平均分，为什么用除法", domainId: "number", stageId: "relate", prerequisites: ["multiplication", "compose"],
    goal: "理解平均分，并联系乘法理解除法。",
    why: "乘法从组数和每组数量求总数；除法反过来，从总数找每组数量或组数，接着才能认识分数。",
    story: { title: "公平分饼干", text: "12 块饼干平均分给 3 个小朋友，每人要一样多。一个一个轮流分，每人最后得到 4 块。" },
    activity: { kind: "share", instruction: "把 12 个平均分成 3 份，观察每份是否同样多。", values: [12, 3] },
    explanation: ["平均分的意思是每份同样多，不是只要分到就可以。", "12 ÷ 3 = 4：总数 12，平均分成 3 份，每份 4。", "如果每袋装 3 块，12 块可以装 4 袋，也用 12 ÷ 3；要说清结果表示什么。"],
    takeaway: "除法是在相等的组之间，寻找缺少的数量。",
    checks: [
      { prompt: "哪一种是把 8 颗糖平均分成两份？", options: ["一份 3 颗，一份 5 颗", "一份 2 颗，一份 6 颗", "每份 4 颗"], answer: 2, explanation: "平均分要求每份一样多，4 和 4 才满足这个要求。" },
      { prompt: "12 支笔，每盒装 4 支，能装几盒？", options: ["4 盒", "3 盒", "8 盒"], answer: 1, explanation: "要找有几组 4。因为 3 × 4 = 12，所以 12 ÷ 4 = 3 盒。" },
    ],
  }),
  lesson({
    id: "times", title: "几倍，就是几个同样多", domainId: "number", stageId: "relate", prerequisites: ["multiplication", "division", "compare"],
    goal: "分清多几个和是几倍，知道比较时的一份是什么。",
    why: "学过等量分组后，可以把一个数量看作一份来比较另一个；这会帮助理解比和比例关系。",
    story: { title: "红花和蓝花", text: "红花有 2 朵，蓝花有 6 朵。把 2 朵看成一份，6 朵里有这样的 3 份，所以蓝花是红花的 3 倍。" },
    activity: { kind: "groups", instruction: "每组 2 个，一共 3 组。把其中 1 组看作一份，再看看全部是它的几倍。", values: [3, 2] },
    explanation: ["比较倍数时，先说清把谁看作一份。", "6 里面有 3 个 2，所以 6 是 2 的 3 倍。", "6 比 2 多 4，而不是多 3；多多少用减法，是几倍用等量分组来想。"],
    takeaway: "几倍是在问：里面有几个同样大的一份？",
    checks: [
      { prompt: "8 是 2 的几倍？", options: ["4 倍", "6 倍", "2 倍"], answer: 0, explanation: "8 里面有 4 个 2，8 ÷ 2 = 4，所以是 4 倍。" },
      { prompt: "小明有 3 张卡，小红有 9 张。哪句话正确？", options: ["小红比小明多 3 张", "小红是小明的 3 倍，比小明多 6 张", "两个人一样多"], answer: 1, explanation: "9 ÷ 3 = 3 表示倍数，9 − 3 = 6 表示相差的张数。" },
    ],
  }),
  lesson({
    id: "time", title: "把时间也分成相同的份", domainId: "space", stageId: "relate", prerequisites: ["measure-unit", "multiplication", "place-value"],
    goal: "认识小时和分钟，理解钟面上每大格表示 5 分钟。",
    why: "测长度需要统一单位，记录经过的时间也一样；相同分组可以帮我们数钟面上的分钟。",
    story: { title: "看书一刻钟", text: "分针从 12 出发走 3 大格到 3，每大格经过 5 分钟，共经过 15 分钟。这个时长也叫一刻钟。" },
    activity: { kind: "groups", instruction: "这里每个圆片代表 1 分钟，每组 5 分钟。数一数 3 组表示几分钟。", values: [3, 5] },
    explanation: ["1 小时 = 60 分钟。钟面一圈分成 12 大格，每大格是 5 分钟。", "3 个 5 分钟合起来是 15 分钟，所以走 3 大格经过 15 分钟。", "“几点”说的是某个时刻，“经过几分钟”说的是一段时间，不是同一个问题。"],
    takeaway: "看时刻和算时长要分清，小时与分钟都是时间单位。",
    checks: [
      { prompt: "分针从 12 走 2 大格到 2，经过多少分钟？", options: ["20 分钟", "2 分钟", "10 分钟"], answer: 2, explanation: "每大格 5 分钟，2 个 5 分钟就是 10 分钟。" },
      { prompt: "9:00 开始读书，9:15 结束，一共读了多久？", options: ["60 分钟", "9 分钟", "15 分钟"], answer: 2, explanation: "9:00 和 9:15 是两个时刻，中间经过 15 分钟。" },
    ],
  }),
  lesson({
    id: "perimeter", title: "围一圈，边界一共多长", domainId: "space", stageId: "relate", prerequisites: ["shape", "length", "multiplication"],
    goal: "沿图形边界走一圈，理解周长是边界的总长度。",
    why: "知道图形和长度以后，可以把各边相加求一圈长度；接下来要区分围一圈与铺满里面。",
    story: { title: "给菜地围围栏", text: "一块正方形菜地，每边长 3 米。围栏要沿 4 条边围一圈，需要把 4 个 3 米加起来。" },
    activity: { kind: "shape", instruction: "沿正方形的四条边走一圈。示意图每边代表 3 米，看看走一圈累计有多长。", values: [4, 3] },
    explanation: ["周长是封闭图形一周边界的长度，不是里面铺了多大。", "正方形四边相等，每边 3 米，所以周长是 3 × 4 = 12 米。", "长方形要把长、宽、长、宽都算上，不能只算一条长和一条宽。"],
    takeaway: "周长是在量边界，沿一圈把所有边的长度加起来。",
    checks: [
      { prompt: "正方形每边 2 厘米，周长是多少？", options: ["2 厘米", "8 厘米", "4 厘米"], answer: 1, explanation: "4 条边各 2 厘米，2 × 4 = 8 厘米。" },
      { prompt: "给长 4 米、宽 2 米的长方形围一圈，哪道算式合适？", options: ["4 × 2", "4 + 2", "4 + 2 + 4 + 2"], answer: 2, explanation: "完整一圈有两条长和两条宽，要把四条边都加起来。" },
    ],
  }),
  lesson({
    id: "data", title: "先分类记录，再看数据说了什么", domainId: "data", stageId: "relate", prerequisites: ["count", "compare", "read-problem"],
    goal: "用统一规则分类计数，通过图表比较实际记录。",
    why: "数数和比较可以帮助我们整理许多信息；记录清楚后，才能判断结论是否真的有证据。",
    story: { title: "今天的水果小调查", text: "让每位小朋友只选一种最喜欢的水果。苹果 5 票，香蕉 3 票，橘子 2 票。把每一票都记录一次。" },
    activity: { kind: "data", instruction: "把选票按水果分类，看看柱子怎样增加；整理完再比较哪类最多。每个单位代表 1 票。", values: [5, 3, 2], labels: ["苹果", "香蕉", "橘子"] },
    explanation: ["先说清调查规则：每人只选一种，每张票只记一次。", "条形的高低表示本次各类的数量，苹果 5 票最多。", "这只是这一次、这些小朋友的选择，不能说所有孩子永远都最喜欢苹果。"],
    takeaway: "先按规则记录，再用数据回答问题，并说清调查范围。",
    checks: [
      { prompt: "每人只投一票，5 票、3 票、2 票合起来代表多少人？", options: ["3 人", "10 人", "5 人"], answer: 1, explanation: "每人只有一票，各类加起来是 5 + 3 + 2 = 10 人。" },
      { prompt: "一次调查苹果票数最多，能得到哪个结论？", options: ["世界上每个孩子都最爱苹果", "参加本次调查的孩子中，选苹果的人最多", "下次调查也一定相同"], answer: 1, explanation: "数据支持本次调查中的比较，不能直接推到所有人或每一次。" },
    ],
  }),
  lesson({
    id: "fraction", title: "不满一个，也能用数表示", domainId: "number", stageId: "extend", prerequisites: ["division", "compose"],
    goal: "先确定一个整体，再用平均分理解分数。",
    why: "平均分整数已经会了；把一个整体平均分成几份，就能表示不足一个的部分，为小数打基础。",
    story: { title: "四个人分享一个饼", text: "把一个饼平均分成 4 份，每人拿 1 份。这一份是整个饼的四分之一，写作 1/4。" },
    activity: { kind: "fraction", instruction: "先认清整个图形，再观察平均分成的 4 份。选出其中 1 份。", values: [1, 4] },
    explanation: ["分数先要知道把什么看作一个整体，再平均分。", "1/4 中，下面的 4 表示平均分成 4 份，上面的 1 表示取其中 1 份。", "如果 4 块大小不一样，其中一块就不能直接叫整个饼的 1/4。"],
    takeaway: "分数表示一个整体平均分后，取了这样的几份。",
    checks: [
      { prompt: "一个饼平均分成 4 份，取 3 份，用哪个分数表示？", options: ["4/3", "3/4", "1/3"], answer: 1, explanation: "平均分成 4 份写在下面，取了 3 份写在上面，所以是 3/4。" },
      { prompt: "大饼的一半和小饼的一半，实际大小一定一样吗？", options: ["一定一样", "不一定，因为整体大小不同", "都等于一整个饼"], answer: 1, explanation: "都是各自整体的一半，但两个整体不同大，实际拿到的部分也可能不同大。" },
    ],
  }),
  lesson({
    id: "equal-fractions", title: "分法变了，部分可以一样大", domainId: "number", stageId: "extend", prerequisites: ["fraction", "multiplication"],
    goal: "在同一个整体中，看懂 1/2 与 2/4 表示相同大小。",
    why: "知道分数表示几份后，再看每份怎样细分；理解等值分数，才能比较分数并连接百分数。",
    story: { title: "半张纸再对折", text: "同一张纸先平均分成 2 份，涂其中一份。再把每份都一分为二，涂色没有变，却变成 4 份中的 2 份。" },
    activity: { kind: "fraction", instruction: "观察同一个图形的 4 等份，选中 2 份，看看它是不是整个图形的一半。", values: [2, 4] },
    explanation: ["同一个整体，1/2 和 2/4 表示的大小相同。", "每一份变小了，取的份数也相应增加，涂色部分并没有变。", "不能只看到下面的数字变大就说分数变大，要一起看分成几份、取了几份。"],
    takeaway: "同一个整体中的同样大小，可以有不同分数写法。",
    checks: [
      { prompt: "同一张纸的 1/2 和 2/4，大小有什么关系？", options: ["一样大", "2/4 一定更大", "1/2 一定更大"], answer: 0, explanation: "把半张纸再平分成两小份，就得到整张纸的 2/4，大小没有变。" },
      { prompt: "同样大的两个饼，一个取 1/2，一个取 1/4，哪份更大？", options: ["一样大", "1/2 更大", "1/4 更大"], answer: 1, explanation: "整体相同，平均分成 2 份时，每份比分成 4 份时大。" },
    ],
  }),
  lesson({
    id: "decimal", title: "十分之几，换一种写法", domainId: "number", stageId: "extend", prerequisites: ["fraction", "place-value"],
    goal: "把十分之几和一位小数联系起来。",
    why: "分数让我们表示不足一个的数量；沿着数位继续分成十份，就得到十分位，并能连接钱和长度。",
    story: { title: "一元里的三角", text: "1 元平均分成 10 份，每份是 1 角。3 角是 1 元的 3/10，也可以写成 0.3 元。" },
    activity: { kind: "decimal", instruction: "把整个图形看作 1，分成 10 等份，观察 3 份怎样写成 0.3。", values: [3, 10] },
    explanation: ["0.3 中，小数点左边的 0 表示不足 1 个完整单位。", "右边第一位是十分位，3 表示 3 个十分之一，也就是 3/10。", "每个十分之一再平均分成 10 份，就是百分之一；小数点右边第二位是百分位。", "单位一定要说清：0.3 元是 3 角；0.3 米是 3/10 米。"],
    takeaway: "小数把单位继续十等分，用数位来记录。",
    checks: [
      { prompt: "0.4 表示几个十分之一？", options: ["1 个", "40 个", "4 个"], answer: 2, explanation: "4 在十分位，表示 4 个十分之一，也就是 4/10。" },
      { prompt: "1 元 = 10 角，5 角用元表示是多少？", options: ["50 元", "5 元", "0.5 元"], answer: 2, explanation: "5 角是 1 元的 5/10，所以写成 0.5 元。" },
    ],
  }),
  lesson({
    id: "area", title: "铺满里面，需要多少小方格", domainId: "space", stageId: "extend", prerequisites: ["perimeter", "measure-unit", "multiplication"],
    goal: "用面积单位铺满一个面，并理解长方形的行列计数。",
    why: "周长量的是外面的一圈；要知道里面多大，需要新的面积单位。行列分组再把乘法连接进来。",
    story: { title: "给地板铺方砖", text: "一块长方形地板，每行能铺 4 块同样的正方形砖，共 3 行。不重叠也不留空隙，铺满需要 12 块。" },
    activity: { kind: "area", instruction: "观察 4 列、3 行的格子，按行数出铺满整个面的单位方格。", values: [4, 3] },
    explanation: ["面积描述一个面有多大，可以用同样大的正方形铺满来比较。", "每行 4 格，共 3 行，有 4 × 3 = 12 个单位方格。", "若每格是 1 平方厘米，面积就是 12 平方厘米；面积单位与量边界的厘米不同。"],
    takeaway: "面积量里面的大小，长方形可以用每行格数 × 行数来数。",
    checks: [
      { prompt: "长方形每行 5 个单位方格，共 2 行，面积有多少个单位方格？", options: ["10 个", "5 个", "7 个"], answer: 0, explanation: "2 行都各有 5 格，总共 5 × 2 = 10 个单位方格。" },
      { prompt: "给相框的四边贴装饰带，主要需要知道什么？", options: ["图形的颜色", "里面铺了几块砖", "相框边界的周长"], answer: 2, explanation: "装饰带沿四边围一圈，求的是边界长度，所以要用周长。" },
    ],
  }),
  lesson({
    id: "volume", title: "一层一层搭，认识体积", domainId: "space", stageId: "extend", prerequisites: ["area", "multiplication", "shape"],
    goal: "用同样大小的小正方体，理解立体占空间的大小。",
    why: "面积用小方格铺一层，体积则把小正方体一层层叠起来；数空间也可以借助等量分组。",
    story: { title: "搭一个积木盒", text: "每层用 3 列、2 行的小正方体，搭同样的 2 层。每层 6 块，两层一共 12 块，所有位置都填满。" },
    activity: { kind: "volume", instruction: "观察每层 3 列、2 行，再查看 2 层。把被挡住的小正方体也算进去。", values: [3, 2, 2] },
    explanation: ["立体占据空间，体积说的是占了多大的空间。", "用一样大的小正方体装满，不留空隙、不重叠，一共用了几个就是几个这样的体积单位。", "每层 3 × 2 = 6 块，2 层共 6 × 2 = 12 块；不能只数看得见的几个面。"],
    takeaway: "体积是在数空间里能放下多少个相同的小正方体。",
    checks: [
      { prompt: "每层 6 个小正方体，同样的 3 层，一共有几个？", options: ["18 个", "9 个", "6 个"], answer: 0, explanation: "3 层都一样，每层 6 个，6 × 3 = 18 个。" },
      { prompt: "数实心积木块的体积，只数外面看得到的小方块行吗？", options: ["不行，内部和后面的小方块也占空间", "可以，挡住的不用数", "只要数颜色就行"], answer: 0, explanation: "体积包括整个立体占的空间，被挡住的小方块也要算入。" },
    ],
  }),
  lesson({
    id: "multi-step", title: "一个大问题，分成几步想", domainId: "problem", stageId: "apply", prerequisites: ["read-problem", "multiplication", "subtraction"],
    goal: "先找中间需要知道的量，再决定计算顺序。",
    why: "已经理解加减乘除的关系，就可以把几种关系连接起来；每一步回答一个小问题，才能解释复杂算式。",
    story: { title: "分完饼干还剩多少", text: "有 3 袋饼干，每袋 4 块，吃了 2 块，还剩多少？先求原来一共有多少，再去掉吃掉的部分。" },
    activity: { kind: "groups", instruction: "先数 3 组、每组 4 个的总数，再想象从总数拿走 2 个。", values: [3, 4] },
    explanation: ["第一步：3 × 4 = 12，求原来一共有多少块。", "第二步：12 − 2 = 10，求吃掉以后还剩多少块。", "写成 3 × 4 − 2 时，先做乘法；这里的顺序来自先求总数、再去掉的数量关系。"],
    takeaway: "先找必须先知道的量，让每一步都有清楚的意思。",
    checks: [
      { prompt: "3 袋饼干每袋 4 块，吃掉 2 块。第一步先求什么？", options: ["吃完后的重量", "原来一共有多少块", "袋子什么颜色"], answer: 1, explanation: "要从总数拿走 2 块，必须先知道总数，所以先算 3 × 4。" },
      { prompt: "2 盒笔，每盒 5 支，送出 3 支，还剩多少？", options: ["4 支", "13 支", "7 支"], answer: 2, explanation: "先求总数 2 × 5 = 10 支，再算 10 − 3 = 7 支。" },
    ],
  }),
  lesson({
    id: "ratio", title: "配方里的比，保留数量关系", domainId: "number", stageId: "apply", prerequisites: ["times", "fraction", "multiplication"],
    goal: "用同样的份理解两个数量的比，知道同时扩大才保持配方。",
    why: "几倍比较了相同的份，分数比较部分与整体；比可以记录两个数量之间的配合关系。",
    story: { title: "调一杯果汁", text: "用同一个小杯，量 2 杯果汁原液、3 杯水，原液与水的比是 2:3。要多调一些，可以两种都加倍。" },
    activity: { kind: "ratio", instruction: "观察原液 2 份与水 3 份，用同一个倍数放大，看看关系怎样保持。", values: [2, 3], labels: ["原液", "水"] },
    explanation: ["2:3 读作 2 比 3，先说的原液对应 2，后说的水对应 3。", "4 杯原液配 6 杯水，是两种都变为原来的 2 倍，配方关系相同。", "原液与水的比是 2:3，但原液占混合后的 2/5，不能把两个不同的比较混在一起。"],
    takeaway: "比记录两种数量的关系，同时按相同倍数变化能保持配方。",
    checks: [
      { prompt: "原液与水是 2:3，哪一组保持相同配方？", options: ["4 杯原液、3 杯水", "2 杯原液、6 杯水", "4 杯原液、6 杯水"], answer: 2, explanation: "原液与水都变成原来的 2 倍，2:3 就变成 4:6，关系相同。" },
      { prompt: "2 杯原液和 3 杯水混合，原液占总量的几分之几？", options: ["3/5", "2/3", "2/5"], answer: 2, explanation: "总量是 2 + 3 = 5 份，原液占其中 2 份，所以是 2/5。" },
    ],
  }),
  lesson({
    id: "percent", title: "统一看成一百份，认识百分数", domainId: "number", stageId: "apply", prerequisites: ["equal-fractions", "decimal", "ratio"],
    goal: "理解百分数表示每一百份中的几份，联系分数与小数。",
    why: "分数和比都在表达数量关系；统一想成 100 份，可以把不同大小整体中的占比放在一起比较。",
    story: { title: "阅读计划完成了多少", text: "4 本计划阅读的书已读完 1 本，完成了 1/4。把相同比例想成 100 份，就是 25 份，记作 25%。" },
    activity: { kind: "fraction", instruction: "先涂出 4 等份中的 1 份，再把整体细分成 100 份。观察原来的涂色部分现在占几份。", values: [1, 4, 100] },
    explanation: ["25% 读作百分之二十五，表示 25/100。", "1/4 = 25/100 = 25% = 0.25，它们表示相同的占比。", "50% 是一半，但要看整体是多少；10 本的一半与 20 本的一半，本数不同。"],
    takeaway: "百分数在比较占比，实际多少还要看整体。",
    checks: [
      { prompt: "50% 表示什么？", options: ["比原来多 50 个", "任何情况下都是 50 个", "每 100 份中的 50 份，也就是一半"], answer: 2, explanation: "百分数表示关系，50/100 = 1/2，不是固定的实际个数。" },
      { prompt: "计划读 20 本书，已经完成 50%，读完了几本？", options: ["10 本", "50 本", "5 本"], answer: 0, explanation: "50% 是整体的一半，20 本平均分成 2 份，每份 10 本。" },
    ],
  }),
  lesson({
    id: "chance", title: "可能发生，不等于一定发生", domainId: "data", stageId: "apply", prerequisites: ["data", "fraction", "compare"],
    goal: "区分一定、不可能与可能，理解数量更多不代表每次必然出现。",
    why: "数据记录已经发生的事；对还没发生的随机结果，只能说可能性，不能把一次结果当成保证。",
    story: { title: "不看颜色摸小球", text: "袋里有 3 个红球、1 个蓝球，没有黄球。球的大小、形状都一样，充分混匀，不看颜色摸一个，每个球被摸到的机会相同。" },
    activity: { kind: "data", instruction: "先按颜色整理袋里的球，记录各色的个数。再比较数量，判断哪些颜色可能被摸到。", values: [3, 1, 0], labels: ["红球", "蓝球", "黄球"] },
    explanation: ["袋里没有黄球，所以从这个袋子里不可能摸到黄球。", "红球和蓝球都有，两个颜色都有可能被摸到。", "在每个球机会相同的前提下，红球更多，摸到红球的可能性更大；但下一次仍可能是蓝球。"],
    takeaway: "可能性更大，不等于这一次一定发生。",
    checks: [
      { prompt: "袋中 3 红 1 蓝没有黄，按故事条件摸一个，哪句话正确？", options: ["不可能是黄球", "一定是红球", "一定是蓝球"], answer: 0, explanation: "袋里根本没有黄球，因此不可能摸到；红球和蓝球都存在，都可能被摸到。" },
      { prompt: "第一次摸到了蓝球，能说明原来摸蓝球的可能性更大吗？", options: ["能，摸到一次就证明更多", "不能，一次结果不能说明哪个可能性更大", "能，红球就不可能出现了"], answer: 1, explanation: "可能性较小的结果也能发生一次。要比较这个袋子的可能性，应看同等机会下各颜色球的数量。" },
    ],
  }),
  lesson({
    id: "strategy", title: "把知识连起来，解释你的方案", domainId: "problem", stageId: "apply", prerequisites: ["multi-step", "area", "data", "percent"],
    goal: "把故事、图、算式和检查连起来，说明一个方案为什么合理。",
    why: "前面学的数量、运算、测量和记录可以一起用；能解释每一步，才更容易把方法迁移到新问题。",
    story: { title: "规划班级的小花圃", text: "花圃排成 4 列、3 行，每格种 1 株花。计划一半种红花，其余种黄花。先找总格数，再找每种需要多少株。" },
    activity: { kind: "area", instruction: "观察 4 列、3 行的花圃，把其中一半看作红花的位置，说明你怎样知道是一半。", values: [4, 3] },
    explanation: ["先画图或用格子表示：每行 4 格，共 3 行，总数是 4 × 3 = 12。", "一半也是 50%，把 12 平均分成 2 份，每份 6，所以两种花各需 6 株。", "检查：6 + 6 = 12，没有多出或少掉；还要确认每格一株这个条件。", "换一个花圃时，可以继续先表示、再分步计算、最后回到条件检查。"],
    takeaway: "好方法不只是一个答案，还能画出来、讲明白、检查得了。",
    checks: [
      { prompt: "4 列 3 行，每格 1 株，一半种红花，需要几株红花？", options: ["7 株", "12 株", "6 株"], answer: 2, explanation: "先算总数 4 × 3 = 12，再找一半 12 ÷ 2 = 6。" },
      { prompt: "新花圃是 5 列 4 行，仍一半红花、一半黄花。哪种做法完整？", options: ["先算 20 格，再各分 10 株，检查 10 + 10 = 20", "直接照搬上次的 6 株", "只看哪种颜色好看"], answer: 0, explanation: "方法可以迁移，数值要按新条件重算；求总数、平均分和检查三个步骤都要对应新花圃。" },
    ],
  }),
];
