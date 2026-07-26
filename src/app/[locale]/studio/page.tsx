'use client';
export const runtime = 'edge';

import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Box, Check, Loader2, LayoutGrid, Wand2, Download, Sparkles, MoreHorizontal } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseAuth, type User } from '@/lib/supabase-auth';
import StudioCanvas, { CanvasRef, LayerItem } from '@/components/StudioCanvas';
import Toolbar from '@/components/StudioToolbar';
import PropertiesPanel from '@/components/StudioProperties';
import Preview3D from '@/components/Preview3D';
import AiGeneratePanel from '@/components/AiGeneratePanel';
import StampPanel from '@/components/StampPanel';
import TalismanPanel from '@/components/TalismanPanel';
import ProductPreview, { type ProductPreviewHandle } from '@/components/studio/ProductPreview';
import type { ProductType } from '@/lib/totem-mapping';
import StampCursor from '@/components/StampCursor';
import WabiSabiBrushPanel from '@/components/WabiSabiBrushPanel';
import type { WabiSabiParams } from '@/components/WabiSabiBrushPanel';
import { designsService, subscriptionsService, FREE_DESIGNS_LIMIT, PRO_DESIGNS_LIMIT } from '@/lib/supabase';
import { getTalismanById } from '@/lib/talismans';
import type { Stamp } from '@/lib/stamps';

