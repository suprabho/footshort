import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Entity = {
  id: string;
  type: 'league' | 'team' | 'player';
  slug: string;
  name: string;
  country: string | null;
  league_slug: string | null;
  crest_url: string | null;
};

export function useLeagues() {
  return useQuery({
    queryKey: ['entities', 'leagues'],
    queryFn: async (): Promise<Entity[]> => {
      const { data, error } = await supabase
        .from('entities')
        .select('id, type, slug, name, country, league_slug, crest_url')
        .eq('type', 'league')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Entity[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTeams(leagueSlugs: string[] | null) {
  return useQuery({
    queryKey: ['entities', 'teams', leagueSlugs?.sort()],
    enabled: !!leagueSlugs && leagueSlugs.length > 0,
    queryFn: async (): Promise<Entity[]> => {
      let q = supabase
        .from('entities')
        .select('id, type, slug, name, country, league_slug, crest_url')
        .eq('type', 'team')
        .order('name');
      if (leagueSlugs && leagueSlugs.length > 0) q = q.in('league_slug', leagueSlugs);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Entity[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
