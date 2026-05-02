// src/lib/WabiSabiBrush.ts
// 残缺美笔刷 — 基于 Fabric.js BaseBrush
// 策略：实时在 contextTop 预览，鼠标抬起后生成多段 fabric.Path 组合，
// 完全在 Fabric 逻辑坐标空间操作，无 devicePixelRatio 坐标转换问题。
import { BaseBrush, Canvas as FabricCanvas, Path, Point, Group } from 'fabric';
import type { TBrushEventData } from 'fabric';

export interface WabiSabiParams {
  size: number;       // 笔触基础宽度
  opacity: number;    // 基础透明度
  gap: number;        // 断墨概率 0-0.5
  noise: number;      // 晕染半径（晕染圆点偏移范围）
  color?: string;     // 笔刷颜色
  dryBrush?: number;  // 枯笔概率 0-0.3
}

// 每段笔触的绘制信息（用于最终生成 Path）
interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
  width: number;
  alpha: number;
}

export class WabiSabiBrush extends BaseBrush {
  params: WabiSabiParams;
  private _pts: Array<{ x: number; y: number }> = [];
  private _segments: Segment[] = [];  // 记录每段的宽度和透明度，用于最终生成路径

  constructor(canvas: FabricCanvas, params: WabiSabiParams) {
    super(canvas);
    this.params = params;
    this.color = params.color ?? '#1a1008';
    this.width = params.size;
  }

  updateParams(params: WabiSabiParams) {
    this.params = params;
    this.color = params.color ?? '#1a1008';
    this.width = params.size;
  }

  // BaseBrush 抽象方法，全量重绘时调用（我们用增量，此处留空）
  _render(): void {}

  onMouseDown(pointer: Point, _ev: TBrushEventData): void {
    this._pts = [{ x: pointer.x, y: pointer.y }];
    this._segments = [];
    // 清除上次残留
    this.canvas.contextTop?.clearRect(0, 0, this.canvas.width!, this.canvas.height!);
  }

  onMouseMove(pointer: Point, _ev: TBrushEventData): void {
    this._pts.push({ x: pointer.x, y: pointer.y });
    this._drawSegmentPreview();
  }

  onMouseUp(_ev: TBrushEventData): boolean | void {
    this._finalizeStroke();
    return false;
  }

  // 实时预览：在 contextTop 上增量绘制
  private _drawSegmentPreview() {
    const ctx = this.canvas.contextTop;
    if (!ctx || this._pts.length < 2) return;

    const prev = this._pts[this._pts.length - 2];
    const curr = this._pts[this._pts.length - 1];

    // 断墨：跳过
    if (Math.random() < this.params.gap) return;

    // 枯笔概率
    const dryProb = this.params.dryBrush ?? 0.15;
    const isDry = Math.random() < dryProb;
    const inkLevel = isDry ? 0.15 + Math.random() * 0.1 : 1.0;

    // 边缘抖动
    const jitter = this.width * 0.08;
    const x = curr.x + (Math.random() - 0.5) * jitter;
    const y = curr.y + (Math.random() - 0.5) * jitter;

    const strokeWidth = this.width * (0.6 + inkLevel * 0.4);
    const alpha = this.params.opacity * inkLevel;

    // 记录这段信息，供最终生成 Path 使用
    this._segments.push({ x1: prev.x, y1: prev.y, x2: x, y2: y, width: strokeWidth, alpha });

    // contextTop 预览
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // 晕染预览（小圆点）
    if (this.params.noise > 0 && !isDry) {
      const nr = this.width * 0.3 + Math.random() * this.width * 0.2;
      const nx = x + (Math.random() - 0.5) * this.params.noise * 2;
      const ny = y + (Math.random() - 0.5) * this.params.noise * 2;
      ctx.globalAlpha = alpha * 0.3 * Math.random();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 最终生成：把所有段转为 fabric.Path 对象，加入画布
  private _finalizeStroke() {
    // 清除预览层
    this.canvas.contextTop?.clearRect(0, 0, this.canvas.width!, this.canvas.height!);

    if (this._segments.length === 0) {
      this._pts = [];
      this._segments = [];
      return;
    }

    const color = this.color;
    const baseOpacity = this.params.opacity;

    // 按透明度分组，相近透明度的段合并成一条 Path，减少对象数量
    // 简化：每段生成一个短 Path，最后 Group 打包
    const paths: Path[] = [];

    for (const seg of this._segments) {
      const pathData = `M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}`;
      const p = new Path(pathData, {
        stroke: color,
        strokeWidth: seg.width,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        fill: '',
        opacity: seg.alpha,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      paths.push(p);
    }

    // 晕染圆点（从 _pts 里采样）
    if (this.params.noise > 0) {
      const step = Math.max(1, Math.floor(this._pts.length / 10));
      for (let i = 0; i < this._pts.length; i += step) {
        if (Math.random() > 0.6) continue;
        const pt = this._pts[i];
        const r = this.width * 0.25 + Math.random() * this.width * 0.2;
        const nx = pt.x + (Math.random() - 0.5) * this.params.noise * 2;
        const ny = pt.y + (Math.random() - 0.5) * this.params.noise * 2;
        const dot = new Path(`M ${nx - r} ${ny} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`, {
          fill: color,
          stroke: '',
          opacity: baseOpacity * 0.25 * Math.random(),
          selectable: false,
          evented: false,
          objectCaching: false,
        });
        paths.push(dot);
      }
    }

    if (paths.length === 0) {
      this._pts = [];
      this._segments = [];
      return;
    }

    // 用 Group 打包，作为一个整体对象插入画布，支持移动/撤销
    const group = new Group(paths, {
      selectable: true,
      evented: true,
      objectCaching: true,
    });
    (group as any).__id = `wabisabi-${Date.now()}`;

    this.canvas.add(group);
    this.canvas.renderAll();
    this.canvas.fire('path:created', { path: group });

    this._pts = [];
    this._segments = [];
  }
}
