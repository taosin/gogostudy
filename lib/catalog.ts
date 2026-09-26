export type Course = {
  province: string;
  textbook: string;
  grade: string;
  semester: string;
  subject: string;
};
export const defaultCourse: Course = {
  province: "浙江省",
  textbook: "人教版",
  grade: "二年级",
  semester: "上册",
  subject: "数学",
};
export const courseOptions = {
  province: [
    "浙江省",
    "江苏省",
    "上海市",
    "安徽省",
    "福建省",
    "江西省",
    "山东省",
    "北京市",
    "天津市",
    "河北省",
    "山西省",
    "内蒙古自治区",
    "辽宁省",
    "吉林省",
    "黑龙江省",
    "河南省",
    "湖北省",
    "湖南省",
    "广东省",
    "广西壮族自治区",
    "海南省",
    "重庆市",
    "四川省",
    "贵州省",
    "云南省",
    "西藏自治区",
    "陕西省",
    "甘肃省",
    "青海省",
    "宁夏回族自治区",
    "新疆维吾尔自治区",
    "香港特别行政区",
    "澳门特别行政区",
    "台湾省",
  ],
  textbook: ["人教版", "北师大版", "苏教版", "统编版"],
  grade: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  semester: ["上册", "下册"],
  subject: ["数学", "语文"],
};
export const courseLabels: Record<keyof Course, string> = {
  province: "省份",
  textbook: "教材",
  grade: "年级",
  semester: "学期",
  subject: "科目",
};
export function courseKey(c: Course) {
  return [c.province, c.textbook, c.grade, c.semester, c.subject].join("/");
}
export function supportedCourse(c: Course) {
  return courseKey(c) === courseKey(defaultCourse);
}
export const topics = [
  {
    id: "addition",
    name: "100以内的加减法",
    description: "把数字拆一拆，计算更轻松",
    color: "blue",
    icon: "calculator",
  },
  {
    id: "multiplication",
    name: "表内乘法",
    description: "发现几个几的秘密",
    color: "yellow",
    icon: "star",
  },
  {
    id: "length",
    name: "长度与测量",
    description: "用厘米和米认识身边的世界",
    color: "green",
    icon: "ruler",
  },
  {
    id: "angles",
    name: "角的初步认识",
    description: "找一找，哪些角是直角",
    color: "purple",
    icon: "shapes",
  },
  {
    id: "observation",
    name: "观察物体",
    description: "换一个方向，看见新发现",
    color: "green",
    icon: "eye",
  },
  {
    id: "time",
    name: "认识时间",
    description: "和时针、分针交朋友",
    color: "blue",
    icon: "clock",
  },
  {
    id: "reasoning",
    name: "搭配与思考",
    description: "有序思考，让答案不遗漏",
    color: "yellow",
    icon: "puzzle",
  },
];
export type Question = {
  id: string;
  topic: string;
  prompt: string;
  options?: string[];
  unit?: string;
  hint: string;
  visual?:
    | { type: "groups"; groups: number; each: number }
    | { type: "clock"; hour: number; minute: number };
};
export type Attempt = {
  id: string;
  question_id: string;
  course_key: string;
  answer: string;
  correct: boolean;
  mode: "practice" | "correction" | "review";
  reason: string;
  created_at: string;
  question: Question;
  expected: string;
  explanation: string;
};
export type Reflection = {
  id: string;
  body: string;
  created_at: string;
  course_key: string;
};
export type StudyState = {
  attempts: Attempt[];
  reflections: Reflection[];
  course: Course;
};
export const emptyState = (): StudyState => ({
  attempts: [],
  reflections: [],
  course: { ...defaultCourse },
});
