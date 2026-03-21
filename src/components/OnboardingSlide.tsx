import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { OnboardingSlide as OnboardingSlideType } from '@/types';
import { colors, typography, spacing } from '@/theme';

const { width } = Dimensions.get('window');

interface Props {
  slide: OnboardingSlideType;
}

export function OnboardingSlide({ slide }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={slide.image} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.6,
    height: width * 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
