'use client';

import { MarkdownRenderer } from '@/lib/markdown';

export function MarkdownPreview({ source }: { source: string }) {
  if (!source.trim()) {
    return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Comece a digitar...</p>;
  }
  return <MarkdownRenderer source={source} />;
}
