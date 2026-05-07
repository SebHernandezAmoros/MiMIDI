import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mimidiTabs, type MimidiRouteId } from '@/src/navigation/appTabs';
import { mimidiShadows } from '@/src/theme/mimidiShadows';
import { mimidiTheme } from '@/src/theme/mimidiTheme';

type PrototypeShellProps = PropsWithChildren<{
  currentRoute: MimidiRouteId;
  scrollable?: boolean;
  title?: string;
}>;

export function PrototypeShell({
  children,
  currentRoute,
  scrollable = false,
  title = 'mimidi',
}: PrototypeShellProps) {
  const { height, width } = useWindowDimensions();
  const isPortrait = height > width;
  const isCompact = width < 960 || height < 560;
  const isTight = width < 840 || height < 500;
  const shellPaddingHorizontal = isCompact
    ? mimidiTheme.spacing.md
    : mimidiTheme.spacing.lg;
  const shellPaddingVertical = isCompact
    ? mimidiTheme.spacing.sm
    : mimidiTheme.spacing.lg;

  if (isPortrait) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.rotateOuter}>
          <View style={styles.rotateCard}>
            <Text style={styles.rotateTitle}>mimidi expo</Text>
            <Text style={styles.rotateMessage}>
              Esta etapa del modo app esta alineada solo a horizontal. Gira el
              dispositivo o amplia la ventana para seguir probando.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const content = (
    <View
      style={[
        styles.viewport,
        {
          paddingHorizontal: shellPaddingHorizontal,
          paddingVertical: shellPaddingVertical,
        },
      ]}
    >
      <View style={styles.deviceCard}>
        <View
          style={[
            styles.topRow,
            isCompact ? styles.topRowCompact : null,
            isTight ? styles.topRowTight : null,
          ]}
        >
          <Text
            style={[
              styles.brand,
              isCompact ? styles.brandCompact : null,
              isTight ? styles.brandTight : null,
            ]}
          >
            {title}
          </Text>
          <View
            style={[
              styles.navRow,
              isCompact ? styles.navRowCompact : null,
              isTight ? styles.navRowTight : null,
            ]}
          >
            {mimidiTabs.map((tab) => {
              const isActive = tab.id === currentRoute;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => router.replace(tab.href)}
                  style={[
                    styles.navButton,
                    isCompact ? styles.navButtonCompact : null,
                    isTight ? styles.navButtonTight : null,
                  ]}
                >
                  {tab.icon.family === 'material' ? (
                    <MaterialCommunityIcons
                      color={
                        isActive
                          ? mimidiTheme.colors.ink
                          : mimidiTheme.colors.navInactive
                      }
                      name={tab.icon.name}
                      size={22}
                    />
                  ) : (
                    <Ionicons
                      color={
                        isActive
                          ? mimidiTheme.colors.ink
                          : mimidiTheme.colors.navInactive
                      }
                      name={tab.icon.name}
                      size={21}
                    />
                  )}
                  <View
                    style={[
                      styles.navIndicator,
                      isActive ? styles.navIndicatorActive : null,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.divider} />
        <View
          style={[
            styles.body,
            isCompact ? styles.bodyCompact : null,
            isTight ? styles.bodyTight : null,
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mimidiTheme.colors.background,
  },
  viewport: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceCard: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignSelf: 'center',
    borderRadius: mimidiTheme.radius.xl,
    backgroundColor: mimidiTheme.colors.card,
    overflow: 'hidden',
    ...mimidiShadows.panel,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: mimidiTheme.spacing.lg,
    paddingVertical: mimidiTheme.spacing.md,
  },
  topRowCompact: {
    paddingHorizontal: mimidiTheme.spacing.md,
    paddingVertical: mimidiTheme.spacing.sm,
  },
  topRowTight: {
    paddingHorizontal: mimidiTheme.spacing.sm,
    paddingVertical: mimidiTheme.spacing.xs,
  },
  brand: {
    color: mimidiTheme.colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  brandCompact: {
    fontSize: 20,
  },
  brandTight: {
    fontSize: 18,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  navRowCompact: {
    gap: mimidiTheme.spacing.md,
  },
  navRowTight: {
    gap: mimidiTheme.spacing.sm,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 34,
  },
  navButtonCompact: {
    gap: 4,
    minWidth: 30,
  },
  navButtonTight: {
    minWidth: 28,
  },
  navIndicator: {
    width: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  navIndicatorActive: {
    backgroundColor: mimidiTheme.colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: mimidiTheme.colors.border,
  },
  body: {
    flex: 1,
    minHeight: 0,
    padding: mimidiTheme.spacing.md,
    gap: mimidiTheme.spacing.md,
  },
  bodyCompact: {
    padding: mimidiTheme.spacing.sm,
    gap: mimidiTheme.spacing.sm,
  },
  bodyTight: {
    padding: mimidiTheme.spacing.xs,
    gap: mimidiTheme.spacing.xs,
  },
  rotateOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mimidiTheme.spacing.lg,
  },
  rotateCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: mimidiTheme.radius.lg,
    backgroundColor: mimidiTheme.colors.card,
    padding: mimidiTheme.spacing.xl,
    ...mimidiShadows.panel,
  },
  rotateTitle: {
    color: mimidiTheme.colors.ink,
    fontSize: 24,
    fontWeight: '700',
  },
  rotateMessage: {
    marginTop: mimidiTheme.spacing.md,
    color: mimidiTheme.colors.inkMuted,
    fontSize: 16,
    lineHeight: 23,
  },
});
