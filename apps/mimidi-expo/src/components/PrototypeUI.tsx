import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mimidiShadows } from '@/src/theme/mimidiShadows';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

export function SurfaceButton({
  children,
  compact = false,
  onPress,
}: PropsWithChildren<{ compact?: boolean; onPress?: () => void }>) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, compact ? styles.buttonCompact : styles.buttonWide]}
    >
      {typeof children === 'string' ? (
        <Text style={styles.buttonText}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function SurfacePanel({
  children,
  title,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <View style={styles.panel}>
      {title ? <Text style={styles.panelTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function SelectLike({
  value,
  width,
}: {
  value: string;
  width?: number | string;
}) {
  return (
    <View style={[styles.selectLike, width ? { width } : null]}>
      <Text style={styles.selectText}>{value}</Text>
      <Text style={styles.chevron}>⌄</Text>
    </View>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function RowItem({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowItemLeft}>{left}</View>
      {right ? <View style={styles.rowItemRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mimidiTheme.spacing.md,
    ...mimidiShadows.pressed,
  },
  buttonCompact: {
    minWidth: 52,
  },
  buttonWide: {
    minWidth: 110,
  },
  buttonText: {
    color: mimidiTheme.colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  panel: {
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.keyWhite,
    padding: mimidiTheme.spacing.md,
    gap: mimidiTheme.spacing.sm,
  },
  panelTitle: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  selectLike: {
    minHeight: 42,
    borderRadius: mimidiTheme.radius.sm,
    backgroundColor: mimidiTheme.colors.cardAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: mimidiTheme.spacing.md,
    ...mimidiShadows.pressed,
  },
  selectText: {
    color: mimidiTheme.colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowItem: {
    minHeight: 54,
    borderRadius: mimidiTheme.radius.sm,
    borderWidth: 1,
    borderColor: mimidiTheme.colors.border,
    backgroundColor: mimidiTheme.colors.keyWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: mimidiTheme.spacing.md,
  },
  rowItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
  },
  rowItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.sm,
  },
});
