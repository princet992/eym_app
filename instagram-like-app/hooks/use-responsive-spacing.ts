import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useResponsiveSpacing() {
  const { width } = useWindowDimensions();

  const isCompact = width < 360;
  const isTablet = width >= 768;

  const horizontal = isCompact ? 12 : isTablet ? 32 : 20;
  const vertical = isCompact ? 12 : 20;
  const gap = isCompact ? 12 : 16;
  const modalWidth = Math.min(width - horizontal * 2, isTablet ? 640 : 520);
  const contentMaxWidth = isTablet ? Math.min(width - horizontal * 2, 720) : width - horizontal * 2;

  return useMemo(
    () => ({ horizontal, vertical, gap, modalWidth, contentMaxWidth, isCompact, isTablet }),
    [contentMaxWidth, gap, horizontal, isCompact, isTablet, modalWidth, vertical],
  );
}
