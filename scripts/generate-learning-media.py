#!/usr/bin/env python3
"""Render the project's original, silent learning animations.

Requirements: Python 3.10+, Pillow, ffmpeg (or imageio-ffmpeg).
Example: python3 scripts/generate-learning-media.py --font /path/to/chinese-font.ttf
No browser recording, remote artwork, voice recording or font file is distributed.
When changing published assets, increment VERSION to keep immutable URLs honest.
"""

from __future__ import annotations

import argparse
from functools import lru_cache
import json
import math
import os
from pathlib import Path
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
VERSION = "v1"
WIDTH, HEIGHT, FPS, SCALE = 960, 540, 20, 2
BG, INK, MUTED = "#f7f5ec", "#304d40", "#637967"
GREEN, PALE, BLUE, GOLD, CORAL = "#427457", "#e5ecda", "#669fb5", "#e8b94f", "#d48769"
FONT_PATH = ""

MEDIA = {
    "count": {
        "title": "五个光点，一个也不漏",
        "description": "跟着光点逐个数，再看看换了位置，数量会不会变。",
        "durationSeconds": 24,
        "note": "原创静音动画。光点只是计数对象；看过短片不会自动记为掌握。",
        "cues": [
            (0, 3, "这里有几个光点？\n我们一个一个地数。"),
            (3, 5, "一，点亮第一个。"),
            (5, 7, "二，再数一个。"),
            (7, 9, "三，每个只数一次。"),
            (9, 11, "四，不要漏掉。"),
            (11, 14, "五！所有光点都数到了。"),
            (14, 18, "最后数到五，\n就知道一共有五个。"),
            (18, 24, "换了位置，没有增加，也没有减少。\n还是五个！"),
        ],
    },
    "day-night": {
        "title": "我的白天，去了哪里？",
        "description": "盯住地球上的同一个地点，看它怎样从白天转到黑夜。",
        "durationSeconds": 28,
        "note": "原创静音示意动画。从北极上方看地球，黄色圆点代表同一个地点。大小、距离和转速均作简化；本片只解释自转与昼夜。",
        "cues": [
            (0, 4, "太阳一直在照亮地球。\n黄色圆点，是我们观察的同一个地点。"),
            (4, 9, "地球在自转，\n这个地点也跟着一起转动。"),
            (9, 16, "转到背向太阳的一边，\n这个地点就进入黑夜。"),
            (16, 24, "地球继续转动，\n这个地点又来到朝向太阳的一边。"),
            (24, 28, "白天又来了！\n昼夜交替，和地球自转有关。"),
        ],
    },
    "water-cycle": {
        "title": "跟着水，去旅行",
        "description": "从水面出发，认识蒸发、云、降水和汇流之间的联系。",
        "durationSeconds": 32,
        "note": "原创静音示意动画。虚线表示看不见的水蒸气的移动；本片只展示水循环的一条路径，还存在渗入地下、植物蒸腾等路径。过程、距离和时间均作简化。",
        "cues": [
            (0, 4, "太阳提供能量，\n水的旅行开始了。"),
            (4, 11, "液态水蒸发，变成看不见的水蒸气。\n图中的虚线只是帮助理解的示意。"),
            (11, 18, "水蒸气遇冷，可凝结成小水滴。\n云里也可能有小冰晶。"),
            (18, 24, "小水滴或冰晶不断长大，\n在合适条件下形成降水，比如雨。"),
            (24, 28, "部分雨水沿地面流动，\n汇入河流、湖泊和海洋。"),
            (28, 32, "水还会继续旅行。\n这只是水循环中的一条路径。"),
        ],
    },
}


@lru_cache(maxsize=30)
def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size * SCALE)


def xy(points):
    return [tuple(round(v * SCALE) for v in p) for p in points]


