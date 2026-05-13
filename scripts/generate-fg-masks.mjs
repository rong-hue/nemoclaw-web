/**
 * generate-fg-masks.mjs
 * 
 * 自动生成商品前景遮罩图（prototype 用途）
 * 
 * 原理：
 * 1. 读取原始 mockup 图片
 * 2. 将 zone 区域内的像素设为透明（这部分是可印刷区域）
 * 3. zone 外的像素保留（把手、边框、阴影等不可印刷区域）
 * 4. 对 zone 边缘做羽化（feather）处理，让过渡更自然
 * 
 * 使用方式：
 *   cd nemoclaw-web
 *   node scripts/generate-fg-masks.mjs
 * 
 * 依赖：sharp（如果没有安装，脚本会提示）
 * 
 * 注意：这是原型验证用的自动生成方案。
 * 生产环境建议用 Photoshop 手动制作更精确的前景遮罩。
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MOCKUPS_DIR = resolve(ROOT, 'public/mockups');

// 商品配置（与 totem-mapping.ts 保持一致）
const PRODUCTS = [
  {
    name: 'tshirt',
    zones: [
      { x: 0.38, y: 0.28, width: 0.24, height: 0.24 },
      { x: 0.62, y: 0.18, width: 0.18, height: 0.18 },
      { x: 0.30, y: 0.25, width: 0.40, height: 0.40 },
    ],
  },
  {
    name: 'mug',
    zones: [
      { x: 0.25, y: 0.25, width: 0.50, height: 0.50 },
    ],
  },
  {
    name: 'phonecase',
    zones: [
      { x: 0.20, y: 0.25, width: 0.60, height: 0.50 },
      { x: 0.30, y: 0.10, width: 0.40, height: 0.25 },
    ],
  },
  {
    name: 'totebag',
    zones: [
      { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    ],
  },
  // sticker 不需要前景遮罩
];

// 羽化半径（像素）
const FEATHER_RADIUS = 12;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('❌ 需要安装 sharp: pnpm add -D sharp');
    console.error('   然后重新运行: node scripts/generate-fg-masks.mjs');
    process.exit(1);
  }

  console.log('🎨 开始生成前景遮罩图...\n');

  for (const product of PRODUCTS) {
    const inputPath = resolve(MOCKUPS_DIR, `${product.name}.png`);
    const outputPath = resolve(MOCKUPS_DIR, `${product.name}-fg.png`);

    if (!existsSync(inputPath)) {
      console.log(`⚠️  跳过 ${product.name}：找不到 ${inputPath}`);
      continue;
    }

    console.log(`📦 处理 ${product.name}...`);

    // 读取原图
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const { width, height, channels } = metadata;

    if (!width || !height) {
      console.log(`⚠️  跳过 ${product.name}：无法读取图片尺寸`);
      continue;
    }

    // 获取原始像素数据（RGBA）
    const rawBuffer = await image
      .ensureAlpha()
      .raw()
      .toBuffer();

    const pixels = Buffer.from(rawBuffer);
    const stride = width * 4; // RGBA

    // 合并所有 zone 为一个联合区域，计算每个像素到最近 zone 边缘的距离
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const offset = py * stride + px * 4;

        // 计算该像素到所有 zone 内部的最小距离
        // 如果在 zone 内部，距离为正（到边缘的距离）
        // 如果在 zone 外部，距离为负
        let maxInsideDistance = -Infinity;

        for (const zone of product.zones) {
          const zx = Math.round(zone.x * width);
          const zy = Math.round(zone.y * height);
          const zw = Math.round(zone.width * width);
          const zh = Math.round(zone.height * height);

          // 像素到 zone 矩形内部的有符号距离
          // 正值 = 在 zone 内部（离边缘的距离）
          // 负值 = 在 zone 外部
          const dx = Math.min(px - zx, zx + zw - px);
          const dy = Math.min(py - zy, zy + zh - py);
          const insideDistance = Math.min(dx, dy);

          maxInsideDistance = Math.max(maxInsideDistance, insideDistance);
        }

        if (maxInsideDistance > FEATHER_RADIUS) {
          // 完全在 zone 内部（超过羽化半径）→ 完全透明
          pixels[offset + 3] = 0;
        } else if (maxInsideDistance > 0) {
          // 在 zone 内部但靠近边缘 → 羽化过渡
          const alpha = 1 - (maxInsideDistance / FEATHER_RADIUS);
          pixels[offset + 3] = Math.round(pixels[offset + 3] * alpha);
        }
        // maxInsideDistance <= 0：在 zone 外部 → 保留原始 alpha
      }
    }

    // 写入输出文件
    await sharp(pixels, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toFile(outputPath);

    console.log(`   ✅ 生成 ${product.name}-fg.png (${width}×${height})`);
  }

  console.log('\n🎉 全部完成！');
  console.log('');
  console.log('📝 提示：');
  console.log('   - 这些是自动生成的原型遮罩，zone 内部像素被设为透明');
  console.log('   - 生产环境建议用 Photoshop 手动制作更精确的遮罩');
  console.log('   - 特别是马克杯的把手、手机壳的摄像头开孔等细节');
}

main().catch(console.error);
