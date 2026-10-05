import type { SubjectId } from "./learning-types";
import { worldLessonIndex } from "./world-lesson-index";

export type WorldPlaceId = SubjectId | "universe";
export type WorldDestination = { id: string; placeId: WorldPlaceId; title: string; href: string };
export type WorldPlace = { id: WorldPlaceId; name: string; subjectId?: SubjectId; eyebrow: string; description: string; question: string; destinationId: string; color: string; soft: string; symbol: string };
export type WorldTrailStop = { id: string; destinationId: string; question: string; connection: string };
export type WorldTrail = { id: string; title: string; description: string; question: string; stops: WorldTrailStop[] };
export type WorldQuestion = { id: string; question: string; destinationId: string };

export const worldPlaces: WorldPlace[] = [
  { id: "math", subjectId: "math", name: "数字工坊", eyebrow: "数一数 · 拼一拼", description: "拿起积木，发现数量、形状和规律。", question: "怎样知道自己有没有数漏？", destinationId: "math:count", color: "#39745b", soft: "#e8f1df", symbol: "＋" },
  { id: "chinese", subjectId: "chinese", name: "故事森林", eyebrow: "听故事 · 说发现", description: "听懂别人的话，把自己的发现讲清楚。", question: "一句话里，藏着几个小任务？", destinationId: "chinese:chinese-listen", color: "#a65f42", soft: "#f8ebde", symbol: "文" },
  { id: "history", subjectId: "history", name: "时光博物馆", eyebrow: "看旧物 · 找线索", description: "沿着时间和证据，看看人们怎样生活。", question: "过去发生的事情，怎样排出先后？", destinationId: "history:history-before-after", color: "#8c7040", soft: "#f5eed8", symbol: "古" },
  { id: "geography", subjectId: "geography", name: "大地山谷", eyebrow: "认方向 · 读地图", description: "从身边的位置出发，认识山河与家园。", question: "说在左边时，是站在谁的位置看？", destinationId: "geography:geography-relative", color: "#427985", soft: "#e4f0f1", symbol: "地" },
  { id: "english", subjectId: "english", name: "英语港湾", eyebrow: "打招呼 · 交朋友", description: "用另一种语言，认识新朋友和身边事物。", question: "见面和告别，要说同一句话吗？", destinationId: "english:english-greetings", color: "#79619a", soft: "#eeebf5", symbol: "Aa" },
  { id: "universe", name: "星空观测站", eyebrow: "看宇宙 · 做实验", description: "从脚下的地球到一滴水，发现万物的联系。", question: "脚下的地球，和天上的太阳有什么联系？", destinationId: "universe:scale:earth", color: "#416884", soft: "#e5edf5", symbol: "✦" },
];

const universeViews = {
  scale: [["universe", "宇宙"], ["galaxy", "银河系"], ["solar", "太阳系"], ["earth", "我们的地球"], ["ecosystem", "身边的生态系统"], ["cell", "植物细胞"], ["molecule", "水分子"], ["atom", "原子"]],
  relations: [["universe", "宇宙"], ["galaxy", "银河系"], ["sun", "太阳"], ["earth", "地球"], ["moon", "月球"], ["water", "水"], ["air", "空气"], ["soil", "土壤"], ["plant", "植物"], ["animal", "动物"], ["decomposer", "分解者"], ["cell", "细胞"], ["molecule", "分子"], ["atom", "原子"]],
  lab: [["day-night", "昼夜小实验"], ["orbit", "行星公转小实验"], ["water-cycle", "水循环小实验"]],
} as const;

export const worldDestinations: WorldDestination[] = [
  ...worldLessonIndex.map((lesson) => ({ id: `${lesson.subjectId}:${lesson.id}`, placeId: lesson.subjectId, title: lesson.title, href: `/knowledge/${lesson.subjectId}#${lesson.id}` })),
  ...Object.entries(universeViews).flatMap(([view, targets]) => targets.map(([id, title]) => ({ id: `universe:${view}:${id}`, placeId: "universe" as const, title: view === "relations" ? `${title}与万物的联系` : title, href: `/knowledge/universe#${view}-${id}` }))),
];

