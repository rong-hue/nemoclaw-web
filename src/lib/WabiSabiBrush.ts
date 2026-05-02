// src/lib/WabiSabiBrush.ts
import { BaseBrush, Canvas as FabricCanvas, Point } from 'fabric';
import type { TBrushEventData } from 'fabric';

export interface WabiSabiParams {
  size: number;       // 笔触基础宽度
  opacity: number;    // 基础透明度
  gap: number;        // 断墨概率 0-0.5
  noise: number;      // 晕染半径
  color?: string;     // 笔刷颜色
  dryBrush?: number;  // 枯笔概率 0-0.3，新增
}

export class WabiSabiBrush extends BaseBrush {
  params: WabiSabiParams;
  private _pts: Array<{ x: number; y: number }> = [];
  private _textureCanvas: HTMLCanvasElement | null = null;

  constructor(canvas: FabricCanvas, params: WabiSabiParams) {
    super(canvas);
    this.params = params;
    this.color = params.color ?? '#1a1008';
    this.width = params.size;
    this._initTexture();
  }

  // 预生成晕染纹理（离屏Canvas）
  private _initTexture() {
    const radius = Math.max(this.params.size * 2, 8);
    const canvas = document.createElement('canvas');
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, `rgba(0,0,0,0.8)`);
    gradient.addColorStop(0.5, `rgba(0,0,0,0.3)`);
    gradient.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, radius * 2, radius * 2);

    // 飞白颗粒感：随机透明点
    const imageData = ctx.getImageData(0, 0, radius * 2, radius * 2);
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (Math.random() > 0.82) {
        imageData.data[i + 3] = Math.round(imageData.data[i + 3] * 0.2);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    this._textureCanvas = canvas;
  }

  updateParams(params: WabiSabiParams) {
    this.params = params;
    this.color = params.color ?? '#1a1008';
    this.width = params.size;
    this._initTexture(); // 重新生成纹理
  }

  // BaseBrush 要求实现的抽象方法 _render（全量重绘，此处留空，我们用增量绘制）
  _render(): void {
    // 增量绘制已在 onMouseMove 中完成，此处无需全量重绘
  }

  onMouseDown(pointer: Point, _ev: TBrushEventData): void {
    this._pts = [{ x: pointer.x, y: pointer.y }];
    const ctx = this.canvas.contextTop;
    if (ctx) {
      ctx.save();
      // 使用父类的 _setBrushStyles 设置基础样式
      super._setBrushStyles(ctx);
    }
  }

  onMouseMove(pointer: Point, _ev: TBrushEventData): void {
    this._pts.push({ x: pointer.x, y: pointer.y });
    this._drawSegment();
  }

  onMouseUp(_ev: TBrushEventData): boolean | void {
    this._finalizeStroke();
  }

  private _drawSegment() {
    const ctx = this.canvas.contextTop;
    if (!ctx || this._pts.length < 2) return;

    const prev = this._pts[this._pts.length - 2];
    const curr = this._pts[this._pts.length - 1];

    // 枯笔概率：概率墨量骤降
    const dryProb = this.params.dryBrush ?? 0.15;
    const isDry = Math.random() < dryProb;
    const inkLevel = isDry ? 0.15 + Math.random() * 0.1 : 1.0;

    // 边缘抖动：对当前点施加随机偏移
    const jitterRange = this.width * 0.08;
    const jx = (Math.random() - 0.5) * jitterRange;
    const jy = (Math.random() - 0.5) * jitterRange;

    const x = curr.x + jx;
    const y = curr.y + jy;

    // 断墨：跳过这个点
    if (Math.random() < this.params.gap) return;

    ctx.save();

    // 主笔触
    const strokeWidth = this.width * (0.6 + inkLevel * 0.4);
    ctx.globalAlpha = this.params.opacity * inkLevel;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // 晕染：在笔触旁绘制纹理印记
    if (this.params.noise > 0 && this._textureCanvas && !isDry) {
      const radius = Math.max(this.params.size * 2, 8);
      ctx.globalAlpha = this.params.opacity * 0.25 * Math.random();
      ctx.drawImage(
        this._textureCanvas,
        x - radius + (Math.random() - 0.5) * this.params.noise,
        y - radius + (Math.random() - 0.5) * this.params.noise,
        radius * 2,
        radius * 2
      );
    }

    ctx.restore();
  }

  private _finalizeStroke() {
    if (this._pts.length < 2) {
      this.canvas.contextTop?.clearRect(0, 0, this.canvas.width!, this.canvas.height!);
      this._pts = [];
      return;
    }

    const topCanvas = this.canvas.contextTop?.canvas;
    if (!topCanvas) { this._pts = []; return; }

    // 计算笔触实际边界框（加上笔宽和晕染半径的 padding）
    const pad = this.width + this.params.noise + 4;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this._pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    minX = Math.max(0, Math.floor(minX - pad));
    minY = Math.max(0, Math.floor(minY - pad));
    maxX = Math.min(topCanvas.width, Math.ceil(maxX + pad));
    maxY = Math.min(topCanvas.height, Math.ceil(maxY + pad));
    const cropW = maxX - minX;
    const cropH = maxY - minY;

    if (cropW <= 0 || cropH <= 0) {
      this.canvas.contextTop?.clearRect(0, 0, this.canvas.width!, this.canvas.height!);
      this._pts = [];
      return;
    }

    // 只截取笔触区域
    const offscreen = document.createElement('canvas');
    offscreen.width = cropW;
    offscreen.height = cropH;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.drawImage(topCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    const dataUrl = offscreen.toDataURL();

    // 清除 contextTop
    this.canvas.contextTop?.clearRect(0, 0, this.canvas.width!, this.canvas.height!);

    // 以正确坐标插入画布
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FabricImage } = require('fabric');
    FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((img: any) => {
      img.set({
        left: minX,
        top: minY,
        selectable: true,
        evented: true,
      });
      (img as any).__id = `wabisabi-${Date.now()}`;
      this.canvas.add(img);
      this.canvas.renderAll();
      this.canvas.fire('path:created', { path: img });
    });

    this._pts = [];
  }
}
