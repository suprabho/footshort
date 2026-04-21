import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useFollowedStories } from '@/lib/useFollowedStories';

const STORY_DURATION_MS = 6000;

function relativeTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { data: groups, isLoading } = useFollowedStories();

  const initial = Math.max(0, Math.min(Number(start) || 0, (groups?.length ?? 1) - 1));
  const [entityIdx, setEntityIdx] = useState(initial);
  const [storyIdx, setStoryIdx] = useState(0);
  const progress = useSharedValue(0);

  const group = groups?.[entityIdx];
  const story = group?.items[storyIdx];

  const close = () => router.back();

  const goNext = () => {
    if (!groups) return;
    const g = groups[entityIdx];
    if (!g) return close();
    if (storyIdx + 1 < g.items.length) {
      setStoryIdx(storyIdx + 1);
    } else if (entityIdx + 1 < groups.length) {
      setEntityIdx(entityIdx + 1);
      setStoryIdx(0);
    } else {
      close();
    }
  };

  const goPrev = () => {
    if (!groups) return;
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (entityIdx > 0) {
      const prev = entityIdx - 1;
      const prevGroup = groups[prev];
      setEntityIdx(prev);
      setStoryIdx(prevGroup ? Math.max(0, prevGroup.items.length - 1) : 0);
    }
  };

  useEffect(() => {
    if (!story) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: STORY_DURATION_MS }, (finished) => {
      if (finished) runOnJS(goNext)();
    });
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityIdx, storyIdx, story?.article_id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#000' }}>
        <ActivityIndicator color="#00D26A" />
      </View>
    );
  }

  if (!groups || groups.length === 0 || !group || !story) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#000' }}>
        <Text className="text-text text-lg mb-2">No stories</Text>
        <Pressable onPress={close} className="mt-4">
          <Text className="text-accent">Close</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {story.image_url ? (
        <Image
          source={{ uri: story.image_url }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      {/* Faux gradient scrim behind bottom text for legibility */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.0)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }} />
      </View>

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {group.items.map((_, i) => (
            <ProgressBar key={i} state={i < storyIdx ? 'done' : i === storyIdx ? 'active' : 'pending'} progress={progress} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 4 }}>
          <View
            style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1a1a20' }}
          >
            {group.entity.crest_url ? (
              <Image
                source={{ uri: group.entity.crest_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : null}
          </View>
          <Text className="text-text text-sm font-semibold ml-2" numberOfLines={1} style={{ flex: 1 }}>
            {group.entity.name}
          </Text>
          <Text className="text-text/70 text-xs ml-2">{relativeTime(story.published_at)}</Text>
          <Pressable onPress={close} hitSlop={12} className="ml-3">
            <Text className="text-text text-xl">✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}>
        <View className="bg-surface/80 self-start rounded-full px-3 py-1 mb-3 border border-border">
          <Text className="text-text text-xs font-medium">{story.publisher}</Text>
        </View>
        <Text className="text-text text-2xl font-bold leading-tight mb-3">{story.headline}</Text>
        {story.summary ? (
          <Text className="text-text/90 text-[15px] leading-[22px]" numberOfLines={6}>
            {story.summary}
          </Text>
        ) : null}
        <Pressable
          onPress={() => router.push({ pathname: '/web', params: { url: story.url, publisher: story.publisher } })}
          className="mt-4 self-start"
          hitSlop={8}
        >
          <Text className="text-accent text-sm font-medium">Read at source →</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={goPrev}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%' }}
      />
      <Pressable
        onPress={goNext}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '67%' }}
      />
    </View>
  );
}

function ProgressBar({
  state,
  progress,
}: {
  state: 'done' | 'active' | 'pending';
  progress: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: state === 'active' ? progress.value : state === 'done' ? 1 : 0 }],
  }));
  const baseFill = useMemo(
    () => ({
      flex: 1,
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.3)' as const,
      borderRadius: 2,
      overflow: 'hidden' as const,
    }),
    []
  );
  return (
    <View style={baseFill}>
      <Animated.View
        style={[
          { height: '100%', width: '100%', backgroundColor: '#fff', transformOrigin: 'left' as const },
          style,
        ]}
      />
    </View>
  );
}
