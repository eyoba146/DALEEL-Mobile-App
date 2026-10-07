import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, radius, spacing, type as typeTokens } from '../theme/tokens';

type Props = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
};

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
      {!!onRetry && (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="secondary"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7D7',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    marginTop: 1,
  },
  message: {
    ...typeTokens.bodySmall,
    color: colors.error,
    flex: 1,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: spacing.md,
  },
});
