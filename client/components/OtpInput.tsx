/**
 * OtpInput — 6 individual animated boxes, auto-advance, backspace support, paste support.
 * Matches the pattern used by WhatsApp, Apple, banking apps.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { colors, radius, type } from '../theme/tokens';

type Props = {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
};

export function OtpInput({ length = 6, value, onChange, error }: Props) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const scales = useRef(Array.from({ length }, () => new Animated.Value(1))).current;

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  const focus = (i: number) => {
    if (i >= 0 && i < length) {
      inputs.current[i]?.focus();
      setFocusedIndex(i);
    }
  };

  const pop = (i: number) =>
    Animated.sequence([
      Animated.spring(scales[i], { toValue: 1.12, useNativeDriver: true, speed: 50, bounciness: 6 }),
      Animated.spring(scales[i], { toValue: 1,    useNativeDriver: true, speed: 50, bounciness: 0 }),
    ]).start();

  const handleChange = (text: string, i: number) => {
    // Support paste — if more than 1 char pasted, fill all boxes
    if (text.length > 1) {
      const cleaned = text.replace(/\D/g, '').slice(0, length);
      onChange(cleaned);
      if (cleaned.length === length) {
        inputs.current[length - 1]?.blur();
        setFocusedIndex(null);
      } else {
        focus(cleaned.length);
      }
      return;
    }

    const digit = text.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[i] = digit;
    const joined = newDigits.join('');
    onChange(joined);

    if (digit) {
      pop(i);
      if (i < length - 1) {
        focus(i + 1);
      } else {
        inputs.current[i]?.blur();
        setFocusedIndex(null);
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      const newDigits = [...digits];
      newDigits[i - 1] = '';
      onChange(newDigits.join(''));
      focus(i - 1);
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => {
        const filled = !!digit;
        const isFocused = focusedIndex === i;

        return (
          <Animated.View
            key={i}
            style={[
              styles.box,
              filled && styles.boxFilled,
              isFocused && styles.boxFocused,
              error && styles.boxError,
              { transform: [{ scale: scales[i] }] },
            ]}
          >
            <TextInput
              ref={el => { inputs.current[i] = el; }}
              style={styles.boxInput}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              onFocus={() => {
                setFocusedIndex(i);
                const firstEmpty = digits.findIndex(d => !d);
                if (firstEmpty !== -1 && firstEmpty !== i) {
                  focus(firstEmpty);
                }
              }}
              onBlur={() => {
                setFocusedIndex(prev => (prev === i ? null : prev));
              }}
              keyboardType="number-pad"
              maxLength={length}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              selectTextOnFocus
              caretHidden
            />
            {/* Visual digit */}
            {filled ? (
              <Text style={[styles.digit, error && styles.digitError]} pointerEvents="none">
                {digit}
              </Text>
            ) : isFocused ? (
              <View style={styles.cursor} pointerEvents="none" />
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}

const BOX_WIDTH = 48;
const BOX_HEIGHT = 58;
const BOX_GAP = 9;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BOX_GAP,
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: '#E8ECF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.navy,
    borderWidth: 2,
  },
  boxFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.navy,
    borderWidth: 1.5,
  },
  boxError: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  boxInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 24,
  },
  digit: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.navy,
    lineHeight: 28,
  },
  digitError: {
    color: colors.error,
  },
  cursor: {
    width: 2,
    height: 22,
    backgroundColor: colors.navy,
    borderRadius: 1,
  },
});

