export type UniverseScaleId = "universe" | "galaxy" | "solar" | "earth" | "ecosystem" | "cell" | "molecule" | "atom";
export type UniverseNodeId = "universe" | "galaxy" | "sun" | "earth" | "moon" | "water" | "air" | "soil" | "plant" | "animal" | "decomposer" | "cell" | "molecule" | "atom";
export type UniverseGroup = "space" | "earth" | "life" | "matter";
export type UniverseRelationKind = "contains" | "gravity" | "energy" | "matter" | "cycle";

export type UniverseScale = {
  id: UniverseScaleId;
  label: string;
  kicker: string;
  description: string;
  detail: string;
  question: string;
  scaleNote: string;
};

export type UniverseNode = {
  id: UniverseNodeId;
  label: string;
  group: UniverseGroup;
  summary: string;
  detail: string;
  question: string;
};

export type UniverseRelation = {
  id: string;
  from: UniverseNodeId;
  to: UniverseNodeId;
  kind: UniverseRelationKind;
  label: string;
  explanation: string;
};

// These are selected changes of viewpoint, not equally spaced physical scales.
// The cell view follows a living plant; water and rocks do not consist of cells.
export const universeScales: UniverseScale[] = [
  {
    id: "universe",
    label: "宇宙",
    kicker: "把目光投向更远处",
    description: "地球、太阳和许许多多的星系，都在宇宙之中。",
    detail: "宇宙包括所有空间、时间，以及其中的物质和能量。我们能够接收到信号、观察到的部分，叫作可观测宇宙。观察有范围，不代表那个范围的外面就是一堵墙；我们还不知道整个宇宙究竟有多大。",
    question: "看得见的最远处，就是整个宇宙的边缘吗？",
    scaleNote: "星系只是示意位置，画框不是宇宙的边缘。切换层次是选取不同视角，不是连续、等比例地缩放。",
  },
  {
    id: "galaxy",
    label: "银河系",
    kicker: "找到太阳所在的星系",
    description: "太阳是银河系中的一颗恒星，银河系还有许多其他恒星。",
    detail: "银河系里有恒星，也有气体和尘埃等物质。太阳和围绕它运行的天体一起，位于银河系的一处旋臂区域，并不在银河系中心。银河系以外，还有许多别的星系。",
    question: "太阳系和银河系，哪一个包含另一个？",
    scaleNote: "旋臂和太阳的位置是结构示意。银河系到太阳系的距离跨度很大，切换时并没有按固定倍数缩小。",
  },
  {
    id: "solar",
    label: "太阳系",
    kicker: "认识地球的太空邻居",
    description: "太阳系有太阳、八颗行星，以及卫星、小行星等天体。",
    detail: "地球是绕太阳运行的一颗行星，月球是地球的天然卫星。引力和天体原有的运动共同影响它们的轨道。太阳能够自己发光，地球和月球主要靠反射太阳光让我们看见。",
    question: "太阳、地球和月球，谁能像恒星那样自己发光？",
    scaleNote: "图中的大小、间距和轨道都是示意，并未使用同一个比例；进入地球视角也不是一次等比例缩放。",
  },
  {
    id: "earth",
    label: "地球",
    kicker: "从我们熟悉的家园出发",
    description: "我们生活的地球，有陆地、水、空气和许多生命。",
    detail: "地球是一颗行星。海水、河水和雨水是水的不同去处，包围地球的大气中有多种气体。向外看，我们能认识地球在太阳系中的位置；向身边看，可以研究一片树林里的生命怎样与水、空气和土壤相联系。",
    question: "今天身边的哪一样东西，能带你开始探索地球？",
    scaleNote: "地球图展示整体特征。下一层选择一片树林作例子，不是把整个地球按固定倍数放大。",
  },
  {
    id: "ecosystem",
    label: "身边的生态系统",
    kicker: "看看一片树林里的联系",
    description: "树林里的植物、动物、微生物，与水、空气和土壤相互影响。",
    detail: "一片树林可以作为一个生态系统来研究。绿色植物利用阳光制造养分，动物从食物中取得物质和能量，有些细菌和真菌会分解枯叶与遗体。物质可以被再次利用，能量在传递和利用中会逐步以热散开。",
    question: "落叶不见了，其中的物质就从世界上消失了吗？",
    scaleNote: "生态系统可以大也可以小，这里只选一片树林。下一层观察植物的一部分；水、空气和岩石都不是由细胞组成的。",
  },
  {
    id: "cell",
    label: "细胞",
    kicker: "走进一片叶子的内部",
    description: "植物和动物的身体由细胞组成，很多细胞要借助显微镜才能看清。",
    detail: "这里观察的是一个植物细胞的简化模型。细胞会从周围取得物质，在内部进行维持生命的活动；绿色叶片的许多细胞里还有进行光合作用的叶绿体。动物细胞和细菌的结构与它并不完全相同。",
    question: "一片叶子有细胞，一杯清水也有自己的细胞吗？",
    scaleNote: "颜色与部件大小是帮助认识结构的示意。细胞是生命的基本单位，不是万物共同的一层；接着只选其中的水分子来观察。",
  },
  {
    id: "molecule",
    label: "分子",
    kicker: "从一滴水认识微小的组成",
    description: "一个水分子由两个氢原子和一个氧原子结合而成。",
    detail: "分子由两个或更多原子结合而成，不同的结合可以形成不同的物质。一滴水里有极多的水分子，水变成水蒸气时，水分子仍然是水分子。许多物质由分子组成，但金属等物质并不是一颗颗独立分子排成的。",
    question: "水蒸发以后，水分子会自动拆成氢原子和氧原子吗？",
    scaleNote: "彩色圆球只是水分子的模型，不是放大的照片。分子大小各不相同，进入原子层也不是按固定倍数放大。",
  },
  {
    id: "atom",
    label: "原子",
    kicker: "继续追问物质由什么组成",
    description: "原子有很小的原子核和电子，原子也有内部结构。",
    detail: "氢原子和氧原子是不同种类的原子。电子并不像行星沿着画好的轨道绕太阳走；电子云用来表示在不同地方找到电子的可能性。原子不是最后一层，科学家还会继续研究原子核和更小的粒子。",
    question: "原子的示意图，能照搬太阳系的行星轨道吗？",
    scaleNote: "这里的电子云是概率示意，不是真实云朵，也不是电子的固定路线。原子核与电子云未按真实大小比例绘制。",
  },
];

