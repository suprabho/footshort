import { FlatList, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FeedCard as FeedCardType } from '@shortfoot/shared/schemas';
import { FeedCard } from './FeedCard';

type Props = {
  items: FeedCardType[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ReactElement;
  topGap?: number;
};

export function CardSwiper({ items, onEndReached, ListFooterComponent, topGap: topGapOverride }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardHeight = height;
  // Header pill tabs sit at insets.top + 8 with ~36px height; leave room below them.
  const topGap = topGapOverride ?? insets.top + 56;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.article_id}
      renderItem={({ item }) => (
        <View style={{ height: cardHeight, paddingTop: topGap, paddingHorizontal: 12 }}>
          <View className="flex-1 rounded-t-3xl overflow-hidden bg-surface border border-b-0 border-border">
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
