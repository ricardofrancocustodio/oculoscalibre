import type { CSSProperties } from 'react';
import type { ThemeColors } from '@/lib/theme-context';

export function getContentPanelStyle(colors: ThemeColors): CSSProperties {
  return {
    background: colors.panelBackground,
    border: `1px solid ${colors.panelBorder}`,
    borderRadius: '28px',
    padding: '28px',
    boxShadow: '0 24px 80px rgba(72, 47, 28, 0.08)',
    backdropFilter: 'blur(18px)',
  };
}

export function getMetaListStyle(colors: ThemeColors): CSSProperties {
  return {
    display: 'grid',
    gap: '14px',
    color: colors.secondaryText,
    fontSize: '14px',
  };
}
