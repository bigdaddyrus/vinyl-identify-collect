import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Platform-safe haptic feedback utilities
 * Gracefully handles platforms that don't support haptics
 */

export const triggerImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      await Haptics.impactAsync(
        style === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : style === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium
      );
    } catch (error) {
      // Silently fail on unsupported devices
      console.warn('Haptics not supported:', error);
    }
  }
};

export const triggerNotification = async (
  type: 'success' | 'warning' | 'error' = 'success'
) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      await Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (error) {
      console.warn('Haptics not supported:', error);
    }
  }
};

export const triggerSelection = async () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptics not supported:', error);
    }
  }
};

/**
 * Specialized haptics for key app moments
 */

// Heavy vibration when price is revealed on result screen
export const triggerPriceReveal = () => triggerImpact('heavy');

// Success vibration when item added to collection
export const triggerCollectionAdd = () => triggerNotification('success');

// Light feedback for button taps
export const triggerButtonPress = () => triggerImpact('light');
