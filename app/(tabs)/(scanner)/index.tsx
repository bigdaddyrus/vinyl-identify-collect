import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { appConfig } from '@/config/appConfig';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { useAppStore } from '@/store/useAppStore';
import { useScanCart } from '@/context/ScanCartContext';
import { GradientButton } from '@/components/GradientButton';
import { CapturedImage } from '@/types';

const { width } = Dimensions.get('window');
const CROP_SIZE = width * 0.7;
const DAILY_SNAP_LIMIT = 10; // Free tier daily limit
const THUMB_SIZE = 48;

const ZOOM_STEPS = [0, 0.125, 0.25, 0.375, 0.5];
const ZOOM_LABELS = ['1x', '1.5x', '2x', '2.5x', '3x'];

const STEP_LABELS: Record<string, string> = {
  barcode: 'Scan Barcode',
  front: appConfig.scanner.frontCoverButtonText ?? 'Scan Front Cover',
  back: appConfig.scanner.backCoverButtonText ?? 'Scan Back Cover',
  label: appConfig.scanner.labelButtonText ?? 'Scan Center Label (Optional)',
};

const STEP_INSTRUCTIONS: Record<string, string> = {
  barcode: 'Point camera at the barcode on the record sleeve',
  front: 'Position the front cover within the frame',
  back: 'Position the back cover within the frame',
  label: 'Position the center label within the frame',
  ready: 'All images captured — ready to analyze',
};