class Canvas:
    def __init__(self):
        self.image = Image.new("RGB", (WIDTH * SCALE, HEIGHT * SCALE), BG)
        self.draw = ImageDraw.Draw(self.image)

    def ellipse(self, bounds, fill, outline=None, width=1):
        self.draw.ellipse(tuple(round(v * SCALE) for v in bounds), fill, outline, width * SCALE)

    def line(self, points, fill, width=2):
        self.draw.line(xy(points), fill, width * SCALE, joint="curve")

    def polygon(self, points, fill):
        self.draw.polygon(xy(points), fill)

    def rounded(self, bounds, radius, fill, outline=None, width=1):
        self.draw.rounded_rectangle(tuple(round(v * SCALE) for v in bounds), radius * SCALE, fill, outline, width * SCALE)

    def text(self, position, text, size=30, fill=INK, anchor="mm"):
        self.draw.text(tuple(round(v * SCALE) for v in position), text, font=font(size), fill=fill, anchor=anchor)

    def arc(self, bounds, start, end, fill, width=2):
        self.draw.arc(tuple(round(v * SCALE) for v in bounds), start, end, fill, width * SCALE)

    def output(self):
        return self.image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def mix(a, b, p):
    return a + (b - a) * max(0, min(1, p))


def smooth(p):
    p = max(0, min(1, p))
    return p * p * (3 - 2 * p)


def arrow(c, a, b, color=BLUE, width=4, head=12):
    c.line([a, b], color, width)
    angle = math.atan2(b[1] - a[1], b[0] - a[0])
    c.polygon([b, (b[0] - head * math.cos(angle - .5), b[1] - head * math.sin(angle - .5)), (b[0] - head * math.cos(angle + .5), b[1] - head * math.sin(angle + .5))], color)


def common(c, title, step, t, duration, cues):
    c.text((48, 34), "知识世界 · 看见一个发现", 21, MUTED, "lm")
    c.text((48, 82), title, 38, INK, "lm")
    c.rounded((748, 33, 915, 77), 22, PALE)
    c.text((831, 55), step, 23, GREEN)
    c.rounded((32, 422, 928, 520), 20, "#ffffff")
    current = next((text for start, end, text in cues if start <= t < end), cues[-1][2])
    lines = current.split("\n")
    for i, text in enumerate(lines):
        c.text((480, 471 + (i - (len(lines) - 1) / 2) * 44), text, 42)
    c.rounded((48, 531, 912, 535), 2, "#dfe6d7")
    c.rounded((48, 531, 48 + 864 * min(1, t / duration), 535), 2, GREEN)


def firefly(c, x, y, lit, phase):
    if lit:
        r = 36 + 3 * math.sin(phase)
        c.ellipse((x - r - 8, y - r - 8, x + r + 8, y + r + 8), "#f5edc8")
    c.ellipse((x - 25, y - 25, x + 25, y + 25), GOLD if lit else "#d9e3d0", "#b8953e" if lit else "#aebfa6", 2)
    if lit:
        c.ellipse((x - 10, y - 11, x - 3, y - 4), "#fff9df")


