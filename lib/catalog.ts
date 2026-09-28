export const CURRENT_COURSE_REVISION = "2025课程包" as const;
export const LEGACY_COURSE_REVISION = "旧版课程包" as const;
export const CURRENT_PACKAGE_ID = "pep-math-g2s1-2025" as const;
export const LEGACY_PACKAGE_ID = "pep-math-g2s1-legacy" as const;
export const CURRENT_CONTENT_VERSION = "2025.1" as const;
export const LEGACY_CONTENT_VERSION = "legacy.1" as const;

export type CourseRevision =
  | typeof CURRENT_COURSE_REVISION
  | typeof LEGACY_COURSE_REVISION;
export type CoursePackageId =
  | typeof CURRENT_PACKAGE_ID
  | typeof LEGACY_PACKAGE_ID;

export type Course = {
  province: string;
  textbook: string;
  grade: string;
  semester: string;
  subject: string;
  revision: CourseRevision;
};

const BASE_COURSE = {
  province: "浙江省",
  textbook: "人教版",
  grade: "二年级",
  semester: "上册",
  subject: "数学",
} as const;

export const defaultCourse: Course = {
  ...BASE_COURSE,
  revision: CURRENT_COURSE_REVISION,
};

export const legacyCourse: Course = {
  ...BASE_COURSE,
  revision: LEGACY_COURSE_REVISION,
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
  revision: [CURRENT_COURSE_REVISION, LEGACY_COURSE_REVISION],
} satisfies Record<keyof Course, readonly string[]>;

export const courseLabels: Record<keyof Course, string> = {
  province: "省份",
  textbook: "教材",
  grade: "年级",
  semester: "学期",
  subject: "科目",
  revision: "课程版本",
};

const LEGACY_UNVERSIONED_KEY = Object.values(BASE_COURSE).join("/");

export function coursePackageId(course: Pick<Course, "revision">) {
  return course.revision === LEGACY_COURSE_REVISION
    ? LEGACY_PACKAGE_ID
    : CURRENT_PACKAGE_ID;
}

export function courseForPackageId(packageId: string): Course | null {
  if (packageId === CURRENT_PACKAGE_ID) return { ...defaultCourse };
  if (packageId === LEGACY_PACKAGE_ID) return { ...legacyCourse };
  return null;
}

export function courseKey(course: Course) {
  return [
    course.province,
    course.textbook,
    course.grade,
    course.semester,
    course.subject,
    `pkg:${coursePackageId(course)}`,
  ].join("/");
}

export function normalizeCourseKey(value: unknown) {
  if (value === LEGACY_UNVERSIONED_KEY) return courseKey(legacyCourse);
  return typeof value === "string" ? value : courseKey(legacyCourse);
}

export function courseFromKey(value: string): Course | null {
  if (value === courseKey(defaultCourse)) return { ...defaultCourse };
  if (value === courseKey(legacyCourse) || value === LEGACY_UNVERSIONED_KEY)
    return { ...legacyCourse };
  return null;
}

function hasValidBaseCourse(value: Record<string, unknown>) {
  return (Object.keys(BASE_COURSE) as (keyof typeof BASE_COURSE)[]).every(
    (key) =>
      typeof value[key] === "string" &&
      (courseOptions[key] as readonly string[]).includes(value[key] as string),
  );
}

/**
 * Old browser and cloud records did not include a revision. A valid saved course
 * without that field is deliberately kept in the legacy package so history is
 * never silently moved into the new statistics.
 */
export function normalizeCourse(value: unknown): Course {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ...defaultCourse };
  const record = value as Record<string, unknown>;
  if (!hasValidBaseCourse(record)) return { ...defaultCourse };
  const revision =
    record.revision === CURRENT_COURSE_REVISION
      ? CURRENT_COURSE_REVISION
      : LEGACY_COURSE_REVISION;
  return {
    province: record.province as string,
    textbook: record.textbook as string,
    grade: record.grade as string,
    semester: record.semester as string,
    subject: record.subject as string,
    revision,
  };
}

export function supportedCourse(course: Course) {
  return (
    course.province === BASE_COURSE.province &&
    course.textbook === BASE_COURSE.textbook &&
    course.grade === BASE_COURSE.grade &&
    course.semester === BASE_COURSE.semester &&
    course.subject === BASE_COURSE.subject &&
    (course.revision === CURRENT_COURSE_REVISION ||
      course.revision === LEGACY_COURSE_REVISION)
  );
}

export type LearningTopic = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
};

