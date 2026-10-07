import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, type } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type ButtonSize = 'default' | 'small' | 'large';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'default',
  icon,
  iconPosition = 'left',
  style,
  fullWidth,
}: Props) {
  const isDisabled = disabled || loading;

  const iconColor =
    variant === 'secondary' || variant === 'ghost' || variant === 'outline'
      ? colors.navy
      : variant === 'danger'
        ? colors.error
        : '#FFFFFF';

  const iconSize = size === 'small' ? 16 : 18;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        (variant === 'primary' || variant === 'gold') && shadow.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        fullWidth && { width: '100%' as any },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? colors.navy : '#fff'}
          size="small"
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.label, labelStyles[variant], size === 'small' && styles.labelSmall]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...type.button,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    height: 40,
    paddingHorizontal: 16,
  },
  default: {
    height: 50,
    paddingHorizontal: 24,
  },
  large: {
    height: 56,
    paddingHorizontal: 32,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.navy,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
});

const labelStyles = StyleSheet.create({
  primary:   { color: '#FFFFFF' },
  gold:      { color: '#FFFFFF' },
  secondary: { color: colors.navy },
  outline:   { color: colors.navy },
  ghost:     { color: colors.navy },
  danger:    { color: colors.error },
});
