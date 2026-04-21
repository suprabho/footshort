import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';
import type { FeedCard } from '@shortfoot/shared/schemas';

const PAGE_SIZE = 20;

/**
 * Fetch the personalized feed for the current user.
 * Returns cards for entities the user follows, paginated by published_at.
 */
export function useFeed() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  return useInfiniteQuery({
    queryKey: ['feed', userId],
    enabled: !!userId,
    initialPageParam: null as string | null, // cursor = last published_at
    queryFn: async ({ pageParam }) => {
      if (!userId) return [] as FeedCard[];
      let query = supabase
        .from('user_feed')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('published_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FeedCard[];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return null;
      return lastPage[lastPage.length - 1]?.published_at ?? null;
    },
  });
}

/**
 * Discover feed — for users who haven't followed anything yet (or "Top stories" tab).
 * Returns cluster leads from the last 24h, ordered by recency.
 */
export function useDiscoverFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'discover'],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('articles')
        .select('id, headline, summary, image_url, publisher, url, published_at, cluster_id')
        .eq('status', 'summarized')
        .or('is_cluster_lead.eq.true,cluster_id.is.null')
        .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) query = query.lt('published_at', pageParam);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        article_id: r.id,
        ...r,
      })) as FeedCard[];
    },
    getNextPageParam: (lastPage) =>
      lastPage.length < PAGE_SIZE ? null : (lastPage[lastPage.length - 1]?.published_at ?? null),
  });
}