export const legacyTopics: LearningTopic[] = [
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

export const currentTopics: LearningTopic[] = [
  {
    id: "u1-classification",
    name: "分类与整理",
    description: "按标准分一分，读懂整理结果",
    color: "purple",
    icon: "shapes",
  },
  {
    id: "u2-multiplication-1-6",
    name: "1～6 的表内乘法",
    description: "从几个几认识乘法，熟练 1～6 口诀",
    color: "yellow",
    icon: "star",
  },
  {
    id: "u3-division-1-6",
    name: "1～6 的表内除法",
    description: "在平均分中认识除法，用口诀求商",
    color: "blue",
    icon: "puzzle",
  },
  {
    id: "u4-centimeter-meter",
    name: "厘米和米",
    description: "会选择单位、测量、估测和解决长度问题",
    color: "green",
    icon: "ruler",
  },
  {
    id: "u5-multiplication-division-7-9",
    name: "7～9 的表内乘除法",
    description: "联系乘除法，熟练 7～9 口诀",
    color: "yellow",
    icon: "calculator",
  },
  {
    id: "u6-review-connections",
    name: "复习与关联",
    description: "把分类、乘除法和测量连起来运用",
    color: "blue",
    icon: "eye",
  },
];

// Kept for older UI code. New UI should call topicsForCourse so a course
// package never inherits another package's learning-entry labels.
export const topics = legacyTopics;

export function topicsForCourse(course: Course) {
  return coursePackageId(course) === CURRENT_PACKAGE_ID
    ? currentTopics
    : legacyTopics;
}

export type LearningSkill = {
  id: string;
  name: string;
  unitId: string;
};

export const currentSkills: LearningSkill[] = [
  { id: "classify-by-rule", name: "按标准分类", unitId: "u1-classification" },
  {
    id: "read-classification-results",
    name: "读取分类结果",
    unitId: "u1-classification",
  },
  {
    id: "understand-multiplication",
    name: "认识乘法",
    unitId: "u2-multiplication-1-6",
  },
  {
    id: "multiplication-facts-2-6",
    name: "2～6 乘法口诀",
    unitId: "u2-multiplication-1-6",
  },
  {
    id: "multiplication-applications",
    name: "乘法应用",
    unitId: "u2-multiplication-1-6",
  },
  {
    id: "understand-division",
    name: "认识除法",
    unitId: "u3-division-1-6",
  },
  {
    id: "division-facts-1-6",
    name: "1～6 范围口诀求商",
    unitId: "u3-division-1-6",
  },
  {
    id: "division-applications",
    name: "除法应用",
    unitId: "u3-division-1-6",
  },
  {
    id: "choose-and-estimate-length",
    name: "选择单位与估测",
    unitId: "u4-centimeter-meter",
  },
  {
    id: "measure-convert-apply-length",
    name: "测量与长度应用",
    unitId: "u4-centimeter-meter",
  },
  {
    id: "facts-7-9",
    name: "7～9 乘除口诀",
    unitId: "u5-multiplication-division-7-9",
  },
  {
    id: "inverse-multiplication-division",
    name: "乘除互逆",
    unitId: "u5-multiplication-division-7-9",
  },
  {
    id: "multiplication-division-applications",
    name: "乘除法应用",
    unitId: "u5-multiplication-division-7-9",
  },
  {
    id: "connect-and-apply",
    name: "复习与关联",
    unitId: "u6-review-connections",
  },
];

const legacySkills: LearningSkill[] = legacyTopics.map((topic) => ({
  id: `legacy-skill-${topic.id}`,
  name: topic.name,
  unitId: `legacy-unit-${topic.id}`,
}));

export function skillsForCourse(course: Course) {
  return coursePackageId(course) === CURRENT_PACKAGE_ID
    ? currentSkills
    : legacySkills;
}

export type QuestionDifficulty = "foundation" | "application" | "reasoning";
export type QuestionType = "numeric" | "choice";
export type QuestionReviewStatus = "draft" | "reviewed";
export type SupportLevel = "independent" | "hint" | "guided";

export type QuestionVisual =
  | { type: "groups"; groups: number; each: number }
  | { type: "clock"; hour: number; minute: number }
  | {
      type: "classification";
      items: Array<{ label: string; category: string }>;
    }
  | { type: "ruler"; start: number; end: number; unit?: "厘米" | "米" };

export type Question = {
  id: string;
  topic: string;
  prompt: string;
  options?: string[];
  unit?: string;
  hint?: string;
  visual?: QuestionVisual;
  packageId: string;
  contentVersion: string;
  unitId: string;
  skillId: string;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  variantGroup: string;
  author: "original";
  reviewStatus: QuestionReviewStatus;
};

export type Attempt = {
  id: string;
  question_id: string;
  course_key: string;
  package_id: string;
  content_version: string;
  unit_id: string;
  skill_id: string;
  difficulty: QuestionDifficulty;
  question_type: QuestionType;
  variant_group: string;
  review_status: QuestionReviewStatus;
  support_level: SupportLevel;
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
