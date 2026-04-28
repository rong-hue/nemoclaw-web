#!/usr/bin/env python3
import requests, time, os, sys

API_KEY = "sk-ydmujtiixljclskalihnyoxaacnznttyifrjrhpkampyycpe"
BASE_URL = "https://api.siliconflow.cn/v1/images/generations"
OUT_DIR = "/root/.openclaw/workspace/nemoclaw-web/public/stamps"

STAMPS = [
    # tang
    ("tang/tang_01.png", "single golden dragon pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese motif, clean lines"),
    ("tang/tang_02.png", "single phoenix bird pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese motif, elegant feathers"),
    ("tang/tang_03.png", "single peony flower pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese motif, ornate petals"),
    ("tang/tang_04.png", "single auspicious cloud ruyi pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese cloud motif"),
    ("tang/tang_05.png", "single lotus flower pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese Buddhist motif, symmetrical"),
    ("tang/tang_06.png", "single kirin qilin mythical creature pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese motif"),
    ("tang/tang_07.png", "single bat fu auspicious pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese lucky symbol"),
    ("tang/tang_08.png", "single treasure bowl cornucopia pattern, Chinese Tang dynasty style, isolated on pure white background, flat design, traditional Chinese auspicious motif"),
    # song
    ("song/song_01.png", "single plum blossom branch pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, elegant sparse branches"),
    ("song/song_02.png", "single bamboo stalk pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, few leaves, elegant"),
    ("song/song_03.png", "single pine tree silhouette pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, simple elegant shape"),
    ("song/song_04.png", "single mountain peak silhouette pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, abstract mountain"),
    ("song/song_05.png", "single full moon with pine tree pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, serene"),
    ("song/song_06.png", "single water ripple wave pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, concentric circles"),
    ("song/song_07.png", "single orchid flower pattern, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, delicate petals"),
    ("song/song_08.png", "single crane bird silhouette, Chinese Song dynasty style, isolated on pure white background, minimalist ink brush style, elegant flying crane"),
    # guochao
    ("guochao/guochao_01.png", "single tiger head pattern, Chinese guochao streetwear style, isolated on pure white background, bold graphic design, traditional meets modern"),
    ("guochao/guochao_02.png", "single panda face pattern, Chinese guochao streetwear style, isolated on pure white background, bold graphic design, cute traditional style"),
    ("guochao/guochao_03.png", "single yin yang taichi symbol, Chinese guochao style, isolated on pure white background, bold graphic design, modern interpretation"),
    ("guochao/guochao_04.png", "single Chinese knot pattern, red decorative knot, traditional craft style, isolated on pure white background, bold graphic"),
    ("guochao/guochao_05.png", "single koi fish pattern, colorful, modern Chinese graphic style, isolated on pure white background, bold design"),
    ("guochao/guochao_06.png", "single Peking opera mask pattern, bold colors, graphic style, isolated on pure white background"),
    ("guochao/guochao_07.png", "single Chinese character JI auspicious seal stamp, red ink on white background, traditional Chinese seal script, bold strokes, isolated"),
    ("guochao/guochao_08.png", "single bat pattern, traditional Chinese lucky symbol, red graphic style, isolated on pure white background"),
    # ink
    ("ink/ink_01.png", "single ink splash circle, abstract ink wash, zen style, isolated on pure white background, expressive brushstroke"),
    ("ink/ink_02.png", "single dry brush stroke, horizontal, ink texture, isolated on pure white background, calligraphy style"),
    ("ink/ink_03.png", "single ink dot cluster, scattered ink drops, abstract, isolated on pure white background"),
    ("ink/ink_04.png", "single calligraphy brush stroke, bold single stroke, abstract, isolated on pure white background"),
    ("ink/ink_05.png", "single ink wash mountain shape, abstract silhouette, isolated on pure white background"),
    ("ink/ink_06.png", "single flying white technique stroke, ink brush, abstract, isolated on pure white background"),
    ("ink/ink_07.png", "single enso zen circle brushstroke, Chinese ink wash style, isolated on pure white background, single bold brushstroke, imperfect circle"),
    ("ink/ink_08.png", "single abstract ink texture, splattered ink, expressive, isolated on pure white background"),
]

NEG = "blurry, low quality, watermark, signature, text, border, frame, gradient, noise, multiple objects, busy background"

headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

ok = 0
for i, (path, prompt) in enumerate(STAMPS):
    out_path = os.path.join(OUT_DIR, path)
    if os.path.exists(out_path):
        print(f"[{i+1}/32] {path} already exists, skip")
        ok += 1
        continue

    for attempt in range(3):
        try:
            resp = requests.post(BASE_URL, headers=headers, json={
                "model": "Kwai-Kolors/Kolors",
                "prompt": prompt,
                "negative_prompt": NEG,
                "image_size": "512x512",
                "num_inference_steps": 20,
                "guidance_scale": 7.5,
            }, timeout=60)
            if resp.status_code == 429:
                print(f"  rate limit, wait 30s...")
                time.sleep(30)
                continue
            resp.raise_for_status()
            img_url = resp.json()["images"][0]["url"]
            img_data = requests.get(img_url, timeout=30).content
            with open(out_path, "wb") as f:
                f.write(img_data)
            print(f"[{i+1}/32] {path} ✓")
            ok += 1
            break
        except Exception as e:
            print(f"  attempt {attempt+1} failed: {e}")
            time.sleep(5)
    else:
        print(f"[{i+1}/32] {path} FAILED")

    time.sleep(3)

print(f"\nDone: {ok}/32 generated")
