import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { GradientButton } from '@/components/GradientButton';
import { colors, typography, spacing } from '@/theme';
import { triggerButtonPress } from '@/utils/haptics';
import { useScanCart } from '@/context/ScanCartContext';
import { CapturedImage } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { showSuccessToast } from '@/components/SuccessToast';

const MIN_CROP_SIZE = 80;
const HANDLE_HIT = 28; // touch target for corner handles
const CORNER_VISUAL = 20;
const CORNER_THICKNESS = 3;

const VALID_IMAGE_TYPES: CapturedImage['type'][] = ['front', 'back', 'label'];

export default function CropScreen() {
  const { imageUri, imageType, mode, itemId, returnPath } = useLocalSearchParams<{
    imageUri: string;
    imageType: string;
    mode?: string; // 'scanner' | 'edit'
    itemId?: string;
    returnPath?: string;
  }>();
  const { addImage } = useScanCart();
  const updateCollectionItem = useAppStore((state) => state.updateCollectionItem);
  const collection = useAppStore((state) => state.collection);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [canvasLayout, setCanvasLayout] = useState<{ width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // The crop frame position/size (in canvas coordinates)
  const cropX = useSharedValue(0);
  const cropY = useSharedValue(0);
  const cropW = useSharedValue(0);
  const cropH = useSharedValue(0);

  // Saved values for gestures
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const savedW = useSharedValue(0);
  const savedH = useSharedValue(0);

  // Image display bounds within canvas
  const [imageBounds, setImageBounds] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const initCropFrame = useCallback((imgW: number, imgH: number, cW: number, cH: number) => {
    // Fit image into canvas (contain)
    const imgAspect = imgW / imgH;
    const canvasAspect = cW / cH;
    let dispW: number, dispH: number, offX: number, offY: number;

    if (imgAspect > canvasAspect) {
      dispW = cW;
      dispH = cW / imgAspect;
    } else {
      dispH = cH;
      dispW = cH * imgAspect;
    }
    offX = (cW - dispW) / 2;
    offY = (cH - dispH) / 2;

    setImageBounds({ x: offX, y: offY, w: dispW, h: dispH });

    // Initial crop frame: 80% of displayed image, centered
    const initSize = Math.min(dispW, dispH) * 0.8;
    const initX = offX + (dispW - initSize) / 2;
    const initY = offY + (dispH - initSize) / 2;

    cropX.value = initX;
    cropY.value = initY;
    cropW.value = initSize;
    cropH.value = initSize;
    savedX.value = initX;
    savedY.value = initY;
    savedW.value = initSize;
    savedH.value = initSize;
  }, []);

  const onImageLoad = useCallback((e: any) => {
    const source = e?.source;
    if (source?.width && source?.height) {
      setImageSize({ width: source.width, height: source.height });
      if (canvasLayout) {
        initCropFrame(source.width, source.height, canvasLayout.width, canvasLayout.height);
      }
    }
  }, [canvasLayout, initCropFrame]);

  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasLayout({ width, height });
    if (imageSize) {
      initCropFrame(imageSize.width, imageSize.height, width, height);
    }
  }, [imageSize, initCropFrame]);

  // Clamp helper (runs on UI thread)
  const clampFrame = (x: number, y: number, w: number, h: number) => {
    'worklet';
    const bx = imageBounds.x;
    const by = imageBounds.y;
    const bw = imageBounds.w;
    const bh = imageBounds.h;
    const cx = Math.max(bx, Math.min(x, bx + bw - w));
    const cy = Math.max(by, Math.min(y, by + bh - h));
    return { cx, cy };
  };

  // --- Drag the whole frame ---
  const framePan = Gesture.Pan()
    .onBegin(() => {
      savedX.value = cropX.value;
      savedY.value = cropY.value;
    })
    .onUpdate((e) => {
      const newX = savedX.value + e.translationX;
      const newY = savedY.value + e.translationY;
      const { cx, cy } = clampFrame(newX, newY, cropW.value, cropH.value);
      cropX.value = cx;
      cropY.value = cy;
    })
    .onEnd(() => {
      savedX.value = cropX.value;
      savedY.value = cropY.value;
    });

  // Shared values for image bounds so worklets don't read React state directly
  const boundsX = useSharedValue(imageBounds.x);
  const boundsY = useSharedValue(imageBounds.y);
  const boundsW = useSharedValue(imageBounds.w);
  const boundsH = useSharedValue(imageBounds.h);

  // Keep shared bounds values in sync with React state
  useEffect(() => {
    boundsX.value = imageBounds.x;
    boundsY.value = imageBounds.y;
    boundsW.value = imageBounds.w;
    boundsH.value = imageBounds.h;
  }, [imageBounds, boundsX, boundsY, boundsW, boundsH]);

  // --- Corner resize gestures ---
  const makeCornerGesture = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    return Gesture.Pan()
      .onBegin(() => {
        savedX.value = cropX.value;
        savedY.value = cropY.value;
        savedW.value = cropW.value;
        savedH.value = cropH.value;
      })
      .onUpdate((e) => {
        const bx = boundsX.value;
        const by = boundsY.value;
        const bw = boundsW.value;
        const bh = boundsH.value;

        let newX = savedX.value;
        let newY = savedY.value;
        let newW = savedW.value;
        let newH = savedH.value;

        if (corner === 'tl') {
          newX = savedX.value + e.translationX;
          newY = savedY.value + e.translationY;
          newW = savedW.value - e.translationX;
          newH = savedH.value - e.translationY;
        } else if (corner === 'tr') {
          newY = savedY.value + e.translationY;
          newW = savedW.value + e.translationX;
          newH = savedH.value - e.translationY;
        } else if (corner === 'bl') {
          newX = savedX.value + e.translationX;
          newW = savedW.value - e.translationX;
          newH = savedH.value + e.translationY;
        } else {
          newW = savedW.value + e.translationX;
          newH = savedH.value + e.translationY;
        }

        // Enforce minimum size
        if (newW < MIN_CROP_SIZE) {
          if (corner === 'tl' || corner === 'bl') newX = savedX.value + savedW.value - MIN_CROP_SIZE;
          newW = MIN_CROP_SIZE;
        }
        if (newH < MIN_CROP_SIZE) {
          if (corner === 'tl' || corner === 'tr') newY = savedY.value + savedH.value - MIN_CROP_SIZE;
          newH = MIN_CROP_SIZE;
        }

        // Clamp to image bounds
        newX = Math.max(bx, newX);
        newY = Math.max(by, newY);
        if (newX + newW > bx + bw) newW = bx + bw - newX;
        if (newY + newH > by + bh) newH = by + bh - newY;

        cropX.value = newX;
        cropY.value = newY;
        cropW.value = newW;
        cropH.value = newH;
      })
      .onEnd(() => {
        savedX.value = cropX.value;
        savedY.value = cropY.value;
        savedW.value = cropW.value;
        savedH.value = cropH.value;
      });
  };

  const tlGesture = makeCornerGesture('tl');
  const trGesture = makeCornerGesture('tr');
  const blGesture = makeCornerGesture('bl');
  const brGesture = makeCornerGesture('br');

  // Animated styles
  const frameStyle = useAnimatedStyle(() => ({
    left: cropX.value,
    top: cropY.value,
    width: cropW.value,
    height: cropH.value,
  }));

  // Overlay masks (the 4 dark regions around the crop frame)
  const topMaskStyle = useAnimatedStyle(() => ({
    left: 0, top: 0, right: 0, height: cropY.value,
  }));
  const bottomMaskStyle = useAnimatedStyle(() => ({
    left: 0, top: cropY.value + cropH.value, right: 0, bottom: 0,
  }));
  const leftMaskStyle = useAnimatedStyle(() => ({
    left: 0, top: cropY.value, width: cropX.value, height: cropH.value,
  }));
  const rightMaskStyle = useAnimatedStyle(() => ({
    left: cropX.value + cropW.value, top: cropY.value, right: 0, height: cropH.value,
  }));

  // Corner handle positions
  const tlStyle = useAnimatedStyle(() => ({
    left: cropX.value - HANDLE_HIT / 2,
    top: cropY.value - HANDLE_HIT / 2,
  }));
  const trStyle = useAnimatedStyle(() => ({
    left: cropX.value + cropW.value - HANDLE_HIT / 2,
    top: cropY.value - HANDLE_HIT / 2,
  }));
  const blStyle = useAnimatedStyle(() => ({
    left: cropX.value - HANDLE_HIT / 2,
    top: cropY.value + cropH.value - HANDLE_HIT / 2,
  }));
  const brStyle = useAnimatedStyle(() => ({
    left: cropX.value + cropW.value - HANDLE_HIT / 2,
    top: cropY.value + cropH.value - HANDLE_HIT / 2,
  }));

  const performCrop = async () => {
    if (!imageUri || !imageSize) return;

    // Validate imageType against the allowed set; fall back to 'front' if unknown
    const safeType: CapturedImage['type'] =
      imageType && VALID_IMAGE_TYPES.includes(imageType as CapturedImage['type'])
        ? (imageType as CapturedImage['type'])
        : 'front';

    setIsCropping(true);
    try {
      const { x: bx, y: by, w: bw, h: bh } = imageBounds;
      const scaleX = imageSize.width / bw;
      const scaleY = imageSize.height / bh;

      let originX = Math.round((cropX.value - bx) * scaleX);
      let originY = Math.round((cropY.value - by) * scaleY);
      let cropWidth = Math.round(cropW.value * scaleX);
      let cropHeight = Math.round(cropH.value * scaleY);

      // Clamp
      originX = Math.max(0, originX);
      originY = Math.max(0, originY);
      if (originX + cropWidth > imageSize.width) cropWidth = imageSize.width - originX;
      if (originY + cropHeight > imageSize.height) cropHeight = imageSize.height - originY;

      if (cropWidth <= 0 || cropHeight <= 0) {
        originX = 0;
        originY = 0;
        cropWidth = imageSize.width;
        cropHeight = imageSize.height;
      }

      const result = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.85, format: SaveFormat.JPEG }
      );

      if (mode === 'edit' && itemId) {
        // Edit mode: update existing collection item
        const item = collection.find((i) => i.id === itemId);
        if (item) {
          const existingImages = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];
          const updatedImages = [...existingImages, result.uri];
          updateCollectionItem(itemId, {
            images: updatedImages,
            imageUri: updatedImages[0],
          });
          showSuccessToast('Photo added');
        }
        // Navigate back to where we came from
        if (returnPath) {
          router.replace(returnPath);
        } else {
          router.back();
        }
      } else {
        // Scanner mode: add cropped image to cart and return to scanner
        addImage({ type: safeType, uri: result.uri });
        router.replace('/(tabs)/(scanner)');
      }
    } catch {
      if (mode === 'edit' && itemId) {
        // If crop fails in edit mode, add original image
        const item = collection.find((i) => i.id === itemId);
        if (item) {
          const existingImages = item.images?.length ? item.images : item.imageUri ? [item.imageUri] : [];
          const updatedImages = [...existingImages, imageUri || ''];
          updateCollectionItem(itemId, {
            images: updatedImages,
            imageUri: updatedImages[0],
          });
          showSuccessToast('Photo added');
        }
        if (returnPath) {
          router.replace(returnPath);
        } else {
          router.back();
        }
      } else {
        // Scanner mode: add original image to cart
        addImage({ type: safeType, uri: imageUri || '' });
        router.replace('/(tabs)/(scanner)');
      }
    } finally {
      setIsCropping(false);
    }
  };

  const handleConfirm = () => {
    triggerButtonPress();
    performCrop();
  };

  const handleRetake = () => {
    triggerButtonPress();
    router.back();
  };

  const typeLabel = imageType
    ? imageType.charAt(0).toUpperCase() + imageType.slice(1)
    : 'Photo';

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crop {typeLabel}</Text>
          <Text style={styles.headerHint}>Drag the frame or corners to adjust</Text>
        </View>

        {/* Canvas */}
        <View style={styles.canvasContainer} onLayout={onCanvasLayout}>
          {/* Static image */}
          {imageUri && canvasLayout && (
            <Image
              source={{ uri: imageUri }}
              style={{
                position: 'absolute',
                left: imageBounds.x,
                top: imageBounds.y,
                width: imageBounds.w || canvasLayout.width,
                height: imageBounds.h || canvasLayout.height,
              }}
              contentFit="fill"
              onLoad={onImageLoad}
            />
          )}

          {/* Dark overlay masks */}
          <Animated.View style={[styles.mask, topMaskStyle]} pointerEvents="none" />
          <Animated.View style={[styles.mask, bottomMaskStyle]} pointerEvents="none" />
          <Animated.View style={[styles.mask, leftMaskStyle]} pointerEvents="none" />
          <Animated.View style={[styles.mask, rightMaskStyle]} pointerEvents="none" />

          {/* Draggable crop frame */}
          <GestureDetector gesture={framePan}>
            <Animated.View style={[styles.cropFrame, frameStyle]}>
              {/* Grid lines */}
              <View style={[styles.gridLineH, { top: '33.33%' }]} />
              <View style={[styles.gridLineH, { top: '66.66%' }]} />
              <View style={[styles.gridLineV, { left: '33.33%' }]} />
              <View style={[styles.gridLineV, { left: '66.66%' }]} />

              {/* Corner visuals (inside the frame, non-interactive) */}
              <View style={[styles.cornerVisual, styles.cvTL]} />
              <View style={[styles.cornerVisual, styles.cvTR]} />
              <View style={[styles.cornerVisual, styles.cvBL]} />
              <View style={[styles.cornerVisual, styles.cvBR]} />
            </Animated.View>
          </GestureDetector>

          {/* Corner drag handles (larger hit areas, positioned absolute on canvas) */}
          <GestureDetector gesture={tlGesture}>
            <Animated.View style={[styles.cornerHandle, tlStyle]} />
          </GestureDetector>
          <GestureDetector gesture={trGesture}>
            <Animated.View style={[styles.cornerHandle, trStyle]} />
          </GestureDetector>
          <GestureDetector gesture={blGesture}>
            <Animated.View style={[styles.cornerHandle, blStyle]} />
          </GestureDetector>
          <GestureDetector gesture={brGesture}>
            <Animated.View style={[styles.cornerHandle, brStyle]} />
          </GestureDetector>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <GradientButton
            text="Retake"
            onPress={handleRetake}
            variant="secondary"
            disabled={isCropping}
          />
          <View style={styles.spacer} />
          <GradientButton
            text={isCropping ? 'Cropping...' : 'Confirm'}
            onPress={handleConfirm}
            icon={isCropping ? undefined : 'checkmark'}
            disabled={isCropping}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerHint: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  // Dark overlay
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  // Crop frame border
  cropFrame: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  // Rule-of-thirds grid
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  // Corner visual brackets (inside frame)
  cornerVisual: {
    position: 'absolute',
    width: CORNER_VISUAL,
    height: CORNER_VISUAL,
  },
  cvTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
  },
  cvTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
  },
  cvBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.white,
  },
  cvBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.white,
  },
  // Invisible corner drag handles (bigger hit area)
  cornerHandle: {
    position: 'absolute',
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    zIndex: 10,
  },
  controls: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
});
