import type { SubjectId } from "./learning-types";

// Small navigation index. Full activities stay in their own subject pages.
export const worldLessonIndex: {id:string; subjectId:SubjectId; title:string; goal:string; checkIds:string[]}[] = [
  {
    "id": "count",
    "subjectId": "math",
    "title": "一个一个，数清有多少",
    "goal": "每个物品只数一次，知道最后一个数表示一共有多少。",
    "checkIds": [
      "count-understand",
      "count-transfer"
    ]
  },
  {
    "id": "match",
    "subjectId": "math",
    "title": "一个配一个，比多少",
    "goal": "用一一配对发现一样多、多一些或少一些。",
    "checkIds": [
      "match-understand",
      "match-transfer"
    ]
  },
  {
    "id": "compare",
    "subjectId": "math",
    "title": "把多少写成大小",
    "goal": "把数量比较和 >、<、= 连起来。",
    "checkIds": [
      "compare-understand",
      "compare-transfer"
    ]
  },
  {
    "id": "zero",
    "subjectId": "math",
    "title": "一个也没有，用 0 表示",
    "goal": "知道 0 可以表示一个也没有，而且 0 也是数。",
    "checkIds": [
      "zero-understand",
      "zero-transfer"
    ]
  },
  {
    "id": "shape",
    "subjectId": "math",
    "title": "形状有什么不同",
    "goal": "观察边和顶点，初步区分圆、三角形与正方形。",
    "checkIds": [
      "shape-understand",
      "shape-transfer"
    ]
  },
  {
    "id": "compose",
    "subjectId": "math",
    "title": "一个数，可以分成两部分",
    "goal": "发现部分变了，总数可以不变。",
    "checkIds": [
      "compose-understand",
      "compose-transfer"
    ]
  },
  {
    "id": "ten",
    "subjectId": "math",
    "title": "十个一，组成一个十",
    "goal": "把 10 个一看成一个新单位：十。",
    "checkIds": [
      "ten-understand",
      "ten-transfer"
    ]
  },
  {
    "id": "order",
    "subjectId": "math",
    "title": "数可以排成有顺序的队伍",
    "goal": "按照从小到大的顺序，找到一个数的前面和后面。",
    "checkIds": [
      "order-understand",
      "order-transfer"
    ]
  },
  {
    "id": "measure-unit",
    "subjectId": "math",
    "title": "用同样大小的一份来量",
    "goal": "明白测量要用相同单位，首尾相接而不重叠。",
    "checkIds": [
      "measure-unit-understand",
      "measure-unit-transfer"
    ]
  },
  {
    "id": "pattern",
    "subjectId": "math",
    "title": "找出不断重复的一小组",
    "goal": "找出重复单元，并根据它继续排列。",
    "checkIds": [
      "pattern-understand",
      "pattern-transfer"
    ]
  },
  {
    "id": "addition",
    "subjectId": "math",
    "title": "合起来，为什么用加法",
    "goal": "把两部分合起来求整体，并说清加号的意思。",
    "checkIds": [
      "addition-understand",
      "addition-transfer"
    ]
  },
  {
    "id": "subtraction",
    "subjectId": "math",
    "title": "剩下多少，相差多少",
    "goal": "用减法找剩下的部分，也用减法找两个数量的差。",
    "checkIds": [
      "subtraction-understand",
      "subtraction-transfer"
    ]
  },
  {
    "id": "inverse",
    "subjectId": "math",
    "title": "加法和减法互相帮忙",
    "goal": "把同一个整体与两部分，写成相关的加减算式。",
    "checkIds": [
      "inverse-understand",
      "inverse-transfer"
    ]
  },
  {
    "id": "place-value",
    "subjectId": "math",
    "title": "同一个数字，位置不同意思不同",
    "goal": "用几个十和几个一理解两位数的写法。",
    "checkIds": [
      "place-value-understand",
      "place-value-transfer"
    ]
  },
  {
    "id": "read-problem",
    "subjectId": "math",
    "title": "先说清知道什么、要找什么",
    "goal": "从故事里找到有用信息，画出或说出数量关系。",
    "checkIds": [
      "read-problem-understand",
      "read-problem-transfer"
    ]
  },
  {
    "id": "length",
    "subjectId": "math",
    "title": "大家用同样的厘米和米",
    "goal": "认识标准长度单位，并理解尺上两刻度的差表示长度。",
    "checkIds": [
      "length-understand",
      "length-transfer"
    ]
  },
  {
    "id": "multiplication",
    "subjectId": "math",
    "title": "相同的几组，用乘法表示",
    "goal": "从重复加相同数量，理解组数、每组数量和总数。",
    "checkIds": [
      "multiplication-understand",
      "multiplication-transfer"
    ]
  },
  {
    "id": "division",
    "subjectId": "math",
    "title": "平均分，为什么用除法",
    "goal": "理解平均分，并联系乘法理解除法。",
    "checkIds": [
      "division-understand",
      "division-transfer"
    ]
  },
  {
    "id": "times",
    "subjectId": "math",
    "title": "几倍，就是几个同样多",
    "goal": "分清多几个和是几倍，知道比较时的一份是什么。",
    "checkIds": [
      "times-understand",
      "times-transfer"
    ]
  },
  {
    "id": "time",
    "subjectId": "math",
    "title": "把时间也分成相同的份",
    "goal": "认识小时和分钟，理解钟面上每大格表示 5 分钟。",
    "checkIds": [
      "time-understand",
      "time-transfer"
    ]
  },
  {
    "id": "perimeter",
    "subjectId": "math",
    "title": "围一圈，边界一共多长",
    "goal": "沿图形边界走一圈，理解周长是边界的总长度。",
    "checkIds": [
      "perimeter-understand",
      "perimeter-transfer"
    ]
  },
  {
    "id": "data",
    "subjectId": "math",
    "title": "先分类记录，再看数据说了什么",
    "goal": "用统一规则分类计数，通过图表比较实际记录。",
    "checkIds": [
      "data-understand",
      "data-transfer"
    ]
  },
  {
    "id": "fraction",
    "subjectId": "math",
    "title": "不满一个，也能用数表示",
    "goal": "先确定一个整体，再用平均分理解分数。",
    "checkIds": [
      "fraction-understand",
      "fraction-transfer"
    ]
  },
  {
    "id": "equal-fractions",
    "subjectId": "math",
    "title": "分法变了，部分可以一样大",
    "goal": "在同一个整体中，看懂 1/2 与 2/4 表示相同大小。",
    "checkIds": [
      "equal-fractions-understand",
      "equal-fractions-transfer"
    ]
  },
  {
    "id": "decimal",
    "subjectId": "math",
    "title": "十分之几，换一种写法",
    "goal": "把十分之几和一位小数联系起来。",
    "checkIds": [
      "decimal-understand",
      "decimal-transfer"
    ]
  },
  {
    "id": "area",
    "subjectId": "math",
    "title": "铺满里面，需要多少小方格",
    "goal": "用面积单位铺满一个面，并理解长方形的行列计数。",
    "checkIds": [
      "area-understand",
      "area-transfer"
    ]
  },
  {
    "id": "volume",
    "subjectId": "math",
    "title": "一层一层搭，认识体积",
    "goal": "用同样大小的小正方体，理解立体占空间的大小。",
    "checkIds": [
      "volume-understand",
      "volume-transfer"
    ]
  },
  {
    "id": "multi-step",
    "subjectId": "math",
    "title": "一个大问题，分成几步想",
    "goal": "先找中间需要知道的量，再决定计算顺序。",
    "checkIds": [
      "multi-step-understand",
      "multi-step-transfer"
    ]
  },
  {
    "id": "ratio",
    "subjectId": "math",
    "title": "配方里的比，保留数量关系",
    "goal": "用同样的份理解两个数量的比，知道同时扩大才保持配方。",
    "checkIds": [
      "ratio-understand",
      "ratio-transfer"
    ]
  },
  {
    "id": "percent",
    "subjectId": "math",
    "title": "统一看成一百份，认识百分数",
    "goal": "理解百分数表示每一百份中的几份，联系分数与小数。",
    "checkIds": [
      "percent-understand",
      "percent-transfer"
    ]
  },
  {
    "id": "chance",
    "subjectId": "math",
    "title": "可能发生，不等于一定发生",
    "goal": "区分一定、不可能与可能，理解数量更多不代表每次必然出现。",
    "checkIds": [
      "chance-understand",
      "chance-transfer"
    ]
  },
  {
    "id": "strategy",
    "subjectId": "math",
    "title": "把知识连起来，解释你的方案",
    "goal": "把故事、图、算式和检查连起来，说明一个方案为什么合理。",
    "checkIds": [
      "strategy-understand",
      "strategy-transfer"
    ]
  },
  {
    "id": "chinese-listen",
    "subjectId": "chinese",
    "title": "听清一句话里的小任务",
    "goal": "听或读完一句话，找出要做什么、与什么有关。",
    "checkIds": [
      "chinese-listen-understand",
      "chinese-listen-transfer"
    ]
  },
  {
    "id": "chinese-tones",
    "subjectId": "chinese",
    "title": "声调变了，意思可能不同",
    "goal": "观察 mā、má、mǎ、mà 的声调标记，发现字音的高低变化能帮助区别意思。",
    "checkIds": [
      "chinese-tones-understand",
      "chinese-tones-transfer"
    ]
  },
  {
    "id": "chinese-pinyin",
    "subjectId": "chinese",
    "title": "拼音帮我们记下字音",
    "goal": "以 mā 为例，认识声母、韵母和声调共同提示字音。",
    "checkIds": [
      "chinese-pinyin-understand",
      "chinese-pinyin-transfer"
    ]
  },
  {
    "id": "chinese-shapes",
    "subjectId": "chinese",
    "title": "仔细看，字形里有小差别",
    "goal": "观察笔画和位置，区分日、目、木、本等形近字。",
    "checkIds": [
      "chinese-shapes-understand",
      "chinese-shapes-transfer"
    ]
  },
  {
    "id": "chinese-words",
    "subjectId": "chinese",
    "title": "词语要放在情境里理解",
    "goal": "根据动作或情境选择合适的词，不只看词语是否认识。",
    "checkIds": [
      "chinese-words-understand",
      "chinese-words-transfer"
    ]
  },
  {
    "id": "chinese-sentences",
    "subjectId": "chinese",
    "title": "把谁做什么说清楚",
    "goal": "组织一个简单句，让没有看见事情的人也知道谁在做什么。",
    "checkIds": [
      "chinese-sentences-understand",
      "chinese-sentences-transfer"
    ]
  },
  {
    "id": "chinese-evidence",
    "subjectId": "chinese",
    "title": "答案要在文字里找依据",
    "goal": "读一个短片段，从原文找到支持答案的词句。",
    "checkIds": [
      "chinese-evidence-understand",
      "chinese-evidence-transfer"
    ]
  },
  {
    "id": "chinese-order",
    "subjectId": "chinese",
    "title": "先发生什么，再发生什么",
    "goal": "借助先、接着、最后等线索，理清一个过程的顺序。",
    "checkIds": [
      "chinese-order-understand",
      "chinese-order-transfer"
    ]
  },
  {
    "id": "chinese-describe",
    "subjectId": "chinese",
    "title": "把观察到的样子说具体",
    "goal": "选择能观察到的细节描述物品，区分观察与想象。",
    "checkIds": [
      "chinese-describe-understand",
      "chinese-describe-transfer"
    ]
  },
  {
    "id": "chinese-paragraph",
    "subjectId": "chinese",
    "title": "让几句话围着一件事",
    "goal": "围绕一件事，把开头、经过和结果连成一个短段落。",
    "checkIds": [
      "chinese-paragraph-understand",
      "chinese-paragraph-transfer"
    ]
  },
  {
    "id": "chinese-main-idea",
    "subjectId": "chinese",
    "title": "许多细节共同在说什么",
    "goal": "把相关细节放在一起，概括短文主要写的一件事。",
    "checkIds": [
      "chinese-main-idea-understand",
      "chinese-main-idea-transfer"
    ]
  },
  {
    "id": "chinese-express",
    "subjectId": "chinese",
    "title": "让没在现场的人也听明白",
    "goal": "围绕一件事，交代人物、主要经过和结果，再检查别人能否听懂。",
    "checkIds": [
      "chinese-express-understand",
      "chinese-express-transfer"
    ]
  },
  {
    "id": "history-before-after",
    "subjectId": "history",
    "title": "先发生什么，后发生什么",
    "goal": "根据时间词和过程，把三件事情按先后排好。",
    "checkIds": [
      "history-before-after-understand",
      "history-before-after-transfer"
    ]
  },
  {
    "id": "history-timeline",
    "subjectId": "history",
    "title": "把久远的事情放上时间线",
    "goal": "用时间线表示先后，知道一条简图可以省略许多时期。",
    "checkIds": [
      "history-timeline-understand",
      "history-timeline-transfer"
    ]
  },
  {
    "id": "history-objects",
    "subjectId": "history",
    "title": "旧物也会留下线索",
    "goal": "认识实物、文字记录和后来想象的区别。",
    "checkIds": [
      "history-objects-understand",
      "history-objects-transfer"
    ]
  },
  {
    "id": "history-writing",
    "subjectId": "history",
    "title": "从甲骨上的字，认识记录",
    "goal": "知道甲骨文是认识商代的文字材料，并分清传说与已发现的证据。",
    "checkIds": [
      "history-writing-understand",
      "history-writing-transfer"
    ]
  },
  {
    "id": "history-farming",
    "subjectId": "history",
    "title": "一粒稻谷，带我们看古人的食物",
    "goal": "把稻谷、农具与古人种植粮食的活动联系起来。",
    "checkIds": [
      "history-farming-understand",
      "history-farming-transfer"
    ]
  },
  {
    "id": "history-settlements",
    "subjectId": "history",
    "title": "住在一起，需要怎样合作",
    "goal": "从良渚的城址和水利遗迹，理解聚落生活需要合作。",
    "checkIds": [
      "history-settlements-understand",
      "history-settlements-transfer"
    ]
  },
  {
    "id": "history-paper",
    "subjectId": "history",
    "title": "把话写下来，也要选择材料",
    "goal": "比较书写材料，并知道技术常在已有经验上改进。",
    "checkIds": [
      "history-paper-understand",
      "history-paper-transfer"
    ]
  },
  {
    "id": "history-printing",
    "subjectId": "history",
    "title": "一个个字，怎样反复组合",
    "goal": "理解活字可拆开重排的特点，而不是只背发明人的名字。",
    "checkIds": [
      "history-printing-understand",
      "history-printing-transfer"
    ]
  },
  {
    "id": "history-silk-roads",
    "subjectId": "history",
    "title": "路上交换的，不只是物品",
    "goal": "把丝绸之路理解为多条交流路线组成的网络。",
    "checkIds": [
      "history-silk-roads-understand",
      "history-silk-roads-transfer"
    ]
  },
  {
    "id": "history-canal",
    "subjectId": "history",
    "title": "一条水路，连接许多人的生活",
    "goal": "从大运河运输粮食的作用，理解交通与生活的联系。",
    "checkIds": [
      "history-canal-understand",
      "history-canal-transfer"
    ]
  },
  {
    "id": "history-change",
    "subjectId": "history",
    "title": "变了什么，又留下了什么",
    "goal": "围绕同一个问题比较过去与现在，同时找变化和延续。",
    "checkIds": [
      "history-change-understand",
      "history-change-transfer"
    ]
  },
  {
    "id": "history-explanation",
    "subjectId": "history",
    "title": "我为什么这样讲过去",
    "goal": "用“我的说法—依据—还不知道什么”讲一个简短历史解释。",
    "checkIds": [
      "history-explanation-understand",
      "history-explanation-transfer"
    ]
  },
  {
    "id": "geography-relative",
    "subjectId": "geography",
    "title": "说位置，先说在谁旁边",
    "goal": "用参照物说明位置，知道换个参照物，位置说法也会变。",
    "checkIds": [
      "geography-relative-understand",
      "geography-relative-transfer"
    ]
  },
  {
    "id": "geography-directions",
    "subjectId": "geography",
    "title": "用东南西北约定方向",
    "goal": "在明确北向的示意图上辨认东南西北。",
    "checkIds": [
      "geography-directions-understand",
      "geography-directions-transfer"
    ]
  },
  {
    "id": "geography-legend",
    "subjectId": "geography",
    "title": "图上的小符号是什么意思",
    "goal": "用图例读懂符号，并理解示意图与实际物体的区别。",
    "checkIds": [
      "geography-legend-understand",
      "geography-legend-transfer"
    ]
  },
  {
    "id": "geography-route",
    "subjectId": "geography",
    "title": "从起点走到目标，把路线说清",
    "goal": "把位置、方向和经过的地点连成一段路线。",
    "checkIds": [
      "geography-route-understand",
      "geography-route-transfer"
    ]
  },
  {
    "id": "geography-landforms",
    "subjectId": "geography",
    "title": "地面有高低，也有起伏",
    "goal": "根据整体起伏特征，初步区分山地和平原。",
    "checkIds": [
      "geography-landforms-understand",
      "geography-landforms-transfer"
    ]
  },
  {
    "id": "geography-river",
    "subjectId": "geography",
    "title": "顺着水流，连接上游和下游",
    "goal": "理解地表水通常沿地势向低处流，并用流向区分上游与下游。",
    "checkIds": [
      "geography-river-understand",
      "geography-river-transfer"
    ]
  },
  {
    "id": "geography-weather",
    "subjectId": "geography",
    "title": "记录今天的天空和冷暖",
    "goal": "用时间、地点和观察项目，描述一次天气情况。",
    "checkIds": [
      "geography-weather-understand",
      "geography-weather-transfer"
    ]
  },
  {
    "id": "geography-climate",
    "subjectId": "geography",
    "title": "看很多年的记录，才谈气候",
    "goal": "分清一天的天气与一个地区长期的气候特征。",
    "checkIds": [
      "geography-climate-understand",
      "geography-climate-transfer"
    ]
  },
  {
    "id": "geography-globe",
    "subjectId": "geography",
    "title": "从脚下的地方，认识地球",
    "goal": "知道地球整体接近球形，理解地球仪和地图是不同模型。",
    "checkIds": [
      "geography-globe-understand",
      "geography-globe-transfer"
    ]
  },
  {
    "id": "geography-ocean-land",
    "subjectId": "geography",
    "title": "海洋与陆地，共同组成家园",
    "goal": "知道地球表面海洋占比较大，并分清表面覆盖与内部组成。",
    "checkIds": [
      "geography-ocean-land-understand",
      "geography-ocean-land-transfer"
    ]
  },
  {
    "id": "geography-choices",
    "subjectId": "geography",
    "title": "选择一个地方，要一起看哪些条件",
    "goal": "综合位置、地形、水和天气信息，解释一个生活选择。",
    "checkIds": [
      "geography-choices-understand",
      "geography-choices-transfer"
    ]
  },
  {
    "id": "geography-connections",
    "subjectId": "geography",
    "title": "上游的小动作，下游也可能感受到",
    "goal": "沿着水流解释人的行为可能影响别处，并选择有依据的保护做法。",
    "checkIds": [
      "geography-connections-understand",
      "geography-connections-transfer"
    ]
  },
  {
    "id": "english-greetings",
    "subjectId": "english",
    "title": "见面与告别，先说一句",
    "goal": "把 Hello 和 Goodbye 与见面、告别的情境联系起来。",
    "checkIds": [
      "english-greetings-understand",
      "english-greetings-transfer"
    ]
  },
  {
    "id": "english-instructions",
    "subjectId": "english",
    "title": "听懂一句简单的指令",
    "goal": "把 Sit down、Stand up、Open your book 与具体动作配对。",
    "checkIds": [
      "english-instructions-understand",
      "english-instructions-transfer"
    ]
  },
  {
    "id": "english-letters",
    "subjectId": "english",
    "title": "字母有名字，也有大小写",
    "goal": "认出几组大小写字母，知道字母名称不等于它在所有单词里的发音。",
    "checkIds": [
      "english-letters-understand",
      "english-letters-transfer"
    ]
  },
  {
    "id": "english-objects",
    "subjectId": "english",
    "title": "身边物品也有英语名字",
    "goal": "把 book、bag、pen 与书、书包和笔联系起来。",
    "checkIds": [
      "english-objects-understand",
      "english-objects-transfer"
    ]
  },
  {
    "id": "english-colours",
    "subjectId": "english",
    "title": "用颜色词补充一个细节",
    "goal": "理解 red、blue、yellow，并区分物品名称和颜色信息。",
    "checkIds": [
      "english-colours-understand",
      "english-colours-transfer"
    ]
  },
  {
    "id": "english-numbers",
    "subjectId": "english",
    "title": "用数量词说有几个",
    "goal": "理解 one、two、three，并观察本课物品词在多个时加 s 的变化。",
    "checkIds": [
      "english-numbers-understand",
      "english-numbers-transfer"
    ]
  },
  {
    "id": "english-introduce",
    "subjectId": "english",
    "title": "This is…介绍眼前物品",
    "goal": "把 This is 与 a red bag 等内容连成介绍一句话。",
    "checkIds": [
      "english-introduce-understand",
      "english-introduce-transfer"
    ]
  },
  {
    "id": "english-like",
    "subjectId": "english",
    "title": "I like…表达我喜欢什么",
    "goal": "理解 I like…表达喜好，并与介绍物品的 This is…区分。",
    "checkIds": [
      "english-like-understand",
      "english-like-transfer"
    ]
  },
  {
    "id": "english-dialogue",
    "subjectId": "english",
    "title": "先听问题，再回答对应信息",
    "goal": "理解 What colour is it?，并用 It is…回应颜色问题。",
    "checkIds": [
      "english-dialogue-understand",
      "english-dialogue-transfer"
    ]
  },
  {
    "id": "english-please",
    "subjectId": "english",
    "title": "提出请求，也接住对方的回应",
    "goal": "把 Can I have…please?、Here you are.、Thank you. 放进一个礼貌交流情境。",
    "checkIds": [
      "english-please-understand",
      "english-please-transfer"
    ]
  },
  {
    "id": "english-read",
    "subjectId": "english",
    "title": "从三句话里找到确切信息",
    "goal": "读懂由熟悉词句组成的短文，从原文找到物品、颜色和数量。",
    "checkIds": [
      "english-read-understand",
      "english-read-transfer"
    ]
  },
  {
    "id": "english-share",
    "subjectId": "english",
    "title": "用学过的话完成一个小介绍",
    "goal": "根据物品和喜好的线索，组织两三句与事实相符的简单介绍。",
    "checkIds": [
      "english-share-understand",
      "english-share-transfer"
    ]
  }
];
