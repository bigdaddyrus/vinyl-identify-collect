import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { OriginDistribution } from '@/types';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { getDisplayName } from '@/data/countryCoordinates';

interface Props {
  origins: OriginDistribution[];
  totalItems: number;
  onViewAll: () => void;
}

export function WorldMapPreview({ origins, totalItems, onViewAll }: Props) {
  const labels = appConfig.collection.geographicLabels;
  const regionCount = origins.length;

  if (origins.length === 0) return null;

  const summaryText = (labels?.regionSummary ?? '{items} items distributed in {regions} regions')
    .replace('{items}', String(totalItems))
    .replace('{regions}', String(regionCount));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{labels?.title ?? 'Geographic Distribution'}</Text>

      <View style={styles.card}>
        {/* Map preview */}
        <View style={styles.mapWrapper}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: 20,
              longitude: 0,
              latitudeDelta: 120,
              longitudeDelta: 180,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            mapType="standard"
            userInterfaceStyle="dark"
          >
            {origins.map((origin, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: origin.lat, longitude: origin.lng }}
                title={getDisplayName(origin.origin)}
                description={`${origin.count} ${origin.count === 1 ? 'item' : 'items'}`}
                pinColor={colors.accentPrimary}
              />
            ))}
          </MapView>
        </View>

        {/* Summary text */}
        <Text style={styles.summaryText}>{summaryText}</Text>

        {/* View All button */}
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>{labels?.viewAll ?? 'View All'}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accentPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapWrapper: {
    height: 180,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  summaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginHorizontal: spacing.md,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.accentPrimary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});
