import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { mimidiTheme } from '@/src/theme/mimidiTheme';
import { mimidiShadows } from '@/src/theme/mimidiShadows';

type PrototypePlaceholderScreenProps = {
  description: string;
  title: string;
};

export function PrototypePlaceholderScreen({
  description,
  title,
}: PrototypePlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MiMIDI Expo Prototype</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mimidiTheme.colors.background,
  },
  container: {
    flex: 1,
    padding: mimidiTheme.spacing.lg,
  },
  card: {
    borderRadius: mimidiTheme.radius.lg,
    backgroundColor: mimidiTheme.colors.card,
    padding: mimidiTheme.spacing.lg,
    ...mimidiShadows.panel,
  },
  eyebrow: {
    color: mimidiTheme.colors.inkMuted,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: mimidiTheme.spacing.sm,
    color: mimidiTheme.colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    marginTop: mimidiTheme.spacing.sm,
    color: mimidiTheme.colors.inkMuted,
    fontSize: 16,
    lineHeight: 22,
  },
});
