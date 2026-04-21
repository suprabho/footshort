import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTeams } from '@/lib/useEntities';
import { useFollowMutation } from '@/lib/useFollows';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { EntityChip } from '@/components/EntityChip';

const MIN_TEAMS = 3;

export default function OnboardingTeams() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, refreshProfile } = useAuth();
  const { leagues } = useLocalSearchParams<{ leagues?: string }>();
  const leagueSlugs = useMemo(() => (leagues ? leagues.split(',').filter(Boolean) : []), [leagues]);

  const { data: teams, isLoading } = useTeams(leagueSlugs);
  const { follow } = useFollowMutation();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Group teams by league for readability
  const grouped = useMemo(() => {
    const map = new Map<string, typeof teams>();
    for (const t of teams ?? []) {
      const key = t.league_slug ?? 'other';
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [teams]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    if (!session) return;
    setBusy(true);
    await Promise.all(Array.from(picked).map((id) => follow.mutateAsync(id)));
    await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', session.user.id);
    await refreshProfile();
    setBusy(false);
    router.replace('/(tabs)');
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#00D26A" />
      </View>
    );
  }

  const canFinish = picked.size >= MIN_TEAMS;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-6 pt-6">
        <Text className="text-text text-3xl font-bold mb-1">Pick your teams</Text>
        <Text className="text-muted text-sm mb-6">Choose at least {MIN_TEAMS}. ({picked.size} selected)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {grouped.map(([leagueSlug, list]) => (
          <View key={leagueSlug} className="mb-6">
            <Text className="text-muted text-xs uppercase tracking-wide mb-2">{leagueSlug}</Text>
            <View className="flex-row flex-wrap">
              {list?.map((t) => (
                <EntityChip
                  key={t.id}
                  name={t.name}
                  crestUrl={t.crest_url}
                  selected={picked.has(t.id)}
                  onPress={() => toggle(t.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-6 py-4 border-t border-border bg-bg" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={finish}
          disabled={!canFinish || busy}
          className={`rounded-lg py-3 items-center ${canFinish && !busy ? 'bg-accent' : 'bg-surface'}`}
        >
          {busy ? (
            <ActivityIndicator color="#0B0B0F" />
          ) : (
            <Text className={canFinish ? 'text-bg font-semibold' : 'text-muted font-semibold'}>
              Finish
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
