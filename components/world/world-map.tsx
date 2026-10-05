"use client";

import { Footprints } from "lucide-react";
import type { CSSProperties } from "react";
import { worldPlaces, type WorldPlaceId } from "@/lib/world-content";
import styles from "./world-home.module.css";

const positions: Record<string, [number, number, number, number]> = {
  chinese: [19, 29, 25, 19], history: [49, 23, 75, 19], universe: [80, 29, 75, 47],
  math: [20, 74, 25, 47], geography: [50, 71, 25, 76], english: [81, 74, 75, 76],
};

export function Landmark({ id }: { id: string }) {
  return <svg viewBox="0 0 170 108" fill="none" aria-hidden="true">
    <ellipse cx="85" cy="93" rx="67" ry="11" fill="#537357" opacity=".10" />
    {id === "chinese" ? <>
      <path d="M34 83V40m38 43V24m36 61V34m29 51V53" stroke="#8e9270" strokeWidth="5" />
      <ellipse cx="34" cy="40" rx="23" ry="30" fill="#95b18a" /><ellipse cx="73" cy="32" rx="28" ry="31" fill="#668d70" /><ellipse cx="111" cy="44" rx="25" ry="31" fill="#7b9e73" /><ellipse cx="139" cy="55" rx="18" ry="25" fill="#a8bb86" />
      <path d="M56 65q16-8 30 2v32q-14-8-30-2Zm30 2q14-10 31-3v31q-16-5-31 4Z" fill="#fff7da" stroke="#b7ab7e" strokeWidth="2" /><path d="m93 74 17-4m-17 13 17-4M63 74l16 2m-16 7 16 2" stroke="#cbbd90" strokeWidth="2" />
    </> : id === "math" ? <>
      <path d="M48 88V30h71v58" fill="#e8d6a7" stroke="#b5a279" strokeWidth="2" /><path d="m36 36 47-31 49 31Z" fill="#be8466" /><rect x="69" y="51" width="25" height="37" rx="12" fill="#7c997b" /><path d="M39 72H17v22h22ZM130 71h25v23h-25" fill="#a2bdb6" stroke="#799b95" strokeWidth="2" />
      <path d="m110 71 17-9 17 9v21l-17 9-17-9Z" fill="#e8b56f" stroke="#b58854" strokeWidth="2" /><path d="m111 71 16 9 16-9m-16 9v20" stroke="#b58854" strokeWidth="2" /><circle cx="45" cy="95" r="10" fill="#afbf83" /><text x="83" y="40" textAnchor="middle" fill="#8a684d" fontSize="22">＋</text>
    </> : id === "history" ? <>
      <path d="M31 42h109v49H31Z" fill="#f2e6bd" /><path d="m23 41 61-32 64 32Z" fill="#c7a36b" /><path d="M26 94h119M33 87h105" stroke="#a98a60" strokeWidth="6" strokeLinecap="round" />
      {[42, 72, 102, 132].map(x => <path key={x} d={`M${x} 45v37`} stroke="#c9b480" strokeWidth="9" />)}
      <circle cx="84" cy="28" r="8" fill="#eee2bb" /><path d="M84 22v7l5 2" stroke="#947850" strokeWidth="2" />
    </> : id === "geography" ? <>
      <path d="M9 89 54 13l46 76Zm63 0 35-66 51 66Z" fill="#91ab89" /><path d="m38 40 16-27 17 28-17-8Z" fill="#edf0d9" /><path d="m94 47 13-24 19 25-19-6Z" fill="#d9e3ce" /><path d="M106 61c-35 13 24 25-9 35" stroke="#92c0c3" strokeWidth="10" strokeLinecap="round" />
      <path d="M18 84V65h22v19" fill="#ebd3a1" /><path d="m13 67 17-15 17 15Z" fill="#b18566" /><path d="M28 84v-9" stroke="#7b8c67" strokeWidth="7" /><circle cx="136" cy="21" r="11" fill="#e4c271" />
    </> : id === "english" ? <>
      <path d="M10 88q24-8 49 0t49 0t49 0M20 99q24-8 49 0t49 0t40 0" stroke="#96c1bf" strokeWidth="5" strokeLinecap="round" /><path d="m115 32-8 55h28l-8-55Z" fill="#f4e4bc" stroke="#c4b085" strokeWidth="2" /><path d="M110 57h23M112 42h19M107 73h30" stroke="#c58b70" strokeWidth="8" /><path d="m107 32 15-15 15 15Z" fill="#7c9290" />
      <path d="M26 71h58L72 86H39Z" fill="#b98a68" /><path d="M55 28v44M59 32l23 33H59Z" fill="#fff9e5" stroke="#b9b68b" strokeWidth="2" /><path d="M21 17h54v27H43l-11 8v-8H21Z" fill="#f4edde" /><text x="48" y="35" textAnchor="middle" fill="#877a9b" fontSize="14">Hello!</text>
    </> : <>
      <path d="M41 91V57h81v34" fill="#d7decd" /><path d="M35 57a47 47 0 0 1 94 0Z" fill="#96afb0" /><path d="M79 10v46" stroke="#668d90" strokeWidth="3" /><path d="M63 91V68h22v23" fill="#6e8f86" />
      <path d="m109 28 24-13 7 13-25 13Z" fill="#b59465" stroke="#8b7b5b" strokeWidth="2" /><path d="m124 37-8 24m8-24 12 22" stroke="#8b7b5b" strokeWidth="3" /><path d="m34 10 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#d8b775" /><circle cx="151" cy="57" r="5" fill="#e2ca8a" /><circle cx="16" cy="44" r="3" fill="#b9c8a4" />
    </>}
  </svg>;
}

