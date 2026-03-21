import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { OriginDistribution } from '@/types';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function MapScreen() {
  const params = useLocalSearchParams<{ origins?: string; totalItems?: string }>();

  let origins: OriginDistribution[] = [];
  if (typeof params.origins === 'string') {
    try {
      const parsed = JSON.parse(params.origins);
      if (Array.isArray(parsed)) {
        origins = parsed as OriginDistribution[];
      }
    } catch {
      // Invalid JSON; keep origins as empty array
      origins = [];
    }
  }

  let totalItems = 0;
  if (typeof params.totalItems === 'string') {
    const parsedTotal = parseInt(params.totalItems, 10);
    totalItems = Number.isNaN(parsedTotal) ? 0 : parsedTotal;
  }

  const mapRef = useRef<MapView>(null);

  const labels = appConfig.collection.geographicLabels;
  const regionCount = origins.length;

  const summaryText = (labels?.regionSummary ?? '{items} items distributed in {regions} regions')
    .replace('{items}', String(totalItems))
    .replace('{regions}', String(regionCount));

  const handleOriginPress = (origin: OriginDistribution) => {
    mapRef.current?.animateToRegion({
      latitude: origin.lat,
      longitude: origin.lng,
      latitudeDelta: 20,
      longitudeDelta: 20,
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{labels?.title ?? 'Geographic Distribution'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <Text style={styles.summaryText}>{summaryText}</Text>

      {/* Full-screen map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: 20,
            longitude: 0,
            latitudeDelta: 120,
            longitudeDelta: 180,
          }}
          mapType="standard"
          userInterfaceStyle="dark"
        >
          {origins.map((origin, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: origin.lat, longitude: origin.lng }}
              title={origin.origin}
              description={`${origin.count} ${origin.count === 1 ? 'item' : 'items'}`}
              pinColor={colors.accentPrimary}
            />
          ))}
        </MapView>
      </View>

      {/* Origin list */}
      <FlatList
        data={origins}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.originList}
        renderItem={({ item: origin }) => (
          <TouchableOpacity
            style={styles.originRow}
            onPress={() => handleOriginPress(origin)}
            activeOpacity={0.7}
          >
            <View style={styles.originDot} />
            <Text style={styles.originName}>{origin.origin}</Text>
            <Text style={styles.originCount}>
              {origin.count} {origin.count === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  mapContainer: {
    height: 320,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  originList: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
    marginRight: spacing.sm,
  },
  originName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  originCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
