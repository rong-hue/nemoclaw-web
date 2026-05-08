export interface BlogPost {
  slug: string;
  category: 'culture' | 'tutorials' | 'updates';
  date: string;
  readingMinutes: number;
  coverEmoji: string;
  titleKey: string;
  excerptKey: string;
  contentKey: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'wabi-sabi-design-principles',
    category: 'culture',
    date: '2025-06-10',
    readingMinutes: 5,
    coverEmoji: '🍂',
    titleKey: 'post1Title',
    excerptKey: 'post1Excerpt',
    contentKey: 'post1Content',
  },
  {
    slug: 'ai-brush-strokes-tutorial',
    category: 'tutorials',
    date: '2025-06-18',
    readingMinutes: 7,
    coverEmoji: '🖌️',
    titleKey: 'post2Title',
    excerptKey: 'post2Excerpt',
    contentKey: 'post2Content',
  },
  {
    slug: 'studio-layer-system-update',
    category: 'updates',
    date: '2025-06-25',
    readingMinutes: 3,
    coverEmoji: '⚡',
    titleKey: 'post3Title',
    excerptKey: 'post3Excerpt',
    contentKey: 'post3Content',
  },
];
