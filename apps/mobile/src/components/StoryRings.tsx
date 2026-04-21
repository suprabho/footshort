import { FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { StoryGroup } from '@/lib/useFollowedStories';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function StoryRings({ groups }: { groups: StoryGroup[] }) {
  const router = useRouter();

  return (
    <FlatList
      data={groups}
      horizontal
      keyExtractor={(g) => g.entity.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4, gap: 14 }}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/story', params: { start: String(index) } })}
          hitSlop={4}
        >
          <View className="items-center" style={{ width: 72 }}>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ padding: 2, backgroundColor: '#00D26A' }}
            >
              <View
                className="flex-1 rounded-full bg-bg items-center justify-center"
                style={{ padding: 2, alignSelf: 'stretch' }}
              >
                <View className="flex-1 self-stretch rounded-full bg-surface items-center justify-center overflow-hidden">
                  {item.entity.crest_url ? (
                    <Image
                      source={{ uri: item.entity.crest_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={120}
                    />
                  ) : (
                    <Text className="text-text text-sm font-semibold">
                      {initialsOf(item.entity.name)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <Text
              className="text-muted text-[11px] mt-1"
              numberOfLines={1}
              style={{ maxWidth: 72 }}
            >
              {item.entity.name}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}