export const universeNodes: UniverseNode[] = [
  {
    id: "universe",
    label: "宇宙",
    group: "space",
    summary: "地球与所有星系所在的整体。",
    detail: "宇宙包括所有空间、时间以及其中的物质和能量。地球就在宇宙中，我们不需要离开地球才算进入宇宙。可观测宇宙是我们能够观察到的部分，不等于已经找到了整个宇宙的边缘。",
    question: "此刻坐在家里的你，在不在宇宙中？",
  },
  {
    id: "galaxy",
    label: "银河系",
    group: "space",
    summary: "拥有许多恒星的星系，太阳就在其中。",
    detail: "太阳只是银河系众多恒星中的一颗，太阳系也属于银河系。银河系还有气体和尘埃等物质，它本身又是宇宙里许多星系中的一个。太阳系、银河系和宇宙，表示的范围并不相同。",
    question: "在太空地址上，太阳系的上一层可以写什么？",
  },
  {
    id: "sun",
    label: "太阳",
    group: "space",
    summary: "离地球最近的恒星，也是地球重要的能量来源。",
    detail: "太阳核心里的核聚变，把氢原子核结合成氦原子核，并释放能量。能量最终以光等形式向外传播。来到地球的阳光能加热地面和水，也能被绿色植物用于光合作用。",
    question: "一片叶子、一只兔子，与太阳有什么联系？",
  },
  {
    id: "earth",
    label: "地球",
    group: "space",
    summary: "绕太阳运行、承载我们生活的行星。",
    detail: "地球有岩石、水和包围它的大气，这些环境与生命不断相互影响。地球和太阳之间有引力，地球也在运动，二者共同影响地球的轨道。关系图中的引力箭头选了一个讲述方向，引力本身是相互的。",
    question: "地球与太阳的联系，只有谁大谁小这一种吗？",
  },
  {
    id: "moon",
    label: "月球",
    group: "space",
    summary: "地球的天然卫星，靠反射太阳光显得明亮。",
    detail: "月球绕地球运行，地球与月球也相互吸引。我们看见月球明亮的部分，是受到太阳照亮的地方。平常的月相变化不是地球影子挡住月球；月食才涉及地球的影子。",
    question: "明亮的月球，是像太阳一样自己发光吗？",
  },
  {
    id: "water",
    label: "水",
    group: "earth",
    summary: "能以冰、液态水和水蒸气等状态存在。",
    detail: "水能在地面、空气和地下等地方流动与转变状态。液态水蒸发成为水蒸气，水蒸气遇到合适条件会凝结；云里的小水滴或冰晶还能形成降水。普通的这些变化，并不会把水分子拆成氢和氧。",
    question: "雨后水洼变小了，水可能去了哪里？",
  },
  {
    id: "air",
    label: "空气",
    group: "earth",
    summary: "多种气体的混合物，并不只有氧气。",
    detail: "地球空气中最多的是氮气，其次是氧气，还有少量二氧化碳等气体，以及含量会变化的水蒸气。动物呼吸需要氧气，绿色植物进行光合作用时会使用二氧化碳。看不见的空气也是真实的物质。",
    question: "一口空气里面，是不是只有氧气？",
  },
  {
    id: "soil",
    label: "岩石与土壤",
    group: "earth",
    summary: "土壤里有矿物颗粒，也有水、空气和生命。",
    detail: "岩石风化能提供形成土壤的矿物颗粒，但土壤不只是磨碎的石头。它还包含水、空气、有机物和生物。植物的根通常从土壤取得水和溶解的矿物质，植物制造糖所需的碳主要来自空气中的二氧化碳。",
    question: "一棵小树长大，增加的身体全是从土里吃来的吗？",
  },
  {
    id: "plant",
    label: "植物",
    group: "life",
    summary: "以树木和青草为例，认识能利用阳光制造养分的生命。",
    detail: "树木、青草等绿色植物能利用光能，把水和二氧化碳变成糖等有机物，并释放氧气。这叫光合作用。植物也会呼吸；它们需要水和矿物质，却不是只靠吃土长大。这里用常见绿色植物作例子，并非所有植物的生活方式都一样。",
    question: "植物长大需要的阳光、水和二氧化碳，各从哪里来？",
  },
  {
    id: "animal",
    label: "动物",
    group: "life",
    summary: "从食物中取得物质和能量，人也属于动物。",
    detail: "兔子吃草，猫头鹰会捕食其他动物，不同动物取得食物的方式不同。食物中的物质帮助它们生长，能量支持运动等活动。这里的植物到动物箭头，用吃植物的动物作例子，不表示每种动物都直接吃植物。",
    question: "不直接吃草的动物，仍可能与植物的能量有联系吗？",
  },
  {
    id: "decomposer",
    label: "分解者",
    group: "life",
    summary: "有些细菌和真菌会分解枯叶、遗体等有机物。",
    detail: "分解者能从有机物中取得物质和能量，并把一些物质变成可被环境和其他生物再次利用的形式。比如落叶中的部分营养元素可以返回土壤。分解者是在生态系统中的一种作用，不是说所有细菌或所有真菌都做同样的事。",
    question: "枯叶中的物质，怎样再次参与一棵小树的生长？",
  },
  {
    id: "cell",
    label: "细胞",
    group: "life",
    summary: "生命的基本单位，植物和动物都由细胞组成。",
    detail: "一棵树和一只猫的身体里都有许多细胞，有的微生物只有一个细胞。细胞内部有水和许多其他物质，但细胞不等于一个水分子。水、空气和岩石不是由细胞组成的；植物细胞也不能代表所有细胞的结构。",
    question: "细胞里面有水，能不能反过来说一滴纯水由细胞组成？",
  },
  {
    id: "molecule",
    label: "分子",
    group: "matter",
    summary: "由原子结合而成，水分子是一个熟悉的例子。",
    detail: "一个水分子里有两个氢原子和一个氧原子，糖也有自己的分子。细胞里面有许多分子，细胞外面的水中同样有水分子。分子不是生命专有的；金属和许多晶体也不能用一颗颗独立分子来描述。",
    question: "同样的水分子，能出现在树叶里，也能出现在雨里吗？",
  },
  {
    id: "atom",
    label: "原子",
    group: "matter",
    summary: "有原子核和电子，是认识普通物质的重要一步。",
    detail: "氢、氧、碳等元素有各自的原子。原子有内部结构，电子云描述找到电子的可能性，不是小行星轨道。氢和大部分氦在宇宙早期形成，碳、氧等许多元素与恒星及其演化有关；不能把所有元素都说成由恒星制造。",
    question: "组成身体的原子，为什么也能连起我们和宇宙的故事？",
  },
];

