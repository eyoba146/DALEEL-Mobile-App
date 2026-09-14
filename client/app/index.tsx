import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { colors } from '../theme/tokens';

export default function Index() {
  const { isReady, user, onboarding } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  if (onboarding) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/onboarding" />;
}
