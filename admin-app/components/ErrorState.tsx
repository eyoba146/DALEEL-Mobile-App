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
  message = 'Failed to load platform data. Please check connection.',
  onRetry,
  retryLabel = 'Retry',
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconRow}>
        <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginTop: 1 }} />
        <Text style={styles.message}>{message}</Text>
      </View>
      {!!onRetry && (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="secondary"
          size="small"
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
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  message: {
    ...typeTokens.bodySmall,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
});
