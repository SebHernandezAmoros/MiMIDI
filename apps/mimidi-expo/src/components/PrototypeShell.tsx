import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import {
  Pressable,
  ScrollView,
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
    <View style={styles.viewport}>
      <View style={styles.deviceCard}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>{title}</Text>
          <View style={styles.navRow}>
            {mimidiTabs.map((tab) => {
              const isActive = tab.id === currentRoute;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => router.replace(tab.href)}
                  style={styles.navButton}
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
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mimidiTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  viewport: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: mimidiTheme.spacing.lg,
    paddingVertical: mimidiTheme.spacing.lg,
  },
  deviceCard: {
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
  brand: {
    color: mimidiTheme.colors.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mimidiTheme.spacing.lg,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 34,
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
    padding: mimidiTheme.spacing.md,
    gap: mimidiTheme.spacing.md,
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
