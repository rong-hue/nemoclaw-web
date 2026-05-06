/**
 * i18n 语言文件完整性测试
 *
 * 验证所有语言文件（zh/en/ja/ko）都包含 studio 工具栏所需的 undo/redo key，
 * 以及 save/saving/saved/saveFailed 等保存相关 key。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const MESSAGES_DIR = resolve(__dirname, '../../messages');
const LOCALES = ['zh', 'en', 'ja', 'ko'];

function loadMessages(locale: string) {
  const filePath = resolve(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// studio.tools 下必须存在的 key
const REQUIRED_TOOL_KEYS = ['undo', 'redo', 'select', 'brush', 'text', 'delete', 'clear'];

// studio 顶层必须存在的 key
const REQUIRED_STUDIO_KEYS = ['save', 'saving', 'saved', 'saveFailed', 'untitled'];

function makeLocaleTests(locale: string) {
  describe(`locale: ${locale}`, () => {
    let messages: Record<string, unknown>;

    try {
      messages = loadMessages(locale);
    } catch {
      it(`能够加载 ${locale}.json`, () => {
        expect.fail(`无法加载 messages/${locale}.json`);
      });
      return;
    }

    it('存在 studio 命名空间', () => {
      expect(messages).toHaveProperty('studio');
    });

    it('studio.tools 包含 undo/redo', () => {
      const studio = messages.studio as Record<string, unknown>;
      const tools = studio?.tools as Record<string, unknown>;
      expect(tools).toBeDefined();
      for (const key of ['undo', 'redo']) {
        expect(tools, `studio.tools.${key} 缺失`).toHaveProperty(key);
        expect(typeof tools[key]).toBe('string');
        expect((tools[key] as string).length).toBeGreaterThan(0);
      }
    });

    it(`studio.tools 包含所有必需工具 key: ${REQUIRED_TOOL_KEYS.join(', ')}`, () => {
      const studio = messages.studio as Record<string, unknown>;
      const tools = studio?.tools as Record<string, unknown>;
      for (const key of REQUIRED_TOOL_KEYS) {
        expect(tools, `studio.tools.${key} 缺失`).toHaveProperty(key);
      }
    });

    it(`studio 顶层包含保存相关 key: ${REQUIRED_STUDIO_KEYS.join(', ')}`, () => {
      const studio = messages.studio as Record<string, unknown>;
      for (const key of REQUIRED_STUDIO_KEYS) {
        expect(studio, `studio.${key} 缺失`).toHaveProperty(key);
        expect(typeof studio[key]).toBe('string');
      }
    });
  });
}

describe('i18n 语言文件完整性', () => {
  for (const locale of LOCALES) {
    makeLocaleTests(locale);
  }
});
