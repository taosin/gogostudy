import type { WorldPlaceId } from "./world-content";

export type WorldChallenge = {
  id: string;
  placeId: WorldPlaceId;
  destinationId: string;
  title: string;
  duration: string;
  materials: string[];
  steps: string[];
  prompts: string[];
  connectionDestinationId: string;
  connectionReason: string;
};

// These are invitations to observe and explain. Opening a card or writing a note
// never records a completed lesson or an independently checked answer.
export const worldChallenges: WorldChallenge[] = [
  {
    id: "count-my-blocks",
    placeId: "math",
    destinationId: "math:count",
    title: "积木换了位置，数量呢？",
    duration: "2–3 分钟",
    materials: ["5 块积木，或 5 支彩笔"],
    steps: [
      "把这 5 件东西排成一行。一边指，一边数，每件只数一次。",
      "只换摆法，不拿走也不添东西。先猜一猜，再数一次。",
      "把两次看到的结果说给家人听：什么变了，什么没变？",
    ],
    prompts: ["我换了一种摆法，发现……", "为了不数漏，我……"],
    connectionDestinationId: "chinese:chinese-describe",
    connectionReason: "把摆法说具体，没在旁边的人也能想象你看到的样子。",
  },
  {
    id: "listen-two-steps",
    placeId: "chinese",
    destinationId: "chinese:chinese-listen",
    title: "听清一个小请求",
    duration: "2–3 分钟",
    materials: ["一本书", "一个笔盒", "可以一起玩的家人"],
    steps: [
      "请家人说一个两步小请求，比如：先把书放好，再把笔盒放在书旁。",
      "先用自己的话说一遍，再动手。没听清的地方，可以请对方再说一次。",
      "换你提出一个两步小请求，听听家人怎样复述。",
    ],
    prompts: ["我听到要先……再……", "我想再确认的是……"],
    connectionDestinationId: "geography:geography-relative",
    connectionReason: "小请求里说清物品放在哪里，朋友才更容易照着做。",
  },
  {
    id: "today-three-moments",
    placeId: "history",
    destinationId: "history:history-before-after",
    title: "给今天排一条小时间线",
    duration: "3–5 分钟",
    materials: ["3 张小纸片", "一支笔"],
    steps: [
      "想起今天已经发生的三件小事。每张纸画一件，也可以请家人帮忙写。",
      "按发生的先后排好。指着纸片，用“先、后来、最后”讲一遍。",
      "打乱纸片，再把顺序找回来。想一想：你凭什么记起先后？",
    ],
    prompts: ["我知道这件事更早，因为……", "我还不确定的先后是……"],
    connectionDestinationId: "chinese:chinese-order",
    connectionReason: "时间线能排清先后，故事里的时间词也能帮我们找顺序。",
  },
  {
    id: "describe-my-desk",
    placeId: "geography",
    destinationId: "geography:geography-relative",
    title: "让家人找到桌上的小物品",
    duration: "2–3 分钟",
    materials: ["一本书", "一个笔盒", "可以一起玩的家人"],
    steps: [
      "把书和笔盒放在桌上。和家人站在同一侧，面朝同一个方向。",
      "不指给对方看，用“在谁旁边、在谁左边或右边”说出笔盒的位置。",
      "请家人说说找到的是哪件物品。如果不清楚，一起补充一句。",
    ],
    prompts: ["我们面朝……时，笔盒在……", "为了让位置更清楚，我补充了……"],
    connectionDestinationId: "chinese:chinese-listen",
    connectionReason: "说位置要讲清楚，听的人也可以复述一遍，确认彼此想到同一个地方。",
  },
  {
    id: "greet-my-family",
    placeId: "english",
    destinationId: "english:english-greetings",
    title: "演一演，见面和告别",
    duration: "2–3 分钟",
    materials: ["一个玩偶，或愿意一起玩的家人"],
    steps: [
      "让玩偶或家人扮演刚见面的朋友。你先说 Hello!，再听对方回应。",
      "假装这次见面结束了，试着用 Goodbye! 告别。",
      "再演一次，让对方选择“刚见面”或“要离开”的情景，你来选一句。",
    ],
    prompts: ["刚见面时，我会说……", "情景换成告别，我会……"],
    connectionDestinationId: "chinese:chinese-listen",
    connectionReason: "先听清朋友正要做什么，再选适合当时情景的话回应。",
  },
  {
    id: "light-on-my-globe",
    placeId: "universe",
    destinationId: "universe:lab:day-night",
    title: "跟着一个小点，看明暗变化",
    duration: "3–5 分钟",
    materials: ["一个不透明的球", "一小片贴纸", "普通手电筒，请家人帮忙拿稳"],
    steps: [
      "把贴纸贴在球上，当作观察的地方。请家人把手电筒拿稳，光只照球，不照眼睛。",
      "灯和球的位置不变，慢慢转动球。一直看同一张贴纸，观察它什么时候亮、什么时候暗。",
      "没有这些物品，就在网页小地球上试。说说：小点发生变化时，球是怎样转的？",
    ],
    prompts: ["我看到小点变暗时，它……", "我想把球再转一转，看看……"],
    connectionDestinationId: "geography:geography-globe",
    connectionReason: "球和地球仪都是帮助观察的模型。认识模型，再想想它能说明地球的哪些特点。",
  },
];

/** Lesson placements must match an explicit destination; never fall back by subject. */
export function getWorldChallenge({ placeId, destinationId }: { placeId?: WorldPlaceId; destinationId?: string }): WorldChallenge | undefined {
  if (destinationId !== undefined) {
    return worldChallenges.find((challenge) => challenge.destinationId === destinationId && (!placeId || challenge.placeId === placeId));
  }
  return placeId ? worldChallenges.find((challenge) => challenge.placeId === placeId) : undefined;
}
