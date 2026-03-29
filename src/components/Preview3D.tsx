'use client';

import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, Package } from 'lucide-react';

interface Preview3DProps {
  canvasDataUrl: string;
  onClose: () => void;
}

type ModelType = 'tshirt' | 'mug' | 'phone';

export default function Preview3D({ canvasDataUrl, onClose }: Preview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0.5 });

  const [model, setModel] = useState<ModelType>('tshirt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initScene();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      rebuildModel(model);
    }
  }, [model, canvasDataUrl]);

  async function initScene() {
    const THREE = await import('three');
    const el = mountRef.current!;
    const w = el.clientWidth;
    const h = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Subtle grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x1e293b, 0x1e293b);
    (gridHelper as any).position.y = -1.8;
    scene.add(gridHelper);

    // Ambient + directional lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 3);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0xffa500, 0.4);
    dirLight2.position.set(-3, 2, -3);
    scene.add(dirLight2);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build initial model
    await rebuildModel('tshirt');
    setLoading(false);

    // Animate
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      if (meshRef.current && !isDragging.current) {
        meshRef.current.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      const w2 = el.clientWidth;
      const h2 = el.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);
  }

  async function rebuildModel(type: ModelType) {
    const THREE = await import('three');
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry?.dispose();
      meshRef.current.material?.dispose();
      meshRef.current = null;
    }

    // Create texture from canvas
    const texture = new THREE.TextureLoader().load(canvasDataUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    let geometry: any;
    let material: any;

    if (type === 'tshirt') {
      geometry = buildTshirtGeometry(THREE);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
    } else if (type === 'mug') {
      geometry = new THREE.CylinderGeometry(0.7, 0.65, 1.6, 64, 1, false);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.4,
        metalness: 0.1,
      });
    } else {
      // phone - box with rounded feel
      geometry = new THREE.BoxGeometry(1.1, 2.2, 0.12, 2, 4, 1);
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.2,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = rotation.current.x;
    mesh.rotation.y = rotation.current.y;
    scene.add(mesh);
    meshRef.current = mesh;
  }

  function buildTshirtGeometry(THREE: any) {
    // Custom T-shirt shape using BufferGeometry
    // We'll use a CylinderGeometry as the body with custom UV
    // For a more shirt-like shape, we use a LatheGeometry
    const points = [];
    // Bottom hem
    points.push(new THREE.Vector2(1.0, -1.5));
    // Waist
    points.push(new THREE.Vector2(0.95, -0.5));
    // Chest
    points.push(new THREE.Vector2(1.0, 0.3));
    // Shoulder
    points.push(new THREE.Vector2(0.9, 0.8));
    // Neck
    points.push(new THREE.Vector2(0.5, 1.1));
    // Top
    points.push(new THREE.Vector2(0.3, 1.4));

    const geometry = new THREE.LatheGeometry(points, 48);
    return geometry;
  }

  // Mouse drag to rotate
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !meshRef.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    meshRef.current.rotation.y += dx * 0.01;
    meshRef.current.rotation.x += dy * 0.01;
    rotation.current.x = meshRef.current.rotation.x;
    rotation.current.y = meshRef.current.rotation.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseUp() {
    isDragging.current = false;
  }

  // Touch support
  function onTouchStart(e: React.TouchEvent) {
    isDragging.current = true;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current || !meshRef.current) return;
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    meshRef.current.rotation.y += dx * 0.01;
    meshRef.current.rotation.x += dy * 0.01;
    rotation.current.x = meshRef.current.rotation.x;
    rotation.current.y = meshRef.current.rotation.y;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleReset() {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = 0.3;
    meshRef.current.rotation.y = 0.5;
    rotation.current = { x: 0.3, y: 0.5 };
  }

  const models: { key: ModelType; label: string; emoji: string }[] = [
    { key: 'tshirt', label: 'T恤', emoji: '👕' },
    { key: 'mug', label: '马克杯', emoji: '☕' },
    { key: 'phone', label: '手机壳', emoji: '📱' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Package size={18} className="text-orange-500" />
          <span className="font-bold text-slate-100">3D 实物预览</span>
          <span className="text-xs text-slate-500">拖拽旋转查看效果</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={14} />
            重置视角
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Model switcher */}
      <div className="flex items-center justify-center gap-3 py-3 bg-slate-900/50 shrink-0">
        {models.map((m) => (
          <button
            key={m.key}
            onClick={() => setModel(m.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              model === m.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-950">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">正在加载 3D 渲染引擎...</p>
          </div>
        )}
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        />
      </div>

      {/* Footer hint */}
      <div className="h-10 bg-slate-900/50 border-t border-slate-800 flex items-center justify-center shrink-0">
        <p className="text-xs text-slate-600">
          🖱️ 拖拽旋转 · 你的设计已实时贴图到 3D 模型上
        </p>
      </div>
    </div>
  );
}
