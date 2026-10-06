# 知识世界学习短片

这些静音动画由本项目的 `scripts/generate-learning-media.py` 逐帧绘制，使用原创几何图解，没有外部视频、图库、配音或品牌标识。中文由本机系统字体栅格化，仓库不包含字体文件。

## 发布文件

`v1/` 包含 3 段 960 × 540、20 fps 的 H.264 / yuv420p MP4，以及 WebP 封面和简体中文 WebVTT 字幕。

| 短片 | 时长 | 学习内容 |
| --- | --- | --- |
| `count` | 24 秒 | 一一对应地数五个光点，末尾数词表示总数，改变排列不改变数量 |
| `day-night` | 28 秒 | 追踪同一地点，观察地球自转与昼夜的关系 |
| `water-cycle` | 32 秒 | 太阳的能量、蒸发、云、降水和汇流的一条联系路径 |

全部讲解已经烧录在画面底部；播放器可选择开启独立字幕轨，但不应默认双层叠加。播放由学习者主动开始，不自动播放。视频不含音轨，文字讲解可以由页面的设备朗读功能读取。

封面是动画中的关键帧。观看短片不构成理解测验，也不会写入掌握进度。

## 科学核对与简化说明

文字与画面为原创教学表达，概念核对使用以下资料（2026-10-05 查阅）；没有复制来源中的图像、视频或文字段落：

- [NASA：What Is Earth? (Grades K–4)](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth-grades-k-4/)：朝向太阳与背向太阳的一面、自转与昼夜。
- [NASA：How Do Clouds Form?](https://science.nasa.gov/kids/earth/how-do-clouds-form/)：蒸发、水蒸气是看不见的气体、凝结成小水滴。
- [NASA：The Water Cycle](https://science.nasa.gov/earth/earth-observatory/the-water-cycle/)：太阳提供能量，水在大气、地表和地下移动，降水后存在多条路径。
- [NASA：Water Cycle and Precipitation](https://science.gsfc.nasa.gov/earth/climate/researchareas/155/)：云中水滴和冰晶在适合条件下长大并形成降水。

地球动画以从北极上方观察的简图说明自转，不模拟季节、极昼极夜，也不按实际大小、距离或速度绘制。黄色点始终表示同一个地点。

水循环动画的虚线表示看不见的水蒸气的移动，不是可见的水汽颗粒。画面显示的是水循环的一条路径；实际还有渗入地下、植物蒸腾等路径，水也不会以固定时间完成循环。

## 重新生成

需要 Python 3.10+、Pillow，以及 ffmpeg 或 `imageio-ffmpeg`。这些仅用于离线生成，不是应用运行依赖。

```sh
python3 scripts/generate-learning-media.py --font /path/to/chinese-font.ttf
```

macOS 默认查找 `Hiragino Sans GB.ttc`，Linux 默认查找 `NotoSansCJK-Regular.ttc`；可用 `--font` 指定有使用权限且包含中文字符的字体。`--preview` 只在临时目录输出关键帧供审阅，`--only count` 等参数只编码指定短片。

脚本同时生成字幕和 `lib/learning-media.ts`，确保讲解和时序一致。已经发布的版本目录采用长期不可变缓存；如需改变视频内容，请递增脚本的 `VERSION`，不要覆盖已发布的 URL。
