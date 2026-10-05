import { useId } from "react";

const stars = Array.from({ length: 48 }, (_, i) => ({ x: 18 + (i * 137) % 664, y: 20 + (i * 83) % 370, r: i % 4 === 0 ? 1.7 : .8 }));
const planets = [
  { name: "水星", x: 158, y: 221, r: 5, color: "#bdb4a6" }, { name: "金星", x: 215, y: 211, r: 10, color: "#ead091" },
  { name: "地球", x: 280, y: 200, r: 12, color: "#73b8c1" }, { name: "火星", x: 344, y: 189, r: 8, color: "#d18e69" },
  { name: "木星", x: 419, y: 176, r: 29, color: "#d8b18b" }, { name: "土星", x: 505, y: 164, r: 23, color: "#e2cc94" },
  { name: "天王星", x: 582, y: 149, r: 17, color: "#9ecdd4" }, { name: "海王星", x: 652, y: 137, r: 17, color: "#7e9aca" },
];

export function ScaleScene({ id, label }: { id: string; label: string }) {
  const uid = useId().replace(/:/g, "");
  const sky = ["universe", "galaxy", "solar", "earth"].includes(id);
  const title = `${uid}-title`;
  return <svg viewBox="0 0 700 420" role="img" aria-labelledby={title}>
    <title id={title}>{`${label}的观察示意图，细节与大小经过简化；图下有文字说明。`}</title>
    <defs>
      <radialGradient id={`${uid}-sky`}><stop stopColor="#254553" /><stop offset="1" stopColor="#142d3b" /></radialGradient>
      <radialGradient id={`${uid}-sun`}><stop stopColor="#fff2b1" /><stop offset=".7" stopColor="#f5c778" /><stop offset="1" stopColor="#e8a15e" /></radialGradient>
      <radialGradient id={`${uid}-cloud`}><stop stopColor="#a9d6e0" stopOpacity=".65" /><stop offset=".62" stopColor="#96c8d6" stopOpacity=".2" /><stop offset="1" stopColor="#89bdcb" stopOpacity="0" /></radialGradient>
      <clipPath id={`${uid}-earth`}><circle cx="350" cy="210" r="128" /></clipPath>
    </defs>
    <rect width="700" height="420" fill={sky ? `url(#${uid}-sky)` : "#edf2e3"} />
    {sky ? <g fill="#e7ece4">{stars.map((star, i) => <circle key={i} r={star.r} cx={star.x} cy={star.y} opacity={.25 + i % 5 * .12} />)}</g> : null}
    {id === "universe" ? <>
      <g stroke="#83afba" strokeWidth="1" opacity=".23"><path d="M75 90 218 155 350 63 505 154 620 83M75 90 105 275 218 155 335 280 505 154 594 304M105 275 335 280 390 368 594 304M350 63 335 280M218 155 390 368" fill="none" /></g>
      {[[75,90,20,-22],[218,155,34,30],[350,63,17,5],[505,154,27,-30],[620,83,18,14],[105,275,26,5],[335,280,38,-20],[594,304,26,28],[390,368,16,10]].map(([x,y,r,a], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}><ellipse rx={r * 1.5} ry={r * .62} fill="#aacac6" opacity=".09" /><ellipse rx={r} ry={r * .34} fill="none" stroke={i % 2 ? "#b3c8d3" : "#e0cda5"} strokeWidth="5" opacity=".6" /><ellipse rx={r * .38} ry={r * .22} fill="#f1dfb6" /></g>)}
      <text x="350" y="402" textAnchor="middle" fill="#dbe6df" fontSize="15">很多星系，也有星系之间广阔的空间</text>
    </> : null}
    {id === "galaxy" ? <g transform="translate(350 202)">
      <ellipse rx="237" ry="143" fill="#b9cbd0" opacity=".05" />
      {[0,1,2,3].map((arm) => <path key={arm} d={Array.from({length:90},(_,i)=>{const a=i*.053+arm*Math.PI/2; const r=20+i*2.3; return `${i ? "L" : "M"}${(Math.cos(a)*r).toFixed(2)} ${(Math.sin(a)*r*.61).toFixed(2)}`;}).join(" ")} fill="none" stroke={arm%2?"#b4c5c5":"#b1bccf"} strokeWidth="18" opacity=".3" strokeLinecap="round" />)}
      <ellipse rx="53" ry="27" transform="rotate(-12)" fill="#f0ddb0" opacity=".83" />
      <circle cx="117" cy="69" r="6" fill="#ffe4a0" /><circle cx="117" cy="69" r="14" fill="none" stroke="#e8dcb3" strokeDasharray="3 5" />
      <path d="M132 72 199 103" stroke="#e6e5d0" /><text x="204" y="119" fill="#f1eee0" fontSize="17">太阳在这里附近</text>
      <text x="0" y="188" textAnchor="middle" fill="#dbe6df" fontSize="15">银河系的俯视示意 · 太阳不在中心</text>
    </g> : null}
    {id === "solar" ? <>
      <path d="M88 230 659 136" stroke="#698994" strokeDasharray="4 7" />
      <circle cx="74" cy="235" r="53" fill={`url(#${uid}-sun)`} /><circle cx="74" cy="235" r="65" fill="#f2cd83" opacity=".08" />
      <text x="74" y="318" textAnchor="middle" fill="#f8e6b5" fontSize="19">太阳</text>
      {planets.map((planet) => <g key={planet.name}><circle cx={planet.x} cy={planet.y} r={planet.r} fill={planet.color} />{planet.name === "土星" ? <ellipse cx={planet.x} cy={planet.y} rx="37" ry="8" transform={`rotate(-18 ${planet.x} ${planet.y})`} fill="none" stroke="#b8b799" strokeWidth="4" /> : null}<text x={planet.x} y={planet.y + 59} textAnchor="middle" fill="#e1e9e5" fontSize="17">{planet.name}</text></g>)}
      <text x="350" y="378" textAnchor="middle" fill="#cfdfde" fontSize="15">只按离太阳由近到远排开 · 真实行星不会总在一条线上</text>
    </> : null}
    {id === "earth" ? <>
      <circle cx="350" cy="210" r="145" fill="#9dc7cd" opacity=".07" /><circle cx="350" cy="210" r="133" fill="#9fc7d3" opacity=".3" />
      <circle cx="350" cy="210" r="128" fill="#51919f" />
      <g clipPath={`url(#${uid}-earth)`}><path d="M219 152 265 129 287 143 298 171 334 177 340 206 323 220 335 243 312 270 305 311 285 333 264 284 273 244 244 220 220 207ZM377 82 419 101 475 142 478 179 443 187 426 218 403 212 393 187 365 171 347 134ZM410 273 444 269 462 300 432 311 409 300Z" fill="#9caf7b" /><path d="M253 116Q339 90 408 115M242 192Q306 177 364 187M365 253Q422 234 461 250M290 315Q351 335 418 310" stroke="#e5e9d7" strokeWidth="9" strokeLinecap="round" opacity=".58" fill="none" /></g>
      <path d="M476 145 562 112" stroke="#a8c3c5" /><text x="567" y="117" fill="#e2ede3" fontSize="18">薄薄的大气层</text>
      <path d="M260 274 168 309" stroke="#a8c3c5" /><text x="88" y="333" fill="#e2ede3" fontSize="18">陆地与海洋</text>
      <text x="350" y="393" textAnchor="middle" fill="#d9e5df" fontSize="15">我们共同的家园 · 陆地形状与大气厚度为示意</text>
    </> : null}
    {id === "ecosystem" ? <>
      <rect width="700" height="420" fill="#e9f0e1" /><circle cx="577" cy="66" r="32" fill="#efc978" />
      <path d="M0 230Q135 136 275 214T700 195V420H0" fill="#bdcfa9" /><path d="M0 271Q151 203 309 262T700 234V420H0" fill="#91b181" />
      <path d="M422 237Q356 268 429 300T379 368H514Q549 321 478 301T480 242" fill="#9cc9c7" /><path d="M0 350H700V420H0Z" fill="#ad997c" />
      {[115,228].map((x,i)=><g key={x} transform={`translate(${x} ${i?191:171})`}><path d="M0 12V137" stroke="#8e8060" strokeWidth="12" /><circle cy="12" r="45" fill={i?"#608b68":"#557f63"} /><circle cx="-20" cy="33" r="27" fill="#608b68" /><circle cx="24" cy="37" r="29" fill="#638e69" /></g>)}
      <g fill="#e6ddc8" transform="translate(567 310)"><ellipse rx="34" ry="18" /><circle cx="27" cy="-16" r="15" /><ellipse cx="24" cy="-38" rx="6" ry="18" /><ellipse cx="37" cy="-36" rx="5" ry="15" /><circle cx="33" cy="-19" r="2" fill="#3f5743" /></g>
      <g fill="#e4d7bc">{[70,169,291,568,625].map((x,i)=><g key={x}><path d={`M${x} 385q8 -18 17 0Z`} /><rect x={x+7} y="384" width="3" height="10" rx="1" /><circle cx={x+25} cy={372+i%2*20} r="3" /></g>)}</g>
      <text x="305" y="66" fill="#4b6856" fontSize="18">水、空气、阳光和生命，彼此联系</text><text x="24" y="399" fill="#3f4436" fontSize="16">土壤里也有分解者</text>
    </> : null}
    {id === "cell" ? <>
      <rect x="154" y="53" width="392" height="312" rx="71" fill="#d4e0b8" stroke="#758f60" strokeWidth="9" /><rect x="168" y="67" width="364" height="284" rx="59" fill="#e9eed3" stroke="#a2b383" strokeWidth="3" />
      <path d="M244 118Q413 76 476 151L474 261Q398 300 294 272Q247 201 244 118" fill="#c4dcd8" stroke="#91b9b2" strokeWidth="3" />
      <ellipse cx="232" cy="270" rx="40" ry="35" fill="#c3acc1" stroke="#a88ea8" strokeWidth="3" /><circle cx="235" cy="268" r="14" fill="#9b829f" />
      {[[214,116,-22],[196,196,70],[469,316,-8],[504,197,74],[337,323,8]].map(([x,y,a])=><g key={x} transform={`translate(${x} ${y}) rotate(${a})`}><ellipse rx="25" ry="13" fill="#7c9d65" /><path d="M-12 -4H13M-12 1H13M-12 6H13" stroke="#c8d7a9" strokeWidth="2" /></g>)}
      <path d="M207 267 90 277M496 199 594 213" stroke="#718570" /><text x="33" y="301" fill="#405b46" fontSize="17">细胞核</text><text x="568" y="241" fill="#405b46" fontSize="17">叶绿体</text>
      <text x="350" y="403" textAnchor="middle" fill="#526449" fontSize="16">以一个植物细胞为例 · 颜色和内部大小经过简化</text>
    </> : null}
    {id === "molecule" ? <>
      <path d="M350 155 230 248M350 155 470 248" stroke="#8fa59f" strokeWidth="20" strokeLinecap="round" /><circle cx="350" cy="155" r="70" fill="#c58471" /><circle cx="230" cy="248" r="46" fill="#faf9ec" stroke="#a6b7a9" strokeWidth="3" /><circle cx="470" cy="248" r="46" fill="#faf9ec" stroke="#a6b7a9" strokeWidth="3" />
      <text x="350" y="168" textAnchor="middle" fill="#fff8e9" fontSize="34">O</text><text x="230" y="259" textAnchor="middle" fill="#496650" fontSize="30">H</text><text x="470" y="259" textAnchor="middle" fill="#496650" fontSize="30">H</text>
      <text x="350" y="56" textAnchor="middle" fill="#496650" fontSize="19">水分子 H₂O：一个氧原子与两个氢原子结合</text><text x="350" y="379" textAnchor="middle" fill="#526449" fontSize="16">球和连接棒帮助表示结构，并非真实颜色或小棍子</text>
    </> : null}
    {id === "atom" ? <>
      <circle cx="350" cy="210" r="172" fill={`url(#${uid}-cloud)`} /><circle cx="350" cy="210" r="110" fill={`url(#${uid}-cloud)`} />
      <g fill="#89bac6" opacity=".45">{Array.from({length:150},(_,i)=>{const angle=i*2.39996; const r=20+Math.sqrt(i/150)*137;return <circle key={i} cx={350+Math.cos(angle)*r} cy={210+Math.sin(angle)*r*.92} r={i%3===0?1.5:1} />;})}</g>
      <circle cx="346" cy="206" r="10" fill="#c58a77" /><circle cx="359" cy="211" r="10" fill="#d7bc7f" /><circle cx="348" cy="220" r="10" fill="#c58a77" />
      <path d="M365 215 488 272M255 144 150 104" stroke="#7d9a92" /><text x="490" y="300" fill="#3e5c4a" fontSize="17">原子核（大大放大了）</text><text x="36" y="86" fill="#3e5c4a" fontSize="17">云雾表示电子可能出现的区域</text>
      <text x="350" y="392" textAnchor="middle" fill="#526449" fontSize="16">没有画固定轨道 · 小点也不是拍到的许多颗电子</text>
    </> : null}
  </svg>;
}
