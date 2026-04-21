import { FlatList, useWindowDimensions, View } from 'react-native';
import type { FeedCard as FeedCardType } from '@shortfoot/shared/schemas';
import { FeedCard } from './FeedCard';

type Props = {
  items: FeedCardType[];
  onEndReached?: () => void;
  ListFooterComponent?: React.ReactElement;
};

export function CardSwiper({ items, onEndReached, ListFooterComponent }: Props) {
  const { height } = useWindowDimensions();
  const cardHeight = height;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.article_id}
      renderItem={({ item }) => (
        <View style={{ height: cardHeight }}>
          <FeedCard
            headline={item.headline}
            summary={item.summary}
            imageUrl={item.image_url}
            publisher={item.publisher}
            url={item.url}
            publishedAt={item.published_at}
          />
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
