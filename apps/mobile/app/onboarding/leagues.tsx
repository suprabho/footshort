import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagues } from '@/lib/useEntities';
import { useFollowMutation } from '@/lib/useFollows';
import { EntityChip } from '@/components/EntityChip';

const MIN_LEAGUES = 3;

export default function OnboardingLeagues() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: leagues, isLoading } = useLeagues();
  const { follow } = useFollowMutation();
  const [picked, setPicked] = useState<Set<string>>(new Set()); // entity IDs
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function next() {
    setBusy(true);
    // Follow the picked leagues in parallel
    await Promise.all(Array.from(picked).map((id) => follow.mutateAsync(id)));
    setBusy(false);
    const slugs = (leagues ?? []).filter((l) => picked.has(l.id)).map((l) => l.slug);
    router.push({ pathname: '/onboarding/teams', params: { leagues: slugs.join(',') } });
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#00D26A" />
      </View>
    );
  }

  const canContinue = picked.size >= MIN_LEAGUES;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-6">
        <Text className="text-text text-3xl font-bold mb-1">Pick your leagues</Text>
        <Text className="text-muted text-sm mb-6">Choose at least {MIN_LEAGUES}. ({picked.size} selected)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <View className="flex-row flex-wrap">
          {leagues?.map((l) => (
            <EntityChip
              key={l.id}
              name={l.name}
              crestUrl={l.crest_url}
              selected={picked.has(l.id)}
              onPress={() => toggle(l.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-border bg-bg" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={next}
          disabled={!canContinue || busy}
          className={`rounded-lg py-3 items-center ${canContinue && !busy ? 'bg-accent' : 'bg-surface'}`}
        >
          {busy ? (
            <ActivityIndicator color="#0B0B0F" />
          ) : (
            <Text className={canContinue ? 'text-bg font-semibold' : 'text-muted font-semibold'}>
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
