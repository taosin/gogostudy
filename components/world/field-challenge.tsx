"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown, Clock3, Footprints, NotebookPen } from "lucide-react";
import { ReadAloud } from "@/components/media/read-aloud";
import { getWorldDestination, getWorldDestinationHref, type WorldPlaceId } from "@/lib/world-content";
import { getWorldChallenge, type WorldChallenge } from "@/lib/world-challenges";
import styles from "./field-challenge.module.css";

type FieldChallengeProps = {
  placeId?: WorldPlaceId;
  destinationId?: string;
  onReflect?: () => void;
};

export function FieldChallenge({ placeId, destinationId, onReflect }: FieldChallengeProps) {
  const challenge = getWorldChallenge({ placeId, destinationId });
  return challenge ? <ChallengeCard key={challenge.id} challenge={challenge} inLesson={destinationId !== undefined} onReflect={onReflect} /> : null;
}

function ChallengeCard({ challenge, inLesson, onReflect }: { challenge: WorldChallenge; inLesson: boolean; onReflect?: () => void }) {
  const [open, setOpen] = useState(false);
  const connection = getWorldDestination(challenge.connectionDestinationId);
  const destination = getWorldDestination(challenge.destinationId);
  const spoken = `${challenge.title}。准备：${challenge.materials.join("，")}。${challenge.steps.map((step, index) => `第${index + 1}步，${step}`).join("")}`;

  return <details className={styles.card} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className={styles.summary}>
      <span className={styles.icon}><Footprints size={21} aria-hidden="true" /></span>
      <span className={styles.heading}><small>把发现带到生活里</small><strong>{challenge.title}</strong><span><Clock3 size={13} aria-hidden="true" />{challenge.duration} · 随时可以试</span></span>
      <ChevronDown className={styles.chevron} size={18} aria-hidden="true" />
    </summary>
    {open ? <div className={styles.body}>
      <p className={styles.invitation}>离开屏幕，找找身边的线索。也可以先说说你准备怎样试。</p>
      <div className={styles.materials}><strong>我需要</strong><ul>{challenge.materials.map((material) => <li key={material}>{material}</li>)}</ul></div>
      <ReadAloud text={spoken} label="听听这个小挑战" compact />
      <ol className={styles.steps}>{challenge.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
      <div className={styles.prompts}><strong>我可以这样开个头</strong>{challenge.prompts.map((prompt) => <p key={prompt}>{prompt}</p>)}<small>用自己的话说就好，也可以留一个还没想明白的问题。</small></div>
      <div className={styles.actions}>
        {onReflect ? <button type="button" className={styles.reflect} onClick={onReflect}><NotebookPen size={17} aria-hidden="true" />留下我的发现<ArrowRight size={16} aria-hidden="true" /></button> : null}
        {!inLesson && destination ? <Link className={styles.lessonLink} href={getWorldDestinationHref(destination.id)} prefetch={false}>回到相关课堂<ArrowRight size={15} aria-hidden="true" /></Link> : null}
      </div>
      {connection ? <div className={styles.connection}><p>{challenge.connectionReason}</p><Link href={getWorldDestinationHref(connection.id)} prefetch={false}>{connection.title}<ArrowRight size={15} aria-hidden="true" /></Link></div> : null}
    </div> : null}
  </details>;
}
