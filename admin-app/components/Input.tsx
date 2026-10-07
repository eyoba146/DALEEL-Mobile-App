import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '../theme/tokens';

type Props = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Input({
  label,
  error,
  leftIcon,
  rightElement,
  rightIcon,
  style,
  value,
  onChangeText,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);
  const floatAnim = useRef(new Animated.Value(value && value.length > 0 ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const hasValue = !!(value && value.length > 0);

  useEffect(() => {
    if (hasValue || focused) {
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }).start();
    }
  }, [hasValue, focused]);

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  const labelTop = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 7] });
  const labelSize = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [14.5, 11] });
  const labelColor = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, focused ? colors.navy : colors.textPrimary],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? colors.error : focused ? colors.navy : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <View style={styles.inputInner}>
          <Animated.Text
            onPress={() => inputRef.current?.focus()}
            style={[
              styles.label,
              { top: labelTop, fontSize: labelSize, color: labelColor },
              leftIcon ? { left: 0 } : {},
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, style]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor="transparent"
            {...props}
          />
        </View>

        {(rightElement || rightIcon) && (
          <View style={styles.rightElement}>{rightElement || rightIcon}</View>
        )}
      </Animated.View>

      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  field: {
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldFocused: {
    borderColor: colors.navy,
    backgroundColor: '#FFFFFF',
  },
  fieldError: {
    borderColor: colors.error,
    borderWidth: 1.5,
    backgroundColor: colors.errorSoft,
  },
  leftIcon: {
    marginRight: 10,
    marginTop: 6,
  },
  inputInner: {
    flex: 1,
    height: 54,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 32,
    paddingBottom: 4,
    paddingTop: 0,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  rightElement: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    ...type.caption,
    color: colors.error,
    fontWeight: '500',
  },
});
