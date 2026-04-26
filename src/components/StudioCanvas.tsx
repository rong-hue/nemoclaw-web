'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Textbox, FabricImage, Polygon, Line, Triangle, Group, Gradient, Shadow } from 'fabric';
import { useTranslations } from 'next-intl';

export interface CanvasRef {
  addText: () => void;
  addRect: () => void;
  addCircle: () => void;
  addPolygon: (sides: number) => void;
  addStar: () => void;
  addLine: () => void;
  addArrow: () => void;
  enableDrawing: () => void;
  disableDrawing: () => void;
  deleteSelected: () => void;
  clearCanvas: () => void;
  uploadImage: (file: File) => void;
  addImageFromUrl: (url: string) => void;
  removeBackground: () => Promise<void>;
  setFill: (color: string) => void;
  setGradient: (type: 'linear' | 'radial', colors: string[]) => void;
  setStroke: (color: string, width: number) => void;
  setOpacity: (value: number) => void;
  setShadow: (blur: number, color: string) => void;
  setFilter: (type: string, value: number) => void;
  duplicate: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  getLayers: () => LayerItem[];
  selectLayer: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  exportJSON: () => string;
  exportImage: () => void;
  exportImageDataUrl: () => string;
}

export interface LayerItem {
  id: string;
  type: string;
  label: string;
  locked?: boolean;
  visible?: boolean;
}

interface CanvasProps {
  onSelectionChange: (obj: any) => void;
  onLayersChange: (layers: LayerItem[]) => void;
}