def draw_count(t):
    c = Canvas()
    item = MEDIA["count"]
    count = min(5, max(0, int((t - 3) // 2) + 1))
    stage = "一起数一数" if t < 14 else "一共有几个" if t < 18 else "换个位置"
    common(c, item["title"], stage, t, item["durationSeconds"], item["cues"])
    c.rounded((80, 137, 880, 344), 40, "#edf1e3")
    target = [(220, 244), (335, 207), (480, 276), (624, 207), (743, 257)]
    change = smooth((t - 18) / 2.5)
    for i in range(5):
        x = mix(200 + 140 * i, target[i][0], change)
        y = mix(247, target[i][1], change)
        lit = count > i
        firefly(c, x, y, lit, t * 2 + i)
        if lit:
            c.text((x, y - 58), str(i + 1), 36, GREEN)
    if t < 3:
        c.text((480, 383), "每个只数一次，一个也不漏", 29, GREEN)
    elif t < 14:
        c.text((480, 383), f"已经数到 {count}", 32, GREEN)
    else:
        c.text((480, 383), "一共 5 个", 38, GREEN)
    return c.output()


def sun(c, x, y, radius, t):
    c.ellipse((x-radius-14, y-radius-14, x+radius+14, y+radius+14), "#faf0cd")
    for i in range(12):
        angle = i * math.tau / 12
        r1, r2 = radius + 20, radius + 29 + 2 * math.sin(t + i)
        c.line([(x + r1 * math.cos(angle), y + r1 * math.sin(angle)), (x + r2 * math.cos(angle), y + r2 * math.sin(angle))], GOLD, 4)
    c.ellipse((x-radius, y-radius, x+radius, y+radius), GOLD)


def draw_day_night(t):
    c = Canvas()
    item = MEDIA["day-night"]
    if t < 4:
        angle = math.pi
    elif t < 11:
        angle = math.pi + math.pi * smooth((t - 4) / 7)
    elif t < 16:
        angle = 2 * math.pi
    elif t < 24:
        angle = 2 * math.pi + math.pi * smooth((t - 16) / 8)
    else:
        angle = 3 * math.pi
    daytime = math.cos(angle) < 0
    common(c, item["title"], "追踪同一地点", t, item["durationSeconds"], item["cues"])
    sun(c, 151, 253, 51, t)
    c.text((151, 358), "太阳一直亮着", 25, MUTED)
    for y in [208, 251, 294]:
        arrow(c, (249, y), (454, y), "#d8b259", 3)
        x = 252 + ((t * 34) % 190)
        c.ellipse((x-4,y-4,x+4,y+4), GOLD)
    cx, cy, r = 641, 255, 129
    c.ellipse((cx-r-12, cy-r-12, cx+r+12, cy+r+12), "#e2ecea")
    c.ellipse((cx-r, cy-r, cx+r, cy+r), "#86b8c3")
    for i, (dist, off, rad) in enumerate([(48,.2,36),(77,2.9,29),(34,4.3,22)]):
        rot = angle + off
        px, py = cx + dist*math.cos(rot), cy - dist*math.sin(rot)
        c.ellipse((px-rad, py-rad*.75, px+rad, py+rad*.75), "#abc38b")
    # Sunlight stays on the left; only the Earth and the marked location rotate.
    night = Image.new("RGBA", c.image.size, (0, 0, 0, 0))
    nd = ImageDraw.Draw(night)
    nd.pieslice(tuple(v*SCALE for v in (cx-r,cy-r,cx+r,cy+r)), -90, 90, fill=(24, 46, 63, 182))
    c.image.paste(night, (0, 0), night)
    c.draw = ImageDraw.Draw(c.image)
    c.line([(cx,cy-r),(cx,cy+r)], "#e1e7d9", 2)
    px, py = cx + (r-12)*math.cos(angle), cy - (r-12)*math.sin(angle)
    c.ellipse((px-15,py-15,px+15,py+15), "#ffffff")
    c.ellipse((px-10,py-10,px+10,py+10), GOLD, "#a8792e", 2)
    c.text((581, 254), "昼", 29, "#294d47")
    c.text((703, 254), "夜", 29, "#ffffff")
    c.arc((cx-159,cy-159,cx+159,cy+159), 300, 350, GREEN, 3)
    arrow(c, (cx+151,cy-45),(cx+147,cy-64), GREEN, 3, 11)
    c.rounded((536, 392, 746, 417), 12, "#e6ecd9" if daytime else "#e0e6ed")
    c.text((641,404), "此刻：白天" if daytime else "此刻：黑夜", 22, GREEN if daytime else "#405369")
    c.text((809, 365), "自转示意", 20, MUTED)
    return c.output()


def cloud(c, x, y, scale=1):
    for dx,dy,r in [(-55,8,29),(-19,-10,36),(25,-5,33),(61,10,26)]:
        c.ellipse((x+(dx-r)*scale,y+(dy-r)*scale,x+(dx+r)*scale,y+(dy+r)*scale), "#e4eff0", "#bed6d9", 2)
    c.rounded((x-74*scale,y+2*scale,x+82*scale,y+35*scale), int(15*scale), "#e4eff0")


def drop(c, x, y, size=8, color=BLUE):
    c.polygon([(x,y-size*1.5),(x-size*.8,y),(x+size*.8,y)],color)
    c.ellipse((x-size*.8,y-size*.3,x+size*.8,y+size),color)


def draw_water_cycle(t):
    c = Canvas()
    item = MEDIA["water-cycle"]
    stage = 0 if t < 4 else 1 if t < 11 else 2 if t < 18 else 3 if t < 24 else 4 if t < 28 else 5
    names = ["太阳提供能量", "蒸发", "云的形成", "降水", "汇流", "旅行还会继续"]
    common(c, item["title"], names[stage], t, item["durationSeconds"], item["cues"])
    sun(c, 134, 182, 35, t)
    c.polygon([(25,367),(395,358),(590,314),(717,221),(839,315),(935,321),(935,414),(25,414)], "#c5d3b0")
    c.polygon([(609,314),(718,223),(815,317),(755,298),(706,281),(663,313)], "#aebf98")
    c.polygon([(688,248),(718,222),(748,251),(721,241),(709,254)], "#f6f5ea")
    c.rounded((34,352,365,408), 25, "#8ab7c6")
    for yy in [369,389]:
        pts=[(50+i*6, yy+3*math.sin(i*.4+t)) for i in range(47)]
        c.line(pts,"#d5e8e9",2)
    river=[(741,301),(718,324),(671,332),(620,354),(559,350),(504,376),(444,382),(361,377)]
    c.line(river,"#edf3e8",16)
    c.line(river,"#78acbf",9)
    c.text((156, 394), "水面", 22, "#315a68")
    cloud_x = 537 + 8 * math.sin(t * .17)
    cloud(c,cloud_x,192)
    c.text((834,394),"一条可能的路径",20,MUTED)
    if stage == 0:
        for shift in [0,28,56]:
            arrow(c,(172+shift*.2,232),(204+shift,316),"#d8b259",3)
    if stage == 1 or stage == 5:
        for i in range(3):
            x0=253+i*37
            # Dashed guides deliberately do not look like visible vapor droplets.
            for j in range(8):
                p=((j/8+t*.12)%1)
                x=x0+125*p
                y=335-146*p
                c.line([(x,y),(x+7,y-9)],"#6d9daa",3)
            arrow(c,(x0+115,203),(x0+132,183),"#6d9daa",3,10)
        if stage==1:
            c.rounded((188,259,427,298),18,"#ffffff")
            c.text((307,278),"水蒸气：看不见",23,INK)
    if stage == 2:
        for i in range(5):
            px=cloud_x-42+i*20
            py=199+6*math.sin(t*1.5+i)
            if i<3:
                drop(c,px,py,5)
            else:
                for angle in [0,math.pi/3,2*math.pi/3]:
                    c.line([(px-6*math.cos(angle),py-6*math.sin(angle)),(px+6*math.cos(angle),py+6*math.sin(angle))],"#447e99",2)
        c.text((518,274),"小水滴 · 小冰晶",27,"#3d7182")
    if stage == 3 or stage == 5:
        for i in range(8):
            p=(t*.65+i*.23)%1
            x=cloud_x-19+(i%4)*26+44*p
            y=238+85*p
            drop(c,x,y,5)
        if stage==3:
            c.text((771,180),"雨，是降水的一种",25,"#3d7182")
    if stage == 4 or stage == 5:
        p=(t*.23)%1
        pos=p*(len(river)-1)
        i=min(len(river)-2,int(pos))
        x=mix(river[i][0],river[i+1][0],pos-i)
        y=mix(river[i][1],river[i+1][1],pos-i)
        c.ellipse((x-8,y-8,x+8,y+8),"#fff7d5","#b6a267",2)
        if stage==4:
            c.text((507,293),"沿地面流动",28,"#3d7182")
    if stage==5:
        c.text((532,273),"还有地下、植物等路径",25,GREEN)
    return c.output()


RENDERERS = {"count":draw_count,"day-night":draw_day_night,"water-cycle":draw_water_cycle}


def timestamp(seconds):
    return f"00:{int(seconds)//60:02}:{int(seconds)%60:02}.000"


def write_manifest():
    rows=[]
    for media_id,item in MEDIA.items():
        values={"id":media_id,"title":item["title"],"description":item["description"],"src":f"/media/learning/{VERSION}/{media_id}.mp4","poster":f"/media/learning/{VERSION}/{media_id}.webp","captions":f"/media/learning/{VERSION}/{media_id}.zh.vtt","durationSeconds":item["durationSeconds"],"transcript":[cue[2].replace("\n","") for cue in item["cues"]],"note":item["note"]}
        rows.append(f"  {json.dumps(media_id)}: "+json.dumps(values,ensure_ascii=False,indent=2).replace("\n","\n  "))
    (ROOT/"lib/learning-media.ts").write_text('''// Generated by scripts/generate-learning-media.py; keep captions and copy in sync.
export type LearningVideoId = "count" | "day-night" | "water-cycle";

export type LearningVideo = {
  id: LearningVideoId;
  title: string;
  description: string;
  src: string;
  poster: string;
  captions: string;
  durationSeconds: number;
  transcript: string[];
  note: string;
};

export const learningVideos: Record<LearningVideoId, LearningVideo> = {
'''+",\n".join(rows)+'''
};

export function getLearningVideo(id: LearningVideoId): LearningVideo {
  return learningVideos[id];
}
''',encoding="utf-8")


def main():
    global FONT_PATH
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font",default=os.environ.get("LEARNING_MEDIA_FONT"))
    parser.add_argument("--ffmpeg",default=os.environ.get("FFMPEG_BINARY"))
    parser.add_argument("--only",choices=list(MEDIA))
    parser.add_argument("--preview",action="store_true",help="Write representative PNG frames without encoding.")
    args=parser.parse_args()
    fonts=[args.font,"/System/Library/Fonts/Hiragino Sans GB.ttc","/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]
    FONT_PATH=next((str(p) for p in fonts if p and Path(p).is_file()),"")
    if not FONT_PATH:
        raise SystemExit("Provide a Chinese font using --font or LEARNING_MEDIA_FONT.")
    ffmpeg=args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg and not args.preview:
        try:
            import imageio_ffmpeg
            ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError as error:
            raise SystemExit("Install ffmpeg or imageio-ffmpeg to encode the videos.") from error
    output=ROOT/"public/media/learning"/VERSION
    output.mkdir(parents=True,exist_ok=True)
    for media_id,item in MEDIA.items():
        if args.only and media_id!=args.only:
            continue
        render=RENDERERS[media_id]
        representative={"count":15,"day-night":12,"water-cycle":14}[media_id]
        if args.preview:
            for t in [1,representative,item["durationSeconds"]-2]:
                path=Path("/tmp")/f"gogostudy-{media_id}-{t}.png"
                render(t).save(path)
                print(path,flush=True)
            continue
        print(f"Rendering {media_id}: {item['durationSeconds']}s at {FPS} fps",flush=True)
        temporary_video=output/f".{media_id}.encoding.mp4"
        command=[str(ffmpeg),"-hide_banner","-loglevel","error","-y","-f","rawvideo","-vcodec","rawvideo","-pix_fmt","rgb24","-s",f"{WIDTH}x{HEIGHT}","-r",str(FPS),"-i","-","-an","-c:v","libx264","-preset","slow","-crf","26","-profile:v","baseline","-level","3.1","-pix_fmt","yuv420p","-movflags","+faststart",str(temporary_video)]
        process=subprocess.Popen(command,stdin=subprocess.PIPE)
        try:
            for frame in range(item["durationSeconds"]*FPS):
                process.stdin.write(render(frame/FPS).tobytes())
        finally:
            process.stdin.close()
        if process.wait()!=0:
            raise SystemExit(f"ffmpeg failed for {media_id}")
        temporary_video.replace(output/f"{media_id}.mp4")
        render(representative).save(output/f"{media_id}.webp",quality=88,method=6)
        vtt="WEBVTT\n\n"+"\n\n".join(f"{timestamp(start)} --> {timestamp(end)}\n{text}" for start,end,text in item["cues"])+"\n"
        (output/f"{media_id}.zh.vtt").write_text(vtt,encoding="utf-8")
        print(f"Finished {media_id}: {(output/f'{media_id}.mp4').stat().st_size:,} bytes",flush=True)
    if not args.preview:
        write_manifest()


if __name__=="__main__":
    main()
