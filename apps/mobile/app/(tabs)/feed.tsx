import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthProvider';
import { useDiscoverFeed, useFeed } from '@/lib/useFeed';
import { useFollowedStories } from '@/lib/useFollowedStories';
import { CardSwiper } from '@/components/CardSwiper';
import { StoryRings } from '@/components/StoryRings';

type Tab = 'discover' | 'forYou';

const RINGS_HEIGHT = 104;

function PillTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View className="flex-row bg-surface/60 rounded-full p-1 border border-border">
      {([
        { key: 'discover', label: 'Discover' },
        { key: 'forYou', label: 'For you' },
      ] as const).map((t) => {
        const selected = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            className={`px-4 py-1.5 rounded-full ${selected ? 'bg-accent' : ''}`}
          >
            <Text className={selected ? 'text-bg text-sm font-semibold' : 'text-muted text-sm font-medium'}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProfileButton() {
  const router = useRouter();
  const { session } = useAuth();
  const letter = (session?.user?.email ?? '?').charAt(0).toUpperCase();
  return (
    <Pressable
      onPress={() => router.push('/(tabs)/profile')}
      hitSlop={8}
      className="w-10 h-10 rounded-full bg-surface/80 border border-border items-center justify-center"
    >
      <Text className="text-text text-sm font-semibold">{letter}</Text>
    </Pressable>
  );
}

function FeedBody({ tab }: { tab: Tab }) {
  const insets = useSafeAreaInsets();
  const forYou = useFeed();
  const discover = useDiscoverFeed();
  const stories = useFollowedStories();
  const active = tab === 'forYou' ? forYou : discover;

  const showRings = tab === 'forYou' && (stories.data?.length ?? 0) > 0;
  const topGap = insets.top + 56 + (showRings ? RINGS_HEIGHT : 0);

  if (active.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#00D26A" />
      </View>
    );
  }

  if (active.error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text text-lg mb-2">Could not load</Text>
        <Text className="text-muted text-sm text-center">{(active.error as Error).message}</Text>
      </View>
    );
  }

  const items = active.data?.pages.flat() ?? [];

  if (items.length === 0 && !showRings) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text text-lg mb-2">Nothing here yet</Text>
        <Text className="text-muted text-sm text-center">
          {tab === 'forYou'
            ? 'No articles match what you follow. Add more or check back later.'
            : 'No recent stories yet. Check back soon.'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <CardSwiper
        items={items}
        topGap={topGap}
        onEndReached={() => {
          if (active.hasNextPage && !active.isFetchingNextPage) active.fetchNextPage();
        }}
      />
      {showRings ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 56, height: RINGS_HEIGHT }}
        >
          <StoryRings groups={stories.data!} />
        </View>
      ) : null}
    </>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('discover');

  return (
    <View className="flex-1 bg-bg">
      <FeedBody tab={tab} />

      {/* Top overlay: pill tabs centered, follows button top-right */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        <ProfileButton />
        <PillTabs active={tab} onChange={setTab} />
        <View className="w-10" />
      </View>
    </View>
  );
}
