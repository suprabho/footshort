import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthProvider';
import { useFollows } from '@/lib/useFollows';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { data: follows } = useFollows();
  const email = session?.user?.email;

  return (
    <View className="flex-1 bg-bg px-6" style={{ paddingTop: insets.top + 24 }}>
      <Text className="text-text text-2xl font-bold mb-1">Profile</Text>
      <Text className="text-muted text-sm mb-8">{email ?? 'Not signed in'}</Text>

      <Pressable
        onPress={() => router.push('/following')}
        className="flex-row items-center justify-between bg-surface border border-border rounded-lg px-4 py-3 mb-3"
      >
        <Text className="text-text font-medium">Following</Text>
        <Text className="text-muted text-sm">
          {follows?.length ?? 0} →
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/admin')}
        className="flex-row items-center justify-between bg-surface border border-border rounded-lg px-4 py-3 mb-3"
      >
        <Text className="text-text font-medium">Pipeline stats</Text>
        <Text className="text-muted text-sm">→</Text>
      </Pressable>

      <Pressable
        onPress={signOut}
        className="bg-surface border border-border rounded-lg py-3 items-center mt-4"
      >
        <Text className="text-text font-medium">Sign out</Text>
      </Pressable>
    </View>
  );
}
