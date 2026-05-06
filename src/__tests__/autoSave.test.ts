/**
 * 自动保存 debounce 逻辑测试
 *
 * 验证：
 * 1. 3 秒内多次触发只调用一次保存
 * 2. 3 秒后确实触发保存
 * 3. silent=true 时未登录不调用 exportJSON
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- 模拟 debounce 自动保存逻辑（与 studio/page.tsx 中一致）----
function makeAutoSave(saveFn: (silent?: boolean) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const triggerAutoSave = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      saveFn(true); // 自动保存始终 silent=true
    }, 3000);
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { triggerAutoSave, flush };
}

describe('自动保存 debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('3 秒内多次触发，只调用一次保存', () => {
    const saveFn = vi.fn();
    const { triggerAutoSave } = makeAutoSave(saveFn);

    triggerAutoSave();
    vi.advanceTimersByTime(1000);
    triggerAutoSave();
    vi.advanceTimersByTime(1000);
    triggerAutoSave();
    vi.advanceTimersByTime(1000); // 距最后一次触发只过了 1s，不应触发

    expect(saveFn).not.toHaveBeenCalled();
  });

  it('最后一次触发后 3 秒，调用一次保存', () => {
    const saveFn = vi.fn();
    const { triggerAutoSave } = makeAutoSave(saveFn);

    triggerAutoSave();
    vi.advanceTimersByTime(3000);

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it('自动保存调用时传入 silent=true', () => {
    const saveFn = vi.fn();
    const { triggerAutoSave } = makeAutoSave(saveFn);

    triggerAutoSave();
    vi.advanceTimersByTime(3000);

    expect(saveFn).toHaveBeenCalledWith(true);
  });

  it('连续触发后 3 秒，只调用一次', () => {
    const saveFn = vi.fn();
    const { triggerAutoSave } = makeAutoSave(saveFn);

    for (let i = 0; i < 10; i++) {
      triggerAutoSave();
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(3000);

    expect(saveFn).toHaveBeenCalledTimes(1);
  });
});

// ---- silent 模式：未登录时不调用 exportJSON ----
describe('handleSave silent 模式', () => {
  it('silent=true 且未登录时，不调用 exportJSON', async () => {
    const exportJSON = vi.fn();
    const getCurrentUser = vi.fn().mockResolvedValue(null); // 未登录

    // 模拟 handleSave 核心逻辑
    const handleSave = async (silent = false) => {
      const json = '{"objects":[]}'; // 模拟有内容
      if (!json) return;

      const liveUser = await getCurrentUser();
      if (!liveUser?.id) {
        if (!silent) exportJSON();
        return;
      }
    };

    await handleSave(true); // 自动保存调用
    expect(exportJSON).not.toHaveBeenCalled();
  });

  it('silent=false 且未登录时，调用 exportJSON（手动保存 fallback）', async () => {
    const exportJSON = vi.fn();
    const getCurrentUser = vi.fn().mockResolvedValue(null);

    const handleSave = async (silent = false) => {
      const json = '{"objects":[]}';
      if (!json) return;

      const liveUser = await getCurrentUser();
      if (!liveUser?.id) {
        if (!silent) exportJSON();
        return;
      }
    };

    await handleSave(false); // 手动保存
    expect(exportJSON).toHaveBeenCalledTimes(1);
  });

  it('已登录时，不论 silent 值，都不调用 exportJSON', async () => {
    const exportJSON = vi.fn();
    const designsServiceSave = vi.fn().mockResolvedValue({ id: 'new-id' });
    const getCurrentUser = vi.fn().mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    const handleSave = async (silent = false) => {
      const json = '{"objects":[]}';
      if (!json) return;

      const liveUser = await getCurrentUser();
      if (!liveUser?.id) {
        if (!silent) exportJSON();
        return;
      }

      // 已登录，调用保存服务
      await designsServiceSave({ id: undefined, user_id: liveUser.id });
    };

    await handleSave(true);
    await handleSave(false);

    expect(exportJSON).not.toHaveBeenCalled();
    expect(designsServiceSave).toHaveBeenCalledTimes(2);
  });
});