const StudioCanvas = forwardRef<CanvasRef, CanvasProps>(({ onSelectionChange, onLayersChange }, ref) => {
  const t = useTranslations('studio');
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  const syncLayers = (canvas: FabricCanvas) => {
    const layers: LayerItem[] = canvas.getObjects().map((obj: any, i) => ({
      id: obj.__id || String(i),
      type: obj.type || 'object',
      label: obj.type === 'textbox' ? `文字：${(obj as any).text?.slice(0, 8)}` :
        obj.type === 'rect' ? `矩形 ${i + 1}` :
        obj.type === 'circle' ? `圆形 ${i + 1}` :
        obj.type === 'image' ? `图片 ${i + 1}` : `对象 ${i + 1}`,
    }));
    onLayersChange([...layers].reverse());
  };

  useEffect(() => {
    if (!canvasEl.current) return;
    const canvas = new FabricCanvas(canvasEl.current, {
      width: 600,
      height: 500,
      backgroundColor: '#ffffff',
    });
    fabricRef.current = canvas;

    canvas.on('selection:created', (e) => onSelectionChange(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => onSelectionChange(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => onSelectionChange(null));
    canvas.on('object:added', () => syncLayers(canvas));
    canvas.on('object:removed', () => syncLayers(canvas));
    canvas.on('object:modified', () => syncLayers(canvas));

    return () => { canvas.dispose(); };
  }, []);

  useImperativeHandle(ref, () => ({
    addText: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const text = new Textbox(t('defaultText'), {
        left: 100, top: 100, width: 200,
        fontSize: 24, fill: '#1e293b', fontFamily: 'sans-serif',
      });
      (text as any).__id = Date.now().toString();
      canvas.add(text); canvas.setActiveObject(text); canvas.renderAll();
    },
    addRect: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const rect = new Rect({
        left: 80, top: 80, width: 150, height: 100,
        fill: '#f97316', rx: 8, ry: 8,
      });
      (rect as any).__id = Date.now().toString();
      canvas.add(rect); canvas.setActiveObject(rect); canvas.renderAll();
    },
    addCircle: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const circle = new Circle({
        left: 100, top: 100, radius: 60, fill: '#8b5cf6',
      });
      (circle as any).__id = Date.now().toString();
      canvas.add(circle); canvas.setActiveObject(circle); canvas.renderAll();
    },
    addPolygon: (sides: number) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const points = [];
      const radius = 60;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
      }
      const polygon = new Polygon(points, {
        left: 100, top: 100, fill: '#10b981', stroke: '#059669', strokeWidth: 2,
      });
      (polygon as any).__id = Date.now().toString();
      canvas.add(polygon); canvas.setActiveObject(polygon); canvas.renderAll();
    },
    addStar: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const points = [];
      const outerRadius = 60, innerRadius = 30, spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
      }
      const star = new Polygon(points, {
        left: 100, top: 100, fill: '#fbbf24', stroke: '#f59e0b', strokeWidth: 2,
      });
      (star as any).__id = Date.now().toString();
      canvas.add(star); canvas.setActiveObject(star); canvas.renderAll();
    },
    addLine: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const line = new Line([50, 50, 200, 50], {
        stroke: '#1e293b', strokeWidth: 3, left: 100, top: 100,
      });
      (line as any).__id = Date.now().toString();
      canvas.add(line); canvas.setActiveObject(line); canvas.renderAll();
    },
    addArrow: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const line = new Line([0, 0, 150, 0], {
        stroke: '#ef4444', strokeWidth: 3, left: 100, top: 100,
      });
      const triangle = new Triangle({
        width: 15, height: 15, fill: '#ef4444', left: 250, top: 92.5, angle: 90,
      });
      const group = new Group([line, triangle]);
      (group as any).__id = Date.now().toString();
      canvas.add(group); canvas.setActiveObject(group); canvas.renderAll();
    },
    enableDrawing: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      canvas.isDrawingMode = true;
      (canvas as any).freeDrawingBrush.color = '#1e293b';
      (canvas as any).freeDrawingBrush.width = 3;
    },
    disableDrawing: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      canvas.isDrawingMode = false;
    },
    deleteSelected: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) { canvas.remove(active); canvas.renderAll(); }
    },
    clearCanvas: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      canvas.clear(); canvas.backgroundColor = '#ffffff'; canvas.renderAll();
    },
    uploadImage: (file: File) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const url = URL.createObjectURL(file);
      FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        img.scaleToWidth(200);
        (img as any).__id = Date.now().toString();
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
      });
    },
    addImageFromUrl: (url: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        const cw = canvas.width!;
        const ch = canvas.height!;
        const maxSize = Math.min(cw, ch, 400);
        if (img.width! > img.height!) {
          img.scaleToWidth(maxSize);
        } else {
          img.scaleToHeight(maxSize);
        }
        img.set({
          left: (cw - img.getScaledWidth()) / 2,
          top: (ch - img.getScaledHeight()) / 2,
          originX: 'left',
          originY: 'top',
        });
        (img as any).__id = Date.now().toString();
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
      }).catch((err) => {
        console.error('addImageFromUrl failed:', err);
      });
    },
    removeBackground: async () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject() as FabricImage;
      if (!obj || obj.type !== 'image') {
        alert(t('removeBgSelectFirst'));
        return;
      }
      
      try {
        alert(t('removeBgProcessing'));
        const { removeBackground } = await import('@imgly/background-removal');
        
        // 将图片先转为 blob，避免 canvas tainted 问题
        const imgElement = (obj as any).getElement() as HTMLImageElement;
        const offscreen = document.createElement('canvas');
        offscreen.width = imgElement.naturalWidth || imgElement.width;
        offscreen.height = imgElement.naturalHeight || imgElement.height;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(imgElement, 0, 0);
        const sourceBlob = await new Promise<Blob>((resolve) =>
          offscreen.toBlob((b) => resolve(b!), 'image/png')
        );
        
        const blob = await removeBackground(sourceBlob, {
          output: { format: 'image/png', quality: 0.8 },
          // 使用官方 CDN，resources.json 包含完整模型资源
          publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        });
        
        const url = URL.createObjectURL(blob);
        
        FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((newImg) => {
          // 保留原图的完整变换，确保位置和大小不变
          const br = obj.getBoundingRect();
          const scaleX = br.width / newImg.width!;
          const scaleY = br.height / newImg.height!;
          newImg.set({
            left: br.left,
            top: br.top,
            scaleX,
            scaleY,
            angle: obj.angle,
            flipX: obj.flipX,
            flipY: obj.flipY,
            originX: 'left',
            originY: 'top',
          });
          (newImg as any).__id = Date.now().toString();
          canvas.remove(obj);
          canvas.add(newImg);
          canvas.setActiveObject(newImg);
          canvas.renderAll();
          alert(t('removeBgDone'));
        });
      } catch (error) {
        console.error('removeBg error:', error);
        alert(t('removeBgFailed'));
      }
    },
    setFill: (color: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('fill', color); canvas.renderAll(); }
    },
    setGradient: (type: 'linear' | 'radial', colors: string[]) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj || !obj.width || !obj.height) return;
      const gradient = new Gradient({
        type, 
        coords: type === 'linear' 
          ? { x1: 0, y1: 0, x2: obj.width, y2: 0 } 
          : { x1: obj.width / 2, y1: obj.height / 2, r1: 0, x2: obj.width / 2, y2: obj.height / 2, r2: obj.width / 2 },
        colorStops: colors.map((c, i) => ({ offset: i / (colors.length - 1), color: c })),
      });
      obj.set('fill', gradient); canvas.renderAll();
    },
    setStroke: (color: string, width: number) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set({ stroke: color, strokeWidth: width }); canvas.renderAll(); }
    },
    setOpacity: (value: number) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('opacity', value / 100); canvas.renderAll(); }
    },
    setShadow: (blur: number, color: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { 
        obj.set('shadow', new Shadow({ blur, color, offsetX: 5, offsetY: 5 })); 
        canvas.renderAll(); 
      }
    },
    setFilter: (type: string, value: number) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject() as FabricImage;
      if (!obj || obj.type !== 'image') return;
      
      // 动态导入滤镜
      import('fabric').then((fabric) => {
        const filters = (fabric as any).filters;
        const filterMap: any = {
          brightness: new filters.Brightness({ brightness: value / 100 }),
          contrast: new filters.Contrast({ contrast: value / 100 }),
          blur: new filters.Blur({ blur: value / 10 })
        };
        obj.filters = [filterMap[type]];
        obj.applyFilters();
        canvas.renderAll();
      });
    },
    duplicate: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj) return;
      (obj as any).clone().then((cloned: any) => {
        cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
        cloned.__id = Date.now().toString();
        canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll();
      });
    },
    bringForward: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { canvas.bringObjectForward(obj); canvas.renderAll(); }
    },
    sendBackward: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { canvas.sendObjectBackwards(obj); canvas.renderAll(); }
    },
    bringToFront: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { canvas.bringObjectToFront(obj); canvas.renderAll(); }
    },
    sendToBack: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { canvas.sendObjectToBack(obj); canvas.renderAll(); }
    },
    alignLeft: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('left', 0); canvas.renderAll(); }
    },
    alignCenter: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('left', (canvas.width! - obj.width! * obj.scaleX!) / 2); canvas.renderAll(); }
    },
    alignRight: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('left', canvas.width! - obj.width! * obj.scaleX!); canvas.renderAll(); }
    },
    alignTop: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('top', 0); canvas.renderAll(); }
    },
    alignMiddle: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('top', (canvas.height! - obj.height! * obj.scaleY!) / 2); canvas.renderAll(); }
    },
    alignBottom: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj) { obj.set('top', canvas.height! - obj.height! * obj.scaleY!); canvas.renderAll(); }
    },
    getLayers: () => {
      const canvas = fabricRef.current; if (!canvas) return [];
      return canvas.getObjects().map((obj: any, i) => ({
        id: obj.__id || String(i),
        type: obj.type || 'object',
        label: obj.type === 'textbox' ? `文字：${(obj as any).text?.slice(0, 8)}` :
          obj.type === 'rect' ? `矩形 ${i + 1}` :
          obj.type === 'circle' ? `圆形 ${i + 1}` :
          obj.type === 'image' ? `图片 ${i + 1}` : `对象 ${i + 1}`,
        locked: obj.lockMovementX || false,
        visible: obj.visible !== false,
      }));
    },
    selectLayer: (id: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getObjects().find((o: any) => o.__id === id);
      if (obj) { canvas.setActiveObject(obj); canvas.renderAll(); }
    },
    toggleLayerLock: (id: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getObjects().find((o: any) => o.__id === id);
      if (obj) {
        const locked = !obj.lockMovementX;
        obj.set({ lockMovementX: locked, lockMovementY: locked, lockRotation: locked, lockScalingX: locked, lockScalingY: locked, selectable: !locked });
        canvas.renderAll(); syncLayers(canvas);
      }
    },
    toggleLayerVisibility: (id: string) => {
      const canvas = fabricRef.current; if (!canvas) return;
      const obj = canvas.getObjects().find((o: any) => o.__id === id);
      if (obj) { obj.set('visible', !obj.visible); canvas.renderAll(); syncLayers(canvas); }
    },
    exportJSON: () => {
      return fabricRef.current?.toJSON() ? JSON.stringify(fabricRef.current.toJSON()) : '';
    },
    exportImage: () => {
      const canvas = fabricRef.current; if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `design-${Date.now()}.png`;
      a.click();
    },
    exportImageDataUrl: () => {
      const canvas = fabricRef.current; if (!canvas) return '';
      return canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    },
  }));

  return (
    <div className="shadow-2xl rounded-xl overflow-hidden border border-slate-700">
      <canvas ref={canvasEl} />
    </div>
  );
});

StudioCanvas.displayName = 'StudioCanvas';
export default StudioCanvas;