export function WorldMap({ selected, onSelect }: { selected: WorldPlaceId; onSelect: (id: WorldPlaceId) => void }) {
  const current = positions[selected];
  return <div className={styles.worldMap} role="group" aria-label="我的知识世界地图，选择一个地方开始探索">
    <svg className={styles.mapLandscape} viewBox="0 0 900 570" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-40 81Q77 11 223 71T541 54Q768-12 946 73V542Q722 492 628 541T280 516Q101 568-40 492Z" fill="#e7eedb" />
      <path d="M535-30C437 43 502 127 458 179S370 215 383 294S493 360 438 431 449 514 425 613" fill="none" stroke="#cee3dc" strokeWidth="41" />
      <path d="M175 172Q270 79 439 137T721 172Q728 273 729 422T450 404Q301 502 180 423T175 172M439 137Q301 268 450 404M180 423Q246 276 439 137" fill="none" stroke="#c5cfab" strokeWidth="3" strokeDasharray="5 9" strokeLinecap="round" />
      <path d="m339 286 75-16m-74 25 76-16" stroke="#bdaf85" strokeWidth="5" />
      {[ [73, 283], [293, 66], [596, 324], [811, 488], [625, 79], [77, 494] ].map(([x,y]) => <g key={x} transform={`translate(${x} ${y})`}><path d="M0 10v19" stroke="#a4ac82" strokeWidth="3" /><ellipse cy="3" rx="11" ry="18" fill="#b5c99b" /></g>)}
    </svg>
    <svg className={styles.mapMobileLandscape} viewBox="0 0 400 650" preserveAspectRatio="none" aria-hidden="true"><path d="M213-20Q170 114 218 232T183 420Q224 527 198 679" stroke="#d0e5dd" strokeWidth="30" fill="none" /><path d="M100 125H300Q356 250 300 306H100Q41 431 100 494H300" stroke="#bfcdaa" strokeWidth="3" strokeDasharray="5 8" fill="none" /></svg>
    <div className={styles.mapCompass} aria-hidden="true">N<span>↑</span></div>
    <div className={styles.mapWelcome} aria-hidden="true"><span>✧</span>好奇心从这里出发</div>
    {worldPlaces.map((place) => {
      const [x, y, mx, my] = positions[place.id];
      return <button key={place.id} className={styles.mapPlace} aria-pressed={selected === place.id} aria-controls="world-discovery" style={{ "--x": x + "%", "--y": y + "%", "--mx": mx + "%", "--my": my + "%", "--place-color": place.color } as CSSProperties} onClick={() => onSelect(place.id)}>
        <Landmark id={place.id} /><span>{place.name}</span><small>{place.subjectId ? place.eyebrow : "宇宙 · 生命 · 万物"}</small>
      </button>;
    })}
    <span className={styles.explorerPin} style={{ "--x": current[0] + 8 + "%", "--y": current[1] - 12 + "%", "--mx": current[2] + 15 + "%", "--my": current[3] - 10 + "%" } as CSSProperties} aria-hidden="true"><Footprints size={17} /><span>我</span></span>
    <p className={styles.mapLegend}>这是一张想象的探索地图。每个地方，都藏着真实的知识。</p>
  </div>;
}
