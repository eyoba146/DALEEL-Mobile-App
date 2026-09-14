import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadow, type } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (variant === 'primary' || variant === 'gold') && shadow.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? colors.navy : '#fff'}
          size="small"
        />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  primary: {
    backgroundColor: colors.navy,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    height: 44,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
  label: {
    ...type.button,
    letterSpacing: 0.3,
  },
});

const labelStyles = StyleSheet.create({
  primary:   { color: '#fff' },
  gold:      { color: '#fff' },
  secondary: { color: colors.charcoal },
  ghost:     { color: colors.navy },
  danger:    { color: colors.error },
});