export default function ScannerHomeScreen() {
  const hasSeenSnapTips = useAppStore((state) => state.hasSeenSnapTips);
  const isPremium = useAppStore((state) => state.isPremium);
  const scanCount = useAppStore((state) => state.scanCount);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasShownTips, setHasShownTips] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState(0); // 0 = 1x, normalized 0-1
  const { cart, removeImage, setBarcode, skipBarcode, rescanBarcode, resetCart } = useScanCart();
  const [barcodeScanned, setBarcodeScanned] = useState(false);

  // Show snap tips on first visit
  useEffect(() => {
    if (appConfig.snapTips.enabled && !hasSeenSnapTips && !hasShownTips) {
      setHasShownTips(true);
      router.push('/(tabs)/(scanner)/tips');
    }
  }, [hasSeenSnapTips, hasShownTips]);

  const snapsRemaining = isPremium ? null : Math.max(0, DAILY_SNAP_LIMIT - scanCount);

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (barcodeScanned || cart.currentStep !== 'barcode') return;
    setBarcodeScanned(true);
    triggerButtonPress();
    setBarcode(result.data);
  }, [barcodeScanned, cart.currentStep, setBarcode]);

  const goToCrop = (uri: string, imageType: CapturedImage['type']) => {
    router.push({
      pathname: '/(tabs)/(scanner)/crop',
      params: { imageUri: uri, imageType },
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
      const step = cart.currentStep;
      const imageType = step === 'ready' || step === 'barcode' ? 'front' : step;
      if (step === 'barcode') skipBarcode();
      goToCrop(result.assets[0].uri, imageType);
    }
  };

  const handleCapture = async () => {
    triggerButtonPress();

    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        const step = cart.currentStep;
        const imageType = step === 'ready' || step === 'barcode' ? 'front' : step;
        goToCrop(photo.uri, imageType);
      }
    } catch {
      Alert.alert('Capture Failed', 'Unable to take photo. Please try again.');
    }
  };

  const handleRunAnalysis = () => {
    triggerButtonPress();
    router.replace({
      pathname: '/(tabs)/(scanner)/loading',
      params: {
        cartImages: JSON.stringify(cart.images),
        ...(cart.barcode ? { barcode: cart.barcode } : {}),
      },
    });
  };

  const handleScanLabelFromCamera = async () => {
    triggerButtonPress();
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        goToCrop(photo.uri, 'label');
      }
    } catch {
      Alert.alert('Capture Failed', 'Unable to take photo. Please try again.');
    }
  };

  const toggleFlash = () => {
    triggerButtonPress();
    setFlashEnabled((prev) => !prev);
  };

  const [zoomIndex, setZoomIndex] = useState(0);
  const lastPinchZoom = useRef(0);

  const cycleZoom = () => {
    triggerButtonPress();
    setZoomIndex((prev) => {
      const next = (prev + 1) % ZOOM_STEPS.length;
      setZoom(ZOOM_STEPS[next]);
      return next;
    });
  };

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      lastPinchZoom.current = zoom;
    })
    .onUpdate((e) => {
      const newZoom = Math.min(0.5, Math.max(0, lastPinchZoom.current + (e.scale - 1) * 0.25));
      setZoom(newZoom);
    })
    .onEnd(() => {
      // Snap zoomIndex to nearest step
      let nearest = 0;
      let minDist = Math.abs(zoom - ZOOM_STEPS[0]);
      for (let i = 1; i < ZOOM_STEPS.length; i++) {
        const dist = Math.abs(zoom - ZOOM_STEPS[i]);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      setZoomIndex(nearest);
    });

  const zoomLabel = ZOOM_LABELS[zoomIndex];

  const handleOpenTips = () => {
    triggerButtonPress();
    router.push('/(tabs)/(scanner)/tips');
  };

  const handleResetCart = () => {
    triggerButtonPress();
    setBarcodeScanned(false);
    resetCart();
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

  const isBarcode = cart.currentStep === 'barcode';
  const isReady = cart.currentStep === 'ready';
  const hasLabel = cart.images.some((img) => img.type === 'label');

  return (
    <View style={styles.container}>
      {/* Camera View (full screen behind everything) */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
        zoom={zoom}
        {...(isBarcode ? {
          barcodeScannerSettings: { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] },
          onBarcodeScanned: handleBarcodeScanned,
        } : {})}
      />

      {/* Top Bar */}
      <SafeAreaView edges={['top']} style={styles.topBarSafe}>
        <View style={styles.topBar}>
          {/* Close — clear cart and go home */}
          <TouchableOpacity style={styles.topBarIcon} onPress={() => { resetCart(); router.navigate('/(tabs)/(home)'); }} activeOpacity={0.7}>
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
            {/* Rescan barcode (when past barcode step) */}
            {!isBarcode && (
              <TouchableOpacity style={styles.topBarIcon} onPress={() => { triggerButtonPress(); setBarcodeScanned(false); rescanBarcode(); }} activeOpacity={0.7}>
                <Ionicons name="barcode-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            )}

            {/* Reset cart (if images captured) */}
            {cart.images.length > 0 && (
              <TouchableOpacity style={styles.topBarIcon} onPress={handleResetCart} activeOpacity={0.7}>
                <Ionicons name="refresh" size={20} color={colors.white} />
              </TouchableOpacity>
            )}

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

      {/* Center: Crop overlay + pinch-to-zoom */}
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.centerOverlay}>
          <View style={styles.cropFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.instructionText}>
            {STEP_INSTRUCTIONS[cart.currentStep] || appConfig.scanner.instructionText}
          </Text>
        </View>
      </GestureDetector>

      {/* Bottom Controls */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        {/* Thumbnail strip — tap to remove */}
        {cart.images.length > 0 && (
          <View style={styles.thumbnailStrip}>
            {cart.images.map((img) => (
              <TouchableOpacity
                key={img.type}
                style={styles.thumbnailItem}
                onPress={() => removeImage(img.type)}
                activeOpacity={0.7}
              >
                <View style={styles.thumbnailWrapper}>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.thumbnailRemove}>
                    <Ionicons name="close" size={10} color={colors.white} />
                  </View>
                </View>
                <Text style={styles.thumbnailLabel}>
                  {img.type.charAt(0).toUpperCase() + img.type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Barcode detected indicator */}
        {cart.barcode && (
          <View style={styles.barcodeDetected}>
            <Ionicons name="barcode" size={14} color={colors.success} />
            <Text style={styles.barcodeDetectedText}>Barcode: {cart.barcode}</Text>
          </View>
        )}

        {isBarcode ? (
          /* Barcode step: scanning overlay + skip button */
          <View style={styles.readyControls}>
            <View style={styles.barcodeScanningIndicator}>
              <Ionicons name="barcode-outline" size={24} color={colors.accentPrimary} />
              <Text style={styles.barcodeScanningText}>Scanning for barcode...</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => { triggerButtonPress(); skipBarcode(); }}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={18} color={colors.accentPrimary} />
              <Text style={styles.secondaryButtonText}>Skip Barcode (Vintage Record)</Text>
            </TouchableOpacity>
          </View>
        ) : isReady ? (
          /* Ready state: optional label scan + Run Analysis */
          <View style={styles.readyControls}>
            {!hasLabel && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleScanLabelFromCamera}
                activeOpacity={0.7}
              >
                <Ionicons name="disc-outline" size={18} color={colors.accentPrimary} />
                <Text style={styles.secondaryButtonText}>
                  {appConfig.scanner.labelButtonText ?? 'Scan Center Label (Optional)'}
                </Text>
              </TouchableOpacity>
            )}
            <GradientButton
              text={appConfig.scanner.runAnalysisButtonText ?? 'Run Analysis'}
              onPress={handleRunAnalysis}
              icon="sparkles"
            />
          </View>
        ) : (
          /* Capture state: standard controls */
          <View style={styles.controls}>
            {/* Step label */}
            <Text style={styles.stepLabel}>
              {STEP_LABELS[cart.currentStep] || appConfig.scanner.analyzeButtonText}
            </Text>

            <View style={styles.controlsRow}>
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
          </View>
        )}
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

  // ── Thumbnail Strip ──
  thumbnailStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  thumbnailItem: {
    alignItems: 'center',
    gap: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accentPrimary,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,59,48,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  // ── Bottom Controls ──
  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  controls: {
    paddingBottom: spacing.md,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
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

  // ── Ready state controls ──
  readyControls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentPrimary,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accentPrimary,
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

  // ── Barcode Step ──
  barcodeDetected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  barcodeDetectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  barcodeScanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  barcodeScanningText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.accentPrimary,
  },
});