function StudioContent() {
  const t = useTranslations('studio');
  const locale = useLocale();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    supabaseAuth.getCurrentUser().then(user => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        subscriptionsService.getActiveByUser(user.id).then(sub => {
          setIsPro(!!sub);
        }).catch(() => setIsPro(false));
      }
    });
    const subscription = supabaseAuth.onAuthStateChange(user => setCurrentUser(user));
    return () => subscription.unsubscribe();
  }, []);
  const router = useRouter();
  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState('select');
  const [selected, setSelected] = useState<any>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [show3DInTotem, setShow3DInTotem] = useState(false);
  // 风格转换 Modal
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [styleFile, setStyleFile] = useState<File | null>(null);
  const [stylePreview, setStylePreview] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'shuimo'|'gongbi'|'ukiyo'|'cyberpunk'|'liubai'>('shuimo');
  const [styleLoading, setStyleLoading] = useState(false);
  const [styleError, setStyleError] = useState('');
  const styleFileRef = useRef<HTMLInputElement>(null);
  // AI 融合 Modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeResultUrl, setMergeResultUrl] = useState('');
  const [showMergeResult, setShowMergeResult] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [totemCompositeUrl, setTotemCompositeUrl] = useState(''); // 正面合成图
  const [backCompositeUrl, setBackCompositeUrl] = useState('');   // 背面合成图
  // ref 版本：onClick async 里用 setState 有时序问题，先存 ref 再 setState
  const totemCompositeRef = useRef('');
  const backCompositeRef = useRef('');
  const [selectedZoneFace, setSelectedZoneFace] = useState<'front' | 'back' | 'side'>('front');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const productPreviewRef = useRef<ProductPreviewHandle>(null);
  const [designId, setDesignId] = useState<string | undefined>(undefined);
  // ref 版本：handleSave 是 async 函数，存在并发竞态——第一次保存还在 await 时
  // 第二次保存也开始执行，两次都读到 designId=undefined，导致重复 insert
  // 用 ref 同步更新，让 async 函数内立刻能读到最新值
  const designIdRef = useRef<string | undefined>(undefined);
  const [designTitle, setDesignTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string>('');
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  // 同步更新 ref，供 triggerAutoSave 闭包内检查
  const setLoadingDesign = (v: boolean) => {
    isLoadingDesignRef.current = v;
    setIsLoadingDesign(v);
  };
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHeaderMore, setShowMobileHeaderMore] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [showStampPanel, setShowStampPanel] = useState(false);
  const [showTalismanPanel, setShowTalismanPanel] = useState(false);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [productPreviewType, setProductPreviewType] = useState<ProductType>('tshirt');
  const [showWabiPanel, setShowWabiPanel] = useState(false);
  const [wabiParams, setWabiParams] = useState<WabiSabiParams>({ size: 8, opacity: 0.7, gap: 0.15, noise: 4 });
  const [activeStampId, setActiveStampId] = useState<string | null>(null);
  const [activeStampSrc, setActiveStampSrc] = useState<string | null>(null);
  const [stampCursorParams, setStampCursorParams] = useState<{ size: number; angle: number }>({ size: 120, angle: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(800);
  const [customW, setCustomW] = useState('800');
  const [customH, setCustomH] = useState('800');
  const [canvasScale, setCanvasScale] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 根据容器尺寸计算画布缩放比，保证画布完整显示在容器内
  const updateCanvasScale = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const padding = 64; // p-8 = 32px * 2
    const availW = container.clientWidth - padding;
    const availH = container.clientHeight - padding;
    const scaleW = availW / canvasW;
    const scaleH = availH / canvasH;
    const scale = Math.min(1, scaleW, scaleH);
    setCanvasScale(scale > 0 ? scale : 1);
  }, [canvasW, canvasH]);

  useEffect(() => {
    updateCanvasScale();
    const observer = new ResizeObserver(updateCanvasScale);
    if (canvasContainerRef.current) observer.observe(canvasContainerRef.current);
    return () => observer.disconnect();
  }, [updateCanvasScale]);

  // 刷新 undo/redo 可用状态
  const refreshUndoRedo = () => {
    setCanUndo(canvasRef.current?.canUndo() ?? false);
    setCanRedo(canvasRef.current?.canRedo() ?? false);
  };

  // 自动保存：debounce 10s
  // 注意：useLoadingDesignRef 用于在加载设计期间阻止自动保存（防止保存空画布）
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingDesignRef = useRef(false);
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (!isLoadingDesignRef.current) {
        autoSaveRef.current();
      }
    }, 10000);
  }, []);

  const PRESETS = [
    { label: 'Square 1:1', w: 800, h: 800 },
    { label: 'Portrait 4:5', w: 800, h: 1000 },
    { label: 'Story 9:16', w: 720, h: 1280 },
    { label: 'Landscape 16:9', w: 1280, h: 720 },
    { label: 'A4', w: 794, h: 1123 },
  ];

  const applySize = (w: number, h: number) => {
    setCanvasW(w); setCanvasH(h);
    setCustomW(String(w)); setCustomH(String(h));
    canvasRef.current?.resizeCanvas(w, h);
  };

  // 从 URL 加载设计（?design=<id>）
  useEffect(() => {
    const designIdFromUrl = searchParams?.get('design');
    if (!designIdFromUrl) return;
    if (authLoading) { return; }
    if (!currentUser) { return; }
    if (!canvasReady) { return; }  // 等 canvas 初始化完成再加载
    // 检查画布是否真的有内容，避免 SPA 路由复用时 designId 相同但画布为空的情况
    const currentJson = canvasRef.current?.exportJSON();
    let canvasHasContent = false;
    try {
      const parsed = currentJson ? JSON.parse(currentJson) : null;
      canvasHasContent = !!(parsed?.objects && parsed.objects.length > 0);
    } catch { canvasHasContent = false; }
    if (designId === designIdFromUrl && canvasHasContent) { return; }

    setLoadError('');
    setLoadingDesign(true);
    
    // 用局部变量捕获当前 designIdFromUrl，避免 effect 依赖变化时
    // 异步回调内的 designIdFromUrl 已被覆盖为新的
    const targetDesignId = designIdFromUrl;
    
    (async () => {
      try {
        // 加载前验证 auth 状态（避免 session 过期时静默失败）
        const liveUser = await supabaseAuth.getCurrentUser();
        if (!liveUser) {
          setLoadError(t('loadErrorAuth'));
          setLoadingDesign(false);
          return;
        }
        
        let design: any;
        try {
          design = await designsService.getById(targetDesignId);
        } catch (fetchErr: any) {
          const msg = fetchErr?.message || String(fetchErr);
          if (msg.includes('PGRST116') || msg.includes('contains 0 rows') || msg.includes('not found')) {
            setLoadError(t('loadErrorNotFound'));
          } else if (msg.includes('JWT') || msg.includes('token') || msg.includes('auth')) {
            setLoadError(t('loadErrorAuth'));
          } else if (msg.includes('network') || msg.includes('fetch')) {
            setLoadError(t('loadErrorNetwork'));
          } else {
            // 尝试重试一次（可能是暂时的网络波动）
            console.warn('[Studio] First load attempt failed:', msg, 'retrying...');
            try {
              design = await designsService.getById(targetDesignId);
            } catch (retryErr: any) {
              setLoadError(t('loadErrorGeneral', { message: retryErr?.message || String(retryErr) }));
              setLoadingDesign(false);
              return;
            }
          }
          if (!design) { setLoadingDesign(false); return; }
        }
        
        // 检查 canvas_json 是否有实际内容（空对象 {} 是无效数据，不加载）
        const cjObj = typeof design.canvas_json === 'string'
          ? JSON.parse(design.canvas_json)
          : design.canvas_json;
        const hasObjects = Array.isArray(cjObj?.objects) && cjObj.objects.length > 0;
        if (design.canvas_json && hasObjects) {
          // 检查是否包含可能过期的图片 URL（诊断用）
          let imageCount = 0;
          for (const obj of cjObj.objects || []) {
            if (obj.type === 'Image' || obj.type === 'image') {
              imageCount++;
              if (typeof obj.src === 'string' && !obj.src.startsWith('data:') && !obj.src.startsWith('blob:')) {
                console.log('[Studio] Design contains remote image URL:', obj.src?.substring(0, 80));
              }
            }
          }
          if (imageCount > 0) {
            console.log(`[Studio] Design has ${imageCount} image object(s), checking load...`);
          }
          
          setDesignTitle(design.title || '');
          designIdRef.current = design.id;
          setDesignId(design.id);
          const jsonData = typeof design.canvas_json === 'string'
            ? design.canvas_json
            : JSON.stringify(design.canvas_json);
          try {
            await canvasRef.current!.loadFromJSON(jsonData);
            console.log('[Studio] Design loaded successfully:', targetDesignId);
            setLoadingDesign(false);
          } catch(e) {
            console.error('[Studio] loadFromJSON error:', e);
            setLoadError(t('loadErrorParse'));
            setLoadingDesign(false);
          }
        } else {
          setLoadError(t('loadErrorEmpty'));
          setLoadingDesign(false);
        }
      } catch (err) {
        console.error('[Studio] Failed to load design:', err);
        setLoadError(t('loadErrorGeneral', { message: (err as Error)?.message || String(err) }));
        setLoadingDesign(false);
      }
    })();
  }, [searchParams, authLoading, currentUser?.id, canvasReady]); // canvasReady 确保 canvas 初始化后再加载

  // 从 Gallery 跳转过来时，自动加载 artwork 图片到画布
  useEffect(() => {
    const artworkUrl = searchParams?.get('artwork');
    if (!artworkUrl) return;
    // 等画布初始化完成后再加载
    const timer = setTimeout(() => {
      canvasRef.current?.addImageFromUrl(decodeURIComponent(artworkUrl));
    }, 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // 用 ref 存储 handleSave，避免键盘事件闭包问题
  const handleSaveRef = useRef<(silent?: boolean) => void>(() => {});

  // 自动保存专用 ref（silent=true，未登录时不触发导出弹窗）
  const autoSaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          canvasRef.current?.deleteSelected();
          setTimeout(refreshUndoRedo, 0);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        canvasRef.current?.duplicate();
        setTimeout(refreshUndoRedo, 0);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
      // Ctrl+Z / Cmd+Z 撤销
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        canvasRef.current?.undo();
        setTimeout(refreshUndoRedo, 50);
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z 重做
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        canvasRef.current?.redo();
        setTimeout(refreshUndoRedo, 50);
      }
      // Esc 退出印章监听状态，但保留印章面板
      if (e.key === 'Escape' && activeTool === 'stamp') {
        canvasRef.current?.disableStampMode();
        setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]); // 移除 currentUser/designId/designTitle 依赖

  const handleUploadImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) canvasRef.current?.uploadImage(file);
  };

  const handleExportJSON = () => {
    const json = canvasRef.current?.exportJSON();
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${Date.now()}.json`;
      a.click();
    }
  };

  const handleExportImage = async () => {
    const userId = currentUser?.id || currentUser?.email || '';
    if (userId) {
      const activeSub = await subscriptionsService.getActiveByUser(userId).catch(() => null);
      if (!activeSub) {
        // 免费用户：限制 800px 导出
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.exportImageDataUrl();
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `design-${Date.now()}-preview.png`;
          a.click();
          setShowUpgradeModal(true);
        }
        return;
      }
    }
    // 订阅用户或未登录：正常导出
    canvasRef.current?.exportImage();
  };

  const handleSave = async (silent = false) => {
    const json = canvasRef.current?.exportJSON();
    if (!json) return;

    // 实时获取用户，避免 state 过期
    const liveUser = await supabaseAuth.getCurrentUser();
    if (!liveUser?.id) {
      // 自动保存时未登录则静默跳过
      if (!silent) handleExportJSON();
      return;
    }

    setSaveStatus('saving');
    try {
      const previewUrl = await canvasRef.current?.exportThumbnail?.() || '';
      const title = designTitle || t('untitled');
      
      // 将 JSON 字符串转为对象
      let canvasData: object;
      try {
        canvasData = JSON.parse(json);
      } catch {
        canvasData = {};
      }
      
      // 用 ref 读取最新 designId，避免并发竞态（多个 async handleSave 同时执行时
      // 第一次保存还在 await，第二次也开始了，两次都读到 undefined → 重复 insert）
      const currentDesignId = designIdRef.current;

      // 新建作品时检查数量上限
      if (!currentDesignId) {
        const activeSub = await subscriptionsService.getActiveByUser(liveUser.id).catch(() => null);
        const isPro = !!activeSub;
        const designsLimit = isPro ? PRO_DESIGNS_LIMIT : FREE_DESIGNS_LIMIT;
        const count = await designsService.getCount(liveUser.id);
        if (count >= designsLimit) {
          if (!silent) {
            // 手动保存时提示用户
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
            alert(isPro
              ? `已达到 Pro 计划上限（${PRO_DESIGNS_LIMIT} 个设计），请删除一些旧作品后再保存。`
              : `免费版最多保存 ${FREE_DESIGNS_LIMIT} 个设计，请升级 Pro 或删除旧作品。`);
          }
          // 自动保存时静默跳过，不打扰用户
          return;
        }
      }

      const saved = await designsService.save({
        id: currentDesignId,
        user_id: liveUser.id,
        user_email: liveUser.email || '',
        title,
        canvas_json: canvasData as any,
        preview_url: previewUrl,
      });
      // 只在新建作品时设置 ID，避免触发重新加载
      if (!currentDesignId) {
        designIdRef.current = saved.id; // 立刻同步更新 ref，阻断后续并发 insert
        setDesignId(saved.id);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 10000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 10000);
    }
  };
  // 始终保持 ref 最新
  handleSaveRef.current = handleSave;
  autoSaveRef.current = () => handleSave(true);

  // 上传图片到 /api/upload-image，返回公开 URL
  const uploadImageFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url as string;
  };

  // 上传 data URL（canvas 导出）到 /api/upload-image，返回公开 URL
  const uploadDataUrl = async (dataUrl: string, filename = 'canvas.png'): Promise<string> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    return uploadImageFile(file);
  };

  // 风格转换：执行
  const handleStyleTransfer = async () => {
    if (!styleFile) return;
    setStyleLoading(true);
    setStyleError('');
    try {
      const imageUrl = await uploadImageFile(styleFile);
      const res = await fetch('/api/ai-style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, style: selectedStyle }),
      });
      // Safe JSON parse — Cloudflare edge errors return HTML, not JSON
      const rawText = await res.text();
      const contentType = res.headers.get('content-type') || '';
      let data: Record<string, unknown>;
      if (!contentType.includes('application/json') || rawText.trimStart().startsWith('<')) {
        console.error('[style-transfer] Non-JSON response:', res.status, rawText.slice(0, 300));
        throw new Error(`Server error (${res.status}): please try again`);
      }
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error('[style-transfer] JSON parse error:', rawText.slice(0, 300));
        throw new Error(`Server error (${res.status}): unexpected response format`);
      }
      if (!res.ok) {
        if (data.error === 'quota_exceeded') throw new Error(locale === 'zh' ? '今日配额已用完，请明天再试或升级 Pro' : 'Daily quota reached. Try again tomorrow or upgrade to Pro');
        throw new Error(data.error || 'Style transfer failed');
      }
      canvasRef.current?.addImageFromUrl(data.url);
      setShowStyleModal(false);
      setStyleFile(null);
      setStylePreview('');
    } catch (err: unknown) {
      setStyleError(err instanceof Error ? err.message : String(err));
    } finally {
      setStyleLoading(false);
    }
  };

  // AI 融合：执行
  const handleAiMerge = async () => {
    setMergeLoading(true);
    setMergeError('');
    setMergeResultUrl('');
    try {
      // 导出商品预览图（ProductPreview canvas）
      const productDataUrl = productPreviewRef.current?.exportDataUrl?.() || previewDataUrl;
      if (!productDataUrl) throw new Error(locale === 'zh' ? '请先在图腾映射中预览商品' : 'Please preview the product in Totem Mapping first');
      const productImageUrl = await uploadDataUrl(productDataUrl, 'product.png');

      // 上传设计图（previewDataUrl 是 canvas 导出的 data URL）
      let designImageUrl: string;
      if (previewDataUrl && previewDataUrl.startsWith('data:')) {
        designImageUrl = await uploadDataUrl(previewDataUrl, 'design.png');
      } else if (previewDataUrl) {
        designImageUrl = previewDataUrl;
      } else {
        throw new Error(locale === 'zh' ? '没有设计图，请先在画布上创作' : 'No design found. Please create something on the canvas first');
      }

      const res = await fetch('/api/ai-totem-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productImageUrl, designImageUrl, productType: productPreviewType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'quota_exceeded') throw new Error(locale === 'zh' ? '今日配额已用完，请明天再试或升级 Pro' : 'Daily quota reached. Try again tomorrow or upgrade to Pro');
        throw new Error(data.error || 'AI merge failed');
      }
      setMergeResultUrl(data.url);
      setShowMergeResult(true);
    } catch (err: unknown) {
      setMergeError(err instanceof Error ? err.message : String(err));
    } finally {
      setMergeLoading(false);
    }
  };

  const handleOpenTotemMap = () => {
    const dataUrl = canvasRef.current?.exportImageDataUrl?.();
    console.log('[TotemMap] previewDataUrl length:', dataUrl?.length, 'starts:', dataUrl?.substring(0, 50));
    setPreviewDataUrl(dataUrl || '');
    setShowProductPreview(true);
  };

  const STYLE_LABELS: Record<string, string> = locale === 'zh' ? {
    shuimo: '水墨',
    gongbi: '工笔',
    ukiyo: '浮世绘',
    cyberpunk: '赛博国风',
    liubai: '留白',
  } : {
    shuimo: 'Ink Wash',
    gongbi: 'Gongbi',
    ukiyo: 'Ukiyo-e',
    cyberpunk: 'Cyber Guofeng',
    liubai: 'Negative Space',
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (tool !== 'draw') canvasRef.current?.disableDrawing();
    if (tool !== 'wabisabi') {
      canvasRef.current?.disableWabiSabiBrush?.();
      setShowWabiPanel(false);
    }
    if (tool !== 'stamp') {
      canvasRef.current?.disableStampMode();
      setShowStampPanel(false);
      setActiveStampId(null);
    }
  };

  const handleStampSelect = (stamp: Stamp, size: number, angle: number) => {
    setActiveStampId(stamp.id);
    setActiveStampSrc(stamp.src);
    setStampCursorParams({ size, angle });
    canvasRef.current?.enableStampMode(stamp.src, size, angle);
  };

  const saveButtonContent = () => {
    if (saveStatus === 'saving') return <><Loader2 size={16} className="animate-spin" />{t('saving')}</>;
    if (saveStatus === 'saved') return <><Check size={16} />{t('saved')}</>;
    if (saveStatus === 'error') return <><Save size={16} />{t('saveFailed')}</>;
    return <><Save size={16} />{t('save')}</>;
  };

  const saveButtonClass = () => {
    if (saveStatus === 'saved') return 'bg-green-500 hover:bg-green-600';
    if (saveStatus === 'error') return 'bg-red-500 hover:bg-red-600';
    return 'bg-orange-500 hover:bg-orange-600';
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-200">{t('title')}</h1>
            <input
              type="text"
              value={designTitle}
              onChange={e => setDesignTitle(e.target.value)}
              placeholder={t('untitled')}
              className="text-xs text-slate-400 bg-transparent border-none outline-none w-40 placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-slate-400 hidden md:block">{currentUser.name || currentUser.email}</span>
            </div>
          )}
          <button
            onClick={() => {
              if (!currentUser) {
                const callbackPath = encodeURIComponent(`/${locale}/studio${window.location.search}`);
                window.location.href = `/${locale}/auth?callbackUrl=${callbackPath}`;
                return;
              }
              setStyleFile(null);
              setStylePreview('');
              setStyleError('');
              setShowStyleModal(true);
            }}
            className="hidden md:flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <Wand2 size={16} />
            {locale === 'zh' ? '风格转换' : 'Style AI'}
          </button>
          <button
            onClick={handleOpenTotemMap}
            className="hidden md:flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <Box size={16} />
            {locale === 'zh' ? '图腾映射' : 'Totem Map'}
          </button>

          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <LayoutGrid size={16} />
            <span className="hidden md:inline">{t('myDesigns')}</span>
          </Link>

          {/* 手机端更多操作按钮 */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMobileHeaderMore(v => !v)}
              className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-all"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMobileHeaderMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileHeaderMore(false)} />
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 w-48 py-1">
                  <button
                    onClick={() => {
                      setShowMobileHeaderMore(false);
                      if (!currentUser) {
                        const callbackPath = encodeURIComponent(`/${locale}/studio${window.location.search}`);
                        window.location.href = `/${locale}/auth?callbackUrl=${callbackPath}`;
                        return;
                      }
                      setStyleFile(null);
                      setStylePreview('');
                      setStyleError('');
                      setShowStyleModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Wand2 size={16} className="text-purple-400" />
                    {locale === 'zh' ? '风格转换' : 'Style AI'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileHeaderMore(false);
                      handleOpenTotemMap();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Box size={16} className="text-amber-400" />
                    {locale === 'zh' ? '图腾映射' : 'Totem Map'}
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 ${saveButtonClass()}`}
          >
            {saveStatus === 'saving' ? <><Loader2 size={16} className="animate-spin" /><span className="hidden md:inline">{t('saving')}</span></> :
             saveStatus === 'saved'  ? <><Check size={16} /><span className="hidden md:inline">{t('saved')}</span></> :
             saveStatus === 'error'  ? <><Save size={16} /><span className="hidden md:inline">{t('saveFailed')}</span></> :
             <><Save size={16} /><span className="hidden md:inline">{t('save')}</span></>}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          onAddText={() => canvasRef.current?.addText()}
          onAddRect={() => canvasRef.current?.addRect()}
          onAddCircle={() => canvasRef.current?.addCircle()}
          onAddPolygon={() => canvasRef.current?.addPolygon(6)}
          onAddStar={() => canvasRef.current?.addStar()}
          onAddLine={() => canvasRef.current?.addLine()}
          onAddArrow={() => canvasRef.current?.addArrow()}
          onUploadImage={handleUploadImage}
          onAiGenerate={() => {
            if (authLoading) return;
            if (!currentUser) {
              // Use relative path as callbackUrl so NextAuth doesn't reject cross-domain URLs
              const callbackPath = encodeURIComponent(`/${locale}/studio${window.location.search}`);
              window.location.href = `/${locale}/auth?callbackUrl=${callbackPath}`;
              return;
            }
            setShowAiPanel(true);
          }}
          onEnableDrawing={() => canvasRef.current?.enableDrawing()}
          onRemoveBackground={() => canvasRef.current?.removeBackground()}
          onDelete={() => canvasRef.current?.deleteSelected()}
          onDuplicate={() => canvasRef.current?.duplicate()}
          onStamp={() => { handleToolChange('stamp'); setShowStampPanel(true); }}
          onTalisman={() => { setShowTalismanPanel(v => !v); }}
          onWabiSabi={() => { handleToolChange('wabisabi'); setShowWabiPanel(true); canvasRef.current?.enableWabiSabiBrush?.(wabiParams); }}
          onClear={() => canvasRef.current?.clearCanvas()}
          onExport={handleExportJSON}
          onExportImage={handleExportImage}
          onUndo={() => { canvasRef.current?.undo(); setTimeout(refreshUndoRedo, 50); }}
          onRedo={() => { canvasRef.current?.redo(); setTimeout(refreshUndoRedo, 50); }}
          canUndo={canUndo}
          canRedo={canRedo}
          activeTool={activeTool}
          setActiveTool={handleToolChange}
          toolLabels={{
            select: t('tools.select'),
            brush: t('tools.brush'),
            stamp: t('tools.stamp'),
            talisman: t('tools.talisman'),
            wabiSabi: t('tools.wabiSabi'),
            text: t('tools.text'),
            rect: t('tools.rect'),
            circle: t('tools.circle'),
            polygon: t('tools.polygon'),
            star: t('tools.star'),
            line: t('tools.line'),
            arrow: t('tools.arrow'),
            image: t('tools.image'),
            aiGenerate: t('tools.aiGenerate'),
            visualComponents: t('tools.visualComponents'),
            removeBg: t('tools.removeBg'),
            duplicate: t('tools.duplicate'),
            delete: t('tools.delete'),
            clear: t('tools.clear'),
            exportJSON: t('tools.exportJSON'),
            exportPNG: t('tools.exportPNG'),
          }}
        />

        <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板：案头端包裹为底部抽屉 */}
        {(() => {
          const showAnyPanel = showStampPanel || showWabiPanel || showTalismanPanel;
          const panelContent = (
            <>
              {/* 拖拽指示条（手机端） */}
              {isMobile && (
                <div className="flex justify-center py-2 cursor-pointer" onClick={() => {
                  if (showStampPanel) { setShowStampPanel(false); setActiveStampId(null); canvasRef.current?.disableStampMode(); handleToolChange('select'); }
                  if (showWabiPanel)  { setShowWabiPanel(false);  handleToolChange('select'); }
                  if (showTalismanPanel) { setShowTalismanPanel(false); }
                }}>
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>
              )}

              {/* 印章面板 */}
              {showStampPanel && (
                <StampPanel
                  onStampSelect={handleStampSelect}
                  onClose={() => {
                    setShowStampPanel(false);
                    setActiveStampId(null);
                    canvasRef.current?.disableStampMode();
                    handleToolChange('select');
                  }}
                  activeStampId={activeStampId}
                  onParamsChange={(size, angle) => {
                    canvasRef.current?.updateStampParams(size, angle);
                    setStampCursorParams({ size, angle });
                  }}
                  onCustomTextStamp={(text) => {
                    canvasRef.current?.addCustomTextStamp(text);
                  }}
                  onComboStamp={(stamp, size, angle, text, offsetX, offsetY) => {
                    canvasRef.current?.addComboStamp(stamp.src, size, angle, text, offsetX, offsetY);
                  }}
                />
              )}

              {/* 残缺美笔刷面板 */}
              {showWabiPanel && (
                <WabiSabiBrushPanel
                  onClose={() => { setShowWabiPanel(false); handleToolChange('select'); }}
                  onParamsChange={(p) => {
                    setWabiParams(p);
                    canvasRef.current?.updateWabiSabiParams?.(p);
                  }}
                />
              )}

              {/* 护身符面板 */}
              {showTalismanPanel && (
                <TalismanPanel
                  isPro={isPro}
                  onSelectTalisman={async (talismanId, symbol, color) => {
                    // 服务端权限验证（防止前端绕过）
                    try {
                      const res = await fetch('/api/talisman/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ talismanId }),
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data.error || t('talisman.upgradeRequired'));
                        return;
                      }
                    } catch {
                      // 网络异常时不阻断操作（降级到纯前端校验）
                    }
                    // 将护身符作为 emoji + 名称 + 祝福语组合添加到画布
                    const talisman = getTalismanById(talismanId);
                    const name = locale === 'zh' ? talisman?.meaning.zh : talisman?.meaning.en;
                    const blessing = locale === 'zh' ? talisman?.blessing.zh : talisman?.blessing.en;
                    canvasRef.current?.addTalisman(symbol, name || '', color, blessing || '');
                    setShowTalismanPanel(false);
                  }}
                />
              )}
            </>
          );

          if (isMobile) {
            if (!showAnyPanel) return null;
            return (
              <div className="fixed inset-x-0 bottom-14 z-40 bg-slate-900 border-t border-slate-700 rounded-t-xl shadow-2xl max-h-[60vh] overflow-y-auto">
                {panelContent}
              </div>
            );
          }
          return panelContent;
        })()}

        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800 pb-14 md:pb-0">
          {/* 画布尺寸控制栏 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-700 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applySize(p.w, p.h)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  p.w === canvasW && p.h === canvasH
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
              <input
                type="number" min={100} max={4000}
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-16 text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 outline-none focus:border-orange-500"
              />
              <span className="text-slate-500 text-xs">×</span>
              <input
                type="number" min={100} max={4000}
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-16 text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 outline-none focus:border-orange-500"
              />
              <button
                onClick={() => {
                  const w = Math.min(4000, Math.max(100, Number(customW)));
                  const h = Math.min(4000, Math.max(100, Number(customH)));
                  applySize(w, h);
                }}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-all"
              >
                Apply
              </button>
            </div>
            <span className="text-slate-500 text-xs ml-1">{canvasW} × {canvasH} px</span>
          </div>
          {/* 设计加载错误提示 */}
          {loadError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 mx-4 mt-2 flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠️ {loadError}</span>
              <button
                onClick={() => setLoadError('')}
                className="ml-auto text-red-400 hover:text-red-300 text-sm"
              >
                ✕
              </button>
            </div>
          )}
          {/* 设计加载中 */}
          {isLoadingDesign && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 mx-4 mt-2 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-blue-400 text-sm">{t('loadingDesign')}</span>
            </div>
          )}
          {/* 画布区域 */}
          <div
            ref={canvasContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden relative"
            style={{ cursor: showStampPanel && activeStampSrc ? 'none' : 'default' }}
            onContextMenu={(e) => {
              // 右键退出印章监听状态，但保留印章面板
              if (activeTool === 'stamp') {
                e.preventDefault();
                canvasRef.current?.disableStampMode();
                setActiveTool('select');
              }
            }}
          >
            {/* CSS scale 包裹层：逻辑尺寸不变，视觉上 fit 到容器 */}
            <div
              style={{
                transform: `scale(${canvasScale})`,
                transformOrigin: 'center center',
                width: canvasW,
                height: canvasH,
                flexShrink: 0,
              }}
            >
              <StudioCanvas
                ref={canvasRef}
                onReady={() => setCanvasReady(true)}
                onSelectionChange={setSelected}
                onLayersChange={(layers) => { setLayers(layers); refreshUndoRedo(); triggerAutoSave(); }}
                initialWidth={canvasW}
                initialHeight={canvasH}
                onExitStampMode={() => {
                  // 盖章后自动退出监听状态，保留印章面板供用户继续选择
                  setActiveTool('select');
                }}
              />
            </div>
            {showStampPanel && activeStampSrc && (
              <StampCursor
                src={activeStampSrc}
                size={stampCursorParams.size}
                angle={stampCursorParams.angle}
                containerRef={canvasContainerRef}
              />
            )}
          </div>
        </div>

        <PropertiesPanel
          selected={selected}
          onFillChange={(c) => canvasRef.current?.setFill(c)}
          onGradientChange={(t, c) => canvasRef.current?.setGradient(t, c)}
          onStrokeChange={(c, w) => canvasRef.current?.setStroke(c, w)}
          onOpacityChange={(v) => canvasRef.current?.setOpacity(v)}
          onShadowChange={(b, c) => canvasRef.current?.setShadow(b, c)}
          onFilterChange={(t, v) => canvasRef.current?.setFilter(t, v)}
          layers={layers}
          onSelectLayer={(id) => canvasRef.current?.selectLayer(id)}
          onToggleLock={(id) => canvasRef.current?.toggleLayerLock(id)}
          onToggleVisibility={(id) => canvasRef.current?.toggleLayerVisibility(id)}
          onRenameLayer={(id, label) => canvasRef.current?.renameLayer(id, label)}
          onBringForward={() => canvasRef.current?.bringForward()}
          onSendBackward={() => canvasRef.current?.sendBackward()}
          onBringToFront={() => canvasRef.current?.bringToFront()}
          onSendToBack={() => canvasRef.current?.sendToBack()}
          onAlignLeft={() => canvasRef.current?.alignLeft()}
          onAlignCenter={() => canvasRef.current?.alignCenter()}
          onAlignRight={() => canvasRef.current?.alignRight()}
          onAlignTop={() => canvasRef.current?.alignTop()}
          onAlignMiddle={() => canvasRef.current?.alignMiddle()}
          onAlignBottom={() => canvasRef.current?.alignBottom()}
        />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

{showProductPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-y-auto shadow-2xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {locale === 'zh' ? '图腾映射' : 'Totem Mapping'}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {locale === 'zh' ? '选择商品，点击区域放置你的图腾' : 'Choose a product and click a zone to place your totem'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 3D 旋转开关 */}
                <button
                  onClick={() => {
                    setMergeError('');
                    setMergeResultUrl('');
                    setShowMergeResult(false);
                    handleAiMerge();
                  }}
                  disabled={mergeLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-slate-800 border-slate-600 text-slate-300 hover:border-purple-500 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={locale === 'zh' ? 'AI 融合生成效果图' : 'AI Merge'}
                >
                  {mergeLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {locale === 'zh' ? 'AI 融合' : 'AI Merge'}
                </button>
                <button
                  onClick={async () => {
                    if (!show3DInTotem) {
                      // 同时导出正面合成图和 mug 背面合成图
                      const [composite, mugBack] = await Promise.all([
                        productPreviewRef.current?.exportCompositeAsync?.(),
                        productPreviewRef.current?.exportMugBackAsync?.(),
                      ]);
                      // 正面合成图
                      totemCompositeRef.current = composite || '';
                      setTotemCompositeUrl(composite || '');
                      // 背面合成图（null 时必须清空，避免上次 outer-wrap 结果残留）
                      backCompositeRef.current = mugBack || '';
                      setBackCompositeUrl(mugBack || '');
                    }
                    setShow3DInTotem(v => !v);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    show3DInTotem
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-orange-500 hover:text-orange-400'
                  }`}
                  title={locale === 'zh' ? '切换 3D 旋转预览' : 'Toggle 3D rotation preview'}
                >
                  <Box size={14} />
                  {locale === 'zh' ? '3D 旋转' : '3D View'}
                </button>
                <button onClick={() => { setShowProductPreview(false); setShow3DInTotem(false); }} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>
            </div>
            <div className="flex border-b border-slate-700 px-6 pt-4 gap-2 flex-wrap">
              {(['tshirt','mug','phonecase','totebag','sticker'] as ProductType[]).map(type => (
                <button key={type} onClick={() => setProductPreviewType(type)}
                  className={`px-3 py-1 rounded-full text-xs border mb-4 transition-all ${
                    productPreviewType === type
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}>
                  {locale === 'zh'
                    ? {tshirt:'T恤',mug:'马克杯',phonecase:'手机壳',totebag:'帆布包',sticker:'贴纸'}[type]
                    : {tshirt:'T-Shirt',mug:'Mug',phonecase:'Phone Case',totebag:'Tote Bag',sticker:'Sticker'}[type]}
                </button>
              ))}
            </div>
            {show3DInTotem ? (
              /* ── 3D 旋转视图 ── */
              <div className="relative" style={{ height: '520px' }}>
                <Preview3D
                  canvasDataUrl={totemCompositeRef.current || previewDataUrl}
                  backCompositeUrl={backCompositeRef.current}
                  onClose={() => setShow3DInTotem(false)}
                  initialProduct={productPreviewType}
                  locale={locale as 'zh' | 'en'}
                  userId={currentUser?.id}
                  userEmail={currentUser?.email || ''}
                  inline={true}
                  selectedZoneId={selectedZoneId}
                  designImageUrl={previewDataUrl}
                />
              </div>
            ) : (
              /* ── 2D 图腾映射视图 ── */
              <div className="p-6">
                <ProductPreview
                  ref={productPreviewRef}
                  productType={productPreviewType}
                  designImageUrl={previewDataUrl}
                  locale={locale as 'zh' | 'en'}
                  userId={currentUser?.id}
                  userEmail={currentUser?.email || ''}
                  onZoneSelect={(zone) => {
                    // 同步当前选中 zone 所在的面，供 3D 切换时判断
                    setSelectedZoneFace((zone as any)?.face ?? 'front');
                    setSelectedZoneId((zone as any)?.id ?? '');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 风格转换 Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Wand2 size={18} className="text-purple-400" />
                {locale === 'zh' ? '风格转换' : 'Style Transfer'}
              </h2>
              <button onClick={() => setShowStyleModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {/* 上传图片 */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">{locale === 'zh' ? '上传图片' : 'Upload Image'}</label>
                <div
                  className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => styleFileRef.current?.click()}
                >
                  {stylePreview ? (
                    <img src={stylePreview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="text-slate-500 py-4">
                      <Wand2 size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{locale === 'zh' ? '点击上传图片' : 'Click to upload image'}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={styleFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setStyleFile(f);
                      setStylePreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>
              {/* 选择风格 */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">{locale === 'zh' ? '选择风格' : 'Choose Style'}</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(STYLE_LABELS) as Array<keyof typeof STYLE_LABELS>).map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedStyle(s as typeof selectedStyle)}
                      className={`py-2 text-xs rounded-lg border transition-all ${
                        selectedStyle === s
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {STYLE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              {/* 错误提示 */}
              {styleError && (
                <p className="text-red-400 text-sm">{styleError}</p>
              )}
              {/* 生成按钮 */}
              <button
                onClick={handleStyleTransfer}
                disabled={!styleFile || styleLoading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
              >
                {styleLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                {styleLoading
                  ? (locale === 'zh' ? '生成中...' : 'Generating...')
                  : (locale === 'zh' ? '生成' : 'Generate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 融合结果 Modal */}
      {showMergeResult && mergeResultUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                {locale === 'zh' ? 'AI 融合结果' : 'AI Merge Result'}
              </h2>
              <button onClick={() => { setShowMergeResult(false); }} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6">
              <img
                src={`/api/proxy-image?url=${encodeURIComponent(mergeResultUrl)}`}
                alt="AI merge result"
                className="w-full rounded-xl object-contain max-h-96"
              />
              <div className="mt-4 flex gap-3 justify-center">
                <a
                  href={`/api/proxy-image?url=${encodeURIComponent(mergeResultUrl)}`}
                  download={`ai-merge-${Date.now()}.jpg`}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  <Download size={16} />
                  {locale === 'zh' ? '下载' : 'Download'}
                </a>
                <button
                  onClick={() => {
                    canvasRef.current?.addImageFromUrl(mergeResultUrl);
                    setShowMergeResult(false);
                    setShowProductPreview(false);
                  }}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  {locale === 'zh' ? '加入画布' : 'Add to Canvas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 融合进行中 / 错误提示 */}
      {(mergeLoading || mergeError) && !showMergeResult && showProductPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            {mergeLoading ? (
              <>
                <Loader2 size={40} className="animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-white font-semibold">{locale === 'zh' ? 'AI 融合中...' : 'AI merging...'}</p>
                <p className="text-slate-400 text-sm mt-1">{locale === 'zh' ? '大约需要 30-60 秒' : 'Takes ~30-60s'}</p>
              </>
            ) : (
              <>
                <p className="text-red-400 font-semibold mb-4">{mergeError}</p>
                <button
                  onClick={() => setMergeError('')}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl text-sm"
                >
                  {locale === 'zh' ? '关闭' : 'Close'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAiPanel && (
        <AiGeneratePanel
          onImageGenerated={(url) => {
            canvasRef.current?.addImageFromUrl(url);
            setShowAiPanel(false);
            setActiveTool('select');
          }}
          onClose={() => { setShowAiPanel(false); setActiveTool('select'); }}
        />
      )}

      {/* 下载权限升级提示弹窗 */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-white font-semibold mb-1">Preview downloaded</p>
            <p className="text-slate-400 text-sm mb-5">
              Upgrade to Pro to export full-resolution PNG without limits.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:border-slate-400 transition-colors"
              >
                Maybe later
              </button>
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>}>
      <StudioContent />
    </Suspense>
  );
}