// Each arrow has one teaching purpose. In particular, energy transfer does not
// become an energy cycle merely because matter can return to soil, air or water.
export const universeRelations: UniverseRelation[] = [
  {
    id: "universe-contains-galaxy",
    from: "universe", to: "galaxy", kind: "contains", label: "包含许多星系，其中有",
    explanation: "银河系是宇宙中的一个星系。这里讲谁属于哪个更大的范围，不是在讲能量传递。",
  },
  {
    id: "galaxy-contains-sun",
    from: "galaxy", to: "sun", kind: "contains", label: "包含的一颗恒星是",
    explanation: "太阳和整个太阳系都位于银河系中。太阳不是银河系中心，也不是银河系唯一的恒星。",
  },
  {
    id: "sun-gravity-earth",
    from: "sun", to: "earth", kind: "gravity", label: "通过引力影响轨道",
    explanation: "太阳与地球相互吸引。引力加上地球原有的运动，使地球沿轨道运行；箭头选了讲述方向，不表示地球不会吸引太阳。",
  },
  {
    id: "earth-gravity-moon",
    from: "earth", to: "moon", kind: "gravity", label: "通过引力影响轨道",
    explanation: "地球和月球相互吸引，月球在运动中绕地球运行。月球是地球的卫星，并不是装在地球内部。",
  },
  {
    id: "sun-energy-earth",
    from: "sun", to: "earth", kind: "energy", label: "把光能传到",
    explanation: "太阳发出的光有一部分到达地球，能加热地面和水。这是能量从一个地方传到另一个地方。",
  },
  {
    id: "sun-energy-plant",
    from: "sun", to: "plant", kind: "energy", label: "为光合作用提供光能",
    explanation: "树木和青草利用光能，把水和二氧化碳变成糖等有机物，光能的一部分成为有机物中储存的化学能。阳光提供能量，水和二氧化碳提供原料。",
  },
  {
    id: "plant-energy-animal",
    from: "plant", to: "animal", kind: "energy", label: "被吃时把食物中的能量传给",
    explanation: "兔子吃草时，能从草的有机物中取得能量，用于生长和运动。这条箭头以吃植物的动物为例，其他动物可能通过捕食间接取得这部分能量。",
  },
  {
    id: "animal-energy-decomposer",
    from: "animal", to: "decomposer", kind: "energy", label: "遗体等有机物中的能量传给",
    explanation: "有些细菌和真菌分解动物遗体或排泄物，从中取得能量。能量在生物利用的过程中逐步以热散开，不会像营养物质那样沿土壤路线循环回来。",
  },
  {
    id: "earth-contains-water",
    from: "earth", to: "water", kind: "contains", label: "有海洋、河流等形式的",
    explanation: "地球上的水不只在海里，也在河流、冰川、地下和空气等地方。这里讲地球有哪些组成部分。",
  },
  {
    id: "earth-contains-air",
    from: "earth", to: "air", kind: "contains", label: "周围有大气，其中是",
    explanation: "地球的大气包围着地表，空气是其中多种气体的混合物。我们呼吸的空气也是地球环境的一部分。",
  },
  {
    id: "earth-contains-soil",
    from: "earth", to: "soil", kind: "contains", label: "固体部分有",
    explanation: "岩石构成地球固体部分的重要组成，部分陆地表面覆盖着土壤。土壤不仅有岩石风化来的矿物颗粒，还有水、空气、有机物和生物。",
  },
  {
    id: "water-matter-plant",
    from: "water", to: "plant", kind: "matter", label: "作为原料和生命活动用水进入",
    explanation: "植物吸收水，水能参与光合作用，也帮助运输物质和维持细胞状态。这里移动的是物质，不能把水和阳光的作用混为一谈。",
  },
  {
    id: "air-matter-plant",
    from: "air", to: "plant", kind: "matter", label: "其中的二氧化碳进入",
    explanation: "绿色植物光合作用需要的二氧化碳来自空气。其中的碳能进入植物制造的糖，成为植物身体的一部分。",
  },
  {
    id: "soil-matter-plant",
    from: "soil", to: "plant", kind: "matter", label: "提供水和溶解的矿物质给",
    explanation: "根通常从土壤中吸收水和溶解的矿物质。树长大所需的物质并不全是土壤提供的，空气中的二氧化碳也很重要。",
  },
  {
    id: "plant-cycle-air",
    from: "plant", to: "air", kind: "cycle", label: "光合作用释放氧气到",
    explanation: "绿色植物光合作用时能释放氧气，氧气进入空气后可被许多生物呼吸利用。植物自己也会呼吸，不能说植物只吸二氧化碳、从不使用氧气。",
  },
  {
    id: "animal-cycle-air",
    from: "animal", to: "air", kind: "cycle", label: "呼吸把二氧化碳返回",
    explanation: "动物呼吸取得氧气，身体利用食物释放能量时会产生二氧化碳。返回空气的二氧化碳又可参与植物的光合作用，这是物质循环中的一步。",
  },
  {
    id: "plant-matter-decomposer",
    from: "plant", to: "decomposer", kind: "matter", label: "枯叶等有机物供给",
    explanation: "枯叶和枯枝中的有机物可被分解者分解。这条线追踪物质去了哪里；分解者在这个过程中也会取得能量。",
  },
  {
    id: "decomposer-cycle-soil",
    from: "decomposer", to: "soil", kind: "cycle", label: "把部分营养物质返回",
    explanation: "分解过程中，一些有机物里的营养元素变成可再次利用的形式，留在土壤或土壤水中，之后可能被植物吸收。这不是把能量也送回植物重新循环。",
  },
  {
    id: "water-cycle-air",
    from: "water", to: "air", kind: "cycle", label: "蒸发为水蒸气进入",
    explanation: "水洼、湖泊和海洋中的部分水能蒸发，成为空气里的水蒸气。水蒸气看不见，蒸发时水分子仍是水分子。",
  },
  {
    id: "air-cycle-water",
    from: "air", to: "water", kind: "cycle", label: "水蒸气凝结并形成降水返回",
    explanation: "空气中的水蒸气在合适条件下凝结成小水滴，也可形成冰晶；云中的水形成雨、雪等降水，返回地表。不是整团空气都变成了水。",
  },
  {
    id: "plant-contains-cell",
    from: "plant", to: "cell", kind: "contains", label: "身体的基本单位是",
    explanation: "树叶、树根和树干中都有细胞。这里从整个植物看它的组成，并不表示植物旁边的水和石头也由细胞组成。",
  },
  {
    id: "animal-contains-cell",
    from: "animal", to: "cell", kind: "contains", label: "身体的基本单位是",
    explanation: "动物的肌肉、皮肤等部位都由细胞组成。动物细胞与植物细胞有相同点，也有结构上的差别。",
  },
  {
    id: "cell-contains-molecule",
    from: "cell", to: "molecule", kind: "contains", label: "内部含有许多种",
    explanation: "细胞里有水分子，也有糖、蛋白质等物质的分子。许多分子参与细胞的生命活动，一个细胞并不等于一个分子。",
  },
  {
    id: "water-contains-molecule",
    from: "water", to: "molecule", kind: "contains", label: "由许许多多水分子组成",
    explanation: "一滴水中有极多的水分子。水分子既能在细胞里，也能在没有细胞的纯水中；认识分子不一定要先经过细胞。",
  },
  {
    id: "molecule-contains-atom",
    from: "molecule", to: "atom", kind: "contains", label: "由相互结合的原子组成",
    explanation: "水分子由两个氢原子和一个氧原子结合而成。原子的种类、数量和结合方式会影响形成的物质，但并非所有物质都由独立分子组成。",
  },
];

