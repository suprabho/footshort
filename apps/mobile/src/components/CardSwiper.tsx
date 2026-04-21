import { FlatList, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FeedCard as FeedCardType } from '@shortfoot/shared/schemas';
import { FeedCard } from './FeedCard';

type Props = {
  items: FeedCardType[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ReactElement;
};

export function CardSwiper({ items, onEndReached, ListFooterComponent }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardHeight = height;
  // Header pill tabs sit at insets.top + 8 with ~36px height; leave room below them.
  const topGap = insets.top + 56;
  const bottomGap = insets.bottom + 16;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.article_id}
      renderItem={({ item }) => (
        <View style={{ height: cardHeight, paddingTop: topGap, paddingBottom: bottomGap, paddingHorizontal: 12 }}>
          <View className="flex-1 rounded-3xl overflow-hidden bg-surface border border-border">
            <FeedCard
              headline={item.headline}
              summary={item.summary}
              imageUrl={item.image_url}
              publisher={item.publisher}
              url={item.url}
              publishedAt={item.published_at}
            />
          </View>
        </View>
      )}
      pagingEnabled
      snapToInterval={cardHeight}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
    />
  );
}
