import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CollectionCard } from '@/components/CollectionCard';
import { AddToSetModal } from '@/components/AddToSetModal';
import { GradientButton } from '@/components/GradientButton';
import { useAppStore } from '@/store/useAppStore';
import { AnalysisResult } from '@/types';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { normalizeOrigin } from '@/data/countryCoordinates';

export default function SetDetailScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const sets = useAppStore((s) => s.sets);
  const getItemsInSet = useAppStore((s) => s.getItemsInSet);
  const removeItemFromSet = useAppStore((s) => s.removeItemFromSet);
  const removeFromCollection = useAppStore((s) => s.removeFromCollection);

  const [showAddModal, setShowAddModal] = useState(false);

  const set = sets.find((s) => s.id === setId);
  const items = setId ? getItemsInSet(setId) : [];
  const originCount = new Set(items.map((item) => normalizeOrigin(item.origin))).size;

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Set not found</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    triggerButtonPress();
    router.navigate({
      pathname: '/(tabs)/portfolio',
      params: { tab: 'sets' },
    });
  };

  const handleItemPress = (item: AnalysisResult) => {
    router.push({
      pathname: '/(tabs)/(scanner)/result',
      params: { resultData: JSON.stringify(item) },
    });
  };

  const handleItemKebab = (item: AnalysisResult) => {
    triggerButtonPress();
    Alert.alert(
      item.name,
      undefined,
      [
        {
          text: 'Edit',
          onPress: () => {
            router.push({
              pathname: '/(tabs)/(scanner)/edit',
              params: { itemData: JSON.stringify(item) },
            });
          },
        },
        {
          text: 'Remove from Set',
          onPress: () => {
            removeItemFromSet(item.id, set.id);
          },
        },
        {
          text: 'Delete from Collection',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Item',
              `Remove "${item.name}" from your collection?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => removeFromCollection(item.id),
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleIdentify = () => {
    triggerButtonPress();
    router.navigate('/(tabs)/(scanner)');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{set.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerButtonPress();
              setShowAddModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color={colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="albums" size={16} color={colors.accentPrimary} />
          <Text style={styles.statText}>{items.length} {items.length === 1 ? 'record' : 'records'}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="globe" size={16} color={colors.accentPrimary} />
          <Text style={styles.statText}>{originCount} {originCount === 1 ? 'origin' : 'origins'}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollectionCard
            item={item}
            onPress={() => handleItemPress(item)}
            onKebabPress={() => handleItemKebab(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No records in this set</Text>
            <Text style={styles.emptySubtext}>Add records from their detail or edit screen</Text>
          </View>
        }
      />

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <GradientButton text="Identify" onPress={handleIdentify} icon="camera" />
      </SafeAreaView>

      {/* Add Records Modal */}
      {setId && (
        <AddToSetModal
          visible={showAddModal}
          setId={setId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
});
