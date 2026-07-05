/**
 * 输入验证工具函数（H3 修复）
 * 用于 AI API 路由的 prompt 和 URL 校验
 */

// Prompt 长度上限（字符数）
export const PROMPT_MAX_LENGTH = 1000;

// Prompt 注入攻击关键词黑名单（不区分大小写）
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|all)\s+instructions?/i,
  /forget\s+(everything|all|prior|previous)/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /system\s+prompt/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
];

export interface ValidatePromptResult {
  ok: boolean;
  error?: string;
}

/**
 * 校验 AI prompt
 * - 检查长度是否超限
 * - 检查是否包含注入攻击关键词
 */
export function validatePrompt(prompt: unknown): ValidatePromptResult {
  if (typeof prompt !== 'string') {
    return { ok: false, error: 'prompt must be a string' };
  }
  if (!prompt.trim()) {
    return { ok: false, error: 'prompt is required' };
  }
  if (prompt.length > PROMPT_MAX_LENGTH) {
    return { ok: false, error: `prompt too long (max ${PROMPT_MAX_LENGTH} characters)` };
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return { ok: false, error: 'prompt contains disallowed content' };
    }

  }
  return { ok: true };
}

// ── 文件头 Magic Bytes 校验（Edge Runtime 兼容，不依赖 sharp）────────────────
const IMAGE_MAGIC_BYTES: Array<{ mime: string; magic: number[] }> = [
  { mime: 'image/jpeg', magic: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  magic: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',  magic: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
];

/**
 * 通过读取文件头前 12 字节验证真实图片类型（防止 MIME type 伪造）
 * 返回检测到的 mime，或 null 表示非图片
 */
export function validateMagicBytes(buffer: ArrayBuffer | Uint8Array): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  for (const { mime, magic } of IMAGE_MAGIC_BYTES) {
    if (magic.every((b, i) => bytes[i] === b)) {
      // WEBP 额外验证：bytes[8..11] 应为 'W','E','B','P'
      if (mime === 'image/webp') {
        const webpSig = [0x57, 0x45, 0x42, 0x50];
        if (!webpSig.every((b, i) => bytes[8 + i] === b)) continue;
      }
      return mime;
    }
  }
  return null;
}

/**
 * 校验图片 URL
 * - 必须是 https
 * - 必须来自可信域名（Supabase Storage 或 SiliconFlow CDN 系列）
 */

// 允许的精确前缀（Supabase Storage）
const ALLOWED_URL_PREFIXES = [
  'https://zudjabafibyvnpqiroof.supabase.co/storage/',
];

// 允许的域名后缀（SiliconFlow 全系列 CDN + 阿里云 OSS）
// Kolors 等模型可能返回不同子域名，用后缀匹配更鲁棒
const ALLOWED_URL_DOMAINS = [
  '.siliconflow.cn',
  '.aliyuncs.com',
];

export interface ValidateImageUrlResult {
  ok: boolean;
  error?: string;
}

export function validateImageUrl(url: unknown): ValidateImageUrlResult {
  if (typeof url !== 'string' || !url.trim()) {
    return { ok: false, error: 'imageUrl is required' };
  }
  // 必须是 https
  if (!url.startsWith('https://')) {
    return { ok: false, error: 'imageUrl must be an https URL' };
  }
  // 检查精确前缀（Supabase）
  if (ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return { ok: true };
  }
  // 检查域名后缀（SiliconFlow 全系列）
  try {
    const hostname = new URL(url).hostname;
    if (ALLOWED_URL_DOMAINS.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix))) {
      return { ok: true };
    }
  } catch {
    return { ok: false, error: 'imageUrl is not a valid URL' };
  }
  return { ok: false, error: 'imageUrl must be from an allowed domain' };
}
