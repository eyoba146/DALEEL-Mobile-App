import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, value, onChangeText, ...props }: Props) {
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
  const labelSize = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.charcoalSub, focused ? colors.navy : colors.charcoal],
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
        <Animated.Text
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.label,
            { top: labelTop, fontSize: labelSize, color: labelColor },
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
      </Animated.View>
      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  field: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldFocused: {
    borderColor: colors.gold,
    backgroundColor: '#FFFFFF',
  },
  fieldError: {
    borderColor: colors.error,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 38,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.charcoal,
    paddingBottom: 4,
    paddingTop: 0,
  },
  errorText: {
    ...type.caption,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