// Primary references support the facts; the Chinese teaching text is original.
export const universeSources: { title: string; url: string }[] = [
  { title: "NASA：宇宙与可观测宇宙术语", url: "https://science.nasa.gov/universe/glossary/" },
  { title: "ESA 儿童科学：宇宙的范围", url: "https://www.esa.int/kids/en/learn/Our_Universe/Story_of_the_Universe/The_Universe" },
  { title: "NASA：太阳系与银河系", url: "https://science.nasa.gov/solar-system/solar-system-facts/" },
  { title: "NASA：太阳与核聚变", url: "https://science.nasa.gov/sun/facts/" },
  { title: "NASA：地球与大气", url: "https://science.nasa.gov/earth/facts/" },
  { title: "NASA：月球与月相", url: "https://science.nasa.gov/moon/facts/" },
  { title: "USGS：地球上的水循环", url: "https://www.usgs.gov/faqs/what-earths-water-cycle" },
  { title: "USGS：水分子的原子组成", url: "https://www.usgs.gov/media/images/water-isotopes-diagram" },
  { title: "美国能源部：植物利用空气中的二氧化碳生长", url: "https://www.energy.gov/science/bes/articles/growth-and-repair-carbon-dioxide-air" },
  { title: "NOAA：食物网与分解者", url: "https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs" },
  { title: "NOAA：能量变化与物质循环", url: "https://sos.noaa.gov/catalog/datasets/energy-planet/" },
  { title: "USDA：土壤由什么组成", url: "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/what-is-soil" },
  { title: "NIH：细胞、分子与原子术语", url: "https://nigms.nih.gov/education/glossary" },
  { title: "美国化学会：用粒子模型认识物质", url: "https://www.acs.org/education/resources/k-8/inquiryinaction/fifth-grade/chapter-1-investigating-matter-at-the-particle-level/matter-is-made-of-tiny-particles.html" },
  { title: "美国能源部：原子结构与电子云模型（PDF）", url: "https://www.energy.gov/documents/doe-hdbk-1122-99studyguidemodule103pdf" },
  { title: "NASA：从宇宙早期到恒星，元素的不同来源", url: "https://science.nasa.gov/universe/stars/neutron-stars/magnetars/where-does-gold-come-from-nasa-data-has-clues/" },
];
