# NemoClaw Culture · Brand Guidelines

## Logo

- 文字 Logo：`<span class="text-orange-500">Nemo</span>Claw · <span class="text-slate-300">Culture</span>`
- SVG 文件：`/public/logo.svg`
- Logo 组件：`src/components/Logo.tsx`
- 最小尺寸：高度不低于 24px
- 禁止：拉伸变形、改变颜色、在浅色背景上使用（品牌定位深色背景）

## 色彩系统

### 主色
| 名称 | Tailwind | Hex | 用途 |
|------|----------|-----|------|
| Brand Orange | orange-500 | #F97316 | CTA 按钮、Logo、高亮、标签 |
| Brand Orange Dark | orange-600 | #EA580C | 按钮 hover 状态 |
| Brand Orange Glow | orange-500/30 | rgba(249,115,22,0.3) | 发光效果、阴影 |

### 背景色
| 名称 | Tailwind | Hex | 用途 |
|------|----------|-----|------|
| Background Deep | slate-950 | #020617 | 页面主背景 |
| Background Card | slate-900 | #0F172A | 卡片、弹窗背景 |
| Background Elevated | slate-800 | #1E293B | 次级卡片、输入框 |
| Border | slate-700/800 | #334155 | 分割线、边框 |

### 文字色
| 名称 | Tailwind | Hex | 用途 |
|------|----------|-----|------|
| Text Primary | slate-50 | #F8FAFC | 主标题、正文 |
| Text Secondary | slate-400 | #94A3B8 | 副标题、说明文字 |
| Text Muted | slate-600 | #475569 | 占位符、禁用状态 |

### 强调色（渐变）
- Hero 标题渐变：`from-orange-400 via-rose-500 to-purple-500`
- 用于首页大标题高亮词

## 字体

### 主字体
- **Geist Sans**（Next.js 默认，已配置）
- 用途：所有 UI 文字

### 字重规范
| 用途 | font-weight | Tailwind |
|------|-------------|----------|
| Logo / 大标题 | 900 | font-black |
| 按钮 / 小标题 | 700 | font-bold |
| 正文 | 400 | font-normal |
| 说明文字 | 500 | font-medium |

### 字号规范
| 用途 | Tailwind |
|------|----------|
| 页面大标题 | text-4xl md:text-5xl |
| Section 标题 | text-2xl md:text-3xl |
| 卡片标题 | text-lg |
| 正文 | text-sm / text-base |
| 标签 / 角标 | text-xs |

## 圆角规范
| 用途 | Tailwind |
|------|----------|
| 按钮（胶囊型） | rounded-full |
| 卡片 | rounded-2xl |
| 弹窗 | rounded-3xl |
| 小标签 | rounded-full |
| 输入框 | rounded-xl |

## 按钮规范

### 主按钮（CTA）
```
bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6 py-2
shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]
```

### 次级按钮
```
bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full px-6 py-2
```

### 描边按钮
```
border border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold rounded-full px-6 py-2
```

## 图标
- 使用 `lucide-react` 图标库
- 尺寸：导航栏 20px，正文内 16-18px，大图标 24px

## 间距节奏
- Section 间距：`py-16` 或 `py-24`
- 卡片内边距：`p-6`
- 导航栏：`p-6`
- 网格间距：`gap-4`
