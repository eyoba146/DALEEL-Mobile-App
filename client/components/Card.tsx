import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onTouchEnd?: () => void;
};

export function Card({ children, style, onTouchEnd }: Props) {
  return <View style={[styles.card, style]} onTouchEnd={onTouchEnd}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
});
