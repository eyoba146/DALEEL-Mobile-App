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
  label?: string;
  title?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  label,
  title,
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
  const buttonText = label || title || '';

  const iconColor =
    variant === 'secondary' || variant === 'ghost' || variant === 'outline'
      ? colors.navy
      : variant === 'danger'
        ? colors.error
        : '#FFFFFF';

  const iconSize = size === 'small' ? 16 : 18;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={iconColor}
          style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
        />
      );
    }
    return <View style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}>{icon}</View>;
  };

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
          {iconPosition === 'left' && renderIcon()}
          <Text style={[styles.label, labelStyles[variant], size === 'small' && styles.labelSmall]}>
            {buttonText}
          </Text>
          {iconPosition === 'right' && renderIcon()}
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
  label: {
    ...type.button,
  },
  labelSmall: {
    fontSize: 13,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
  },
  default: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 46,
  },
  large: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    minHeight: 52,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.navy,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  danger: {
    backgroundColor: colors.error,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: colors.navy,
  },
  gold: {
    color: colors.navy,
    fontWeight: '700',
  },
  ghost: {
    color: colors.navy,
  },
  outline: {
    color: colors.navy,
  },
  danger: {
    color: '#FFFFFF',
  },
});
