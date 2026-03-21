import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const CROP_SIZE = width * 0.7;
const DAILY_SNAP_LIMIT = 10; // Free tier daily limit

export default function ScannerHomeScreen() {
  const hasSeenSnapTips = useAppStore((state) => state.hasSeenSnapTips);
  const isPremium = useAppStore((state) => state.isPremium);
  const scanCount = useAppStore((state) => state.scanCount);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasShownTips, setHasShownTips] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState(0); // 0 = 1x, normalized 0-1

  // Show snap tips on first visit
  useEffect(() => {
    if (appConfig.snapTips.enabled && !hasSeenSnapTips && !hasShownTips) {
      setHasShownTips(true);
      router.push('/(tabs)/(scanner)/tips');
    }
  }, [hasSeenSnapTips, hasShownTips]);

  const snapsRemaining = isPremium ? null : Math.max(0, DAILY_SNAP_LIMIT - scanCount);

  const goToCrop = (uri: string) => {
    router.push({
      pathname: '/(tabs)/(scanner)/crop',
      params: { imageUri: uri },
    });
  };

  const handleGalleryPick = async () => {
    triggerButtonPress();

    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!galleryPermission.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to select images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      goToCrop(result.assets[0].uri);
    }
  };

  const handleCapture = async () => {
    triggerButtonPress();

    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        goToCrop(photo.uri);
      }
    } catch {
      Alert.alert('Capture Failed', 'Unable to take photo. Please try again.');
    }
  };

  const toggleFlash = () => {
    triggerButtonPress();
    setFlashEnabled((prev) => !prev);
  };

  const cycleZoom = () => {
    triggerButtonPress();
    // Cycle: 1x (0) -> 2x (0.5) -> 1x (0)
    setZoom((prev) => (prev === 0 ? 0.5 : 0));
  };

  const zoomLabel = zoom === 0 ? '1x' : '2x';

  const handleOpenTips = () => {
    triggerButtonPress();
    router.push('/(tabs)/(scanner)/tips');
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.border} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan and identify items.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryFallbackButton}
            onPress={handleGalleryPick}
            activeOpacity={0.7}
          >
            <Text style={styles.galleryFallbackText}>
              Or choose from gallery
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View (full screen behind everything) */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
        zoom={zoom}
      />

      {/* Top Bar */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar}>
          {/* Close / Back */}
          <TouchableOpacity style={styles.topBarIcon} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>

          {/* Snap counter */}
          <View style={styles.snapCounter}>
            <Ionicons name="scan" size={14} color={colors.accentPrimary} />
            <Text style={styles.snapCounterText}>
              {isPremium ? 'Unlimited IDs' : `${snapsRemaining} IDs left`}
            </Text>
          </View>

          {/* Right actions */}
          <View style={styles.topBarRight}>
            {/* Flash toggle */}
            <TouchableOpacity style={styles.topBarIcon} onPress={toggleFlash} activeOpacity={0.7}>
              <Ionicons
                name={flashEnabled ? 'flash' : 'flash-off'}
                size={20}
                color={flashEnabled ? colors.accentPrimary : colors.white}
              />
            </TouchableOpacity>

            {/* Help / Snap tips */}
            <TouchableOpacity style={styles.topBarIcon} onPress={handleOpenTips} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Center: Crop overlay */}
      <View style={styles.centerOverlay} pointerEvents="none">
        <View style={styles.cropFrame}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.instructionText}>
          {appConfig.scanner.instructionText}
        </Text>
      </View>

      {/* Bottom Controls */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.controls}>
          {/* Gallery button */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handleGalleryPick}
            activeOpacity={0.7}
          >
            <Ionicons name="images" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Center column: capture + zoom */}
          <View style={styles.captureColumn}>
            {/* Capture Button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Zoom toggle */}
            <TouchableOpacity style={styles.zoomButton} onPress={cycleZoom} activeOpacity={0.7}>
              <Text style={styles.zoomText}>{zoomLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* Placeholder to balance layout */}
          <View style={styles.sideButton} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },

  // ── Top Bar ──
  topBarSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  snapCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.round,
  },
  snapCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // ── Center Overlay ──
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderTopLeftRadius: borderRadius.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderTopRightRadius: borderRadius.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderBottomLeftRadius: borderRadius.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
    borderBottomRightRadius: borderRadius.md,
  },
  instructionText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.lg,
    textAlign: 'center',
  },

  // ── Bottom Controls ──
  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureColumn: {
    alignItems: 'center',
    gap: spacing.md,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accentPrimary,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // ── Permission States ──
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.accentPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  galleryFallbackButton: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  galleryFallbackText: {
    ...typography.body,
    color: colors.accentPrimary,
  },
});