export const worldTrails: WorldTrail[] = [
  { id: "first-journey", title: "出发，认识新朋友", description: "先找到自己的位置，再听懂任务、问好、清点物品。从四门学科的第一课开始。", question: "怎样和新朋友一起开始一场探索？", stops: [
    { id: "find", destinationId: "geography:geography-relative", question: "怎样告诉朋友，我站在哪里？", connection: "先约定参照物，说清你在哪里，朋友才容易找到你。" },
    { id: "listen", destinationId: "chinese:chinese-listen", question: "朋友说的话里，有哪些小任务？", connection: "找到朋友后，认真听清谁要做什么，一起准备出发。" },
    { id: "hello", destinationId: "english:english-greetings", question: "遇见说英语的朋友，怎样问好？", connection: "听清情境，就能选择合适的问候；见面和告别并不一样。" },
    { id: "count", destinationId: "math:count", question: "带给朋友的东西，怎样不重不漏地数清？", connection: "一边指一边数，清点好物品，把一次小合作做完整。" },
  ] },
  { id: "water-trip", title: "追着一滴水去旅行", description: "从地球的水出发，做水循环实验，再认识河流、描述观察。后两站可先回课堂补一补基础。", question: "一滴水的旅行，会把哪些地方连起来？", stops: [
    { id: "earth", destinationId: "universe:scale:earth", question: "我们生活的地球上，哪里能找到水？", connection: "先看我们共同的家园，认识陆地、海洋和空气。" },
    { id: "cycle", destinationId: "universe:lab:water-cycle", question: "水怎样从地面到天空，又回到地面？", connection: "试着改变观察的阶段，看看一条可能的水循环路线。" },
    { id: "river", destinationId: "geography:geography-river", question: "落到地面的水，会把上游和下游怎样连起来？", connection: "把实验放回真实地面，观察水流与地势的联系。遇到陌生词，先看看本课的基础提示。" },
    { id: "describe", destinationId: "chinese:chinese-describe", question: "怎样把观察到的样子，说给没看见的人听？", connection: "在课堂里练习描述的方法，再试着描述刚才看到的水循环。" },
  ] },
  { id: "time-letter", title: "给未来留一条线索", description: "排出事情先后，观察留下的物品，再练习从文字中找依据。遇到新概念，可以沿课堂提示回到基础。", question: "未来的人，能从我们留下的东西知道什么？", stops: [
    { id: "before", destinationId: "history:history-before-after", question: "我的一天里，什么先发生，什么后发生？", connection: "时间顺序，是理解过去的第一条线索。" },
    { id: "objects", destinationId: "history:history-objects", question: "一件留下来的旧物，能告诉我们什么？", connection: "观察物品的材料和形状，分清看见的证据与自己的猜想。" },
    { id: "evidence", destinationId: "chinese:chinese-evidence", question: "读到一句话时，怎样找到支持答案的线索？", connection: "物品能留下线索，文字也能。练习用文中的话支持自己的理解。" },
  ] },
];

const universeQuestions: Record<string, string> = {
  "scale:universe": "看得见的最远处，就是整个宇宙的边缘吗？",
  "scale:galaxy": "太阳系和银河系，哪一个包含另一个？",
  "scale:solar": "太阳、地球和月球，谁能像恒星那样自己发光？",
  "scale:earth": "今天身边的哪一样东西，能带你开始探索地球？",
  "scale:ecosystem": "落叶不见了，其中的物质就从世界上消失了吗？",
  "scale:cell": "一片叶子有细胞，一杯清水也有自己的细胞吗？",
  "scale:molecule": "水蒸发以后，水分子会自动拆成氢原子和氧原子吗？",
  "scale:atom": "原子的示意图，能照搬太阳系的行星轨道吗？",
  "relations:universe": "此刻坐在家里的你，在不在宇宙中？",
  "relations:galaxy": "在太空地址上，太阳系的上一层可以写什么？",
  "relations:sun": "一片叶子、一只兔子，与太阳有什么联系？",
  "relations:earth": "地球与太阳的联系，只有谁大谁小这一种吗？",
  "relations:moon": "明亮的月球，是像太阳一样自己发光吗？",
  "relations:water": "雨后水洼变小了，水可能去了哪里？",
  "relations:air": "一口空气里面，是不是只有氧气？",
  "relations:soil": "一棵小树长大，增加的身体全是从土里吃来的吗？",
  "relations:plant": "植物长大需要的阳光、水和二氧化碳，各从哪里来？",
  "relations:animal": "不直接吃草的动物，仍可能与植物的能量有联系吗？",
  "relations:decomposer": "枯叶中的物质，怎样再次参与一棵小树的生长？",
  "relations:cell": "细胞里面有水，能不能反过来说一滴纯水由细胞组成？",
  "relations:molecule": "同样的水分子，能出现在树叶里，也能出现在雨里吗？",
  "relations:atom": "组成身体的原子，为什么也能连起我们和宇宙的故事？",
  "lab:day-night": "一个地方从朝向太阳转到背向太阳，会发生什么？",
  "lab:orbit": "同样经过一个地球年，地球和火星都转完一圈了吗？",
  "lab:water-cycle": "看不见的水蒸气，怎样参与形成看得见的云？",
};

export const worldQuestions: WorldQuestion[] = [
  ...worldPlaces.map((place) => ({ id: `place:${place.id}`, question: place.question, destinationId: place.destinationId })),
  ...worldTrails.flatMap((trail) => trail.stops.map((stop) => ({ id: `trail:${trail.id}:${stop.id}`, question: stop.question, destinationId: stop.destinationId }))),
  ...worldLessonIndex.map((lesson) => ({ id: `destination:${lesson.subjectId}:${lesson.id}`, question: `我想弄明白：${lesson.goal}`, destinationId: `${lesson.subjectId}:${lesson.id}` })),
  ...Object.entries(universeQuestions).map(([id, question]) => ({ id: `destination:universe:${id}`, question, destinationId: `universe:${id}` })),
];

const destinationsById = new Map(worldDestinations.map((item) => [item.id, item]));
export function getWorldDestination(id: string | null | undefined): WorldDestination | undefined { return id ? destinationsById.get(id) : undefined; }
export function getWorldPlace(id: string | null | undefined): WorldPlace | undefined { return worldPlaces.find((item) => item.id === id); }
export function getWorldTrail(id: string | null | undefined): WorldTrail | undefined { return worldTrails.find((item) => item.id === id); }
export function getWorldQuestion(id: string): WorldQuestion | undefined { return worldQuestions.find((item) => item.id === id); }
export function getTrailStop(trailId: string | null | undefined, destinationId: string): WorldTrailStop | undefined { return getWorldTrail(trailId)?.stops.find((item) => item.destinationId === destinationId); }

export function getWorldDestinationHref(destinationId: string | null | undefined, trailId?: string | null): string {
  const destination = getWorldDestination(destinationId);
  if (!destination) return "/";
  const stop = getTrailStop(trailId, destination.id);
  if (!stop || !trailId) return destination.href;
  const [pathname, hash] = destination.href.split("#");
  const query = new URLSearchParams({ trail: trailId, stop: stop.id });
  return `${pathname}?${query.toString()}${hash ? `#${hash}` : ""}`;
}

export function worldStopHref(trailId: string, stopId: string): string {
  const stop = getWorldTrail(trailId)?.stops.find((item) => item.id === stopId);
  return stop ? getWorldDestinationHref(stop.destinationId, trailId) : "/";
}
