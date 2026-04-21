/**
 * Seed canonical entities from football-data.org.
 *
 * Run once to populate the entities table with leagues, teams, and (phase 2) players.
 * Uses the free tier (12 competitions) for MVP — migrate to api-football later
 * for broader coverage.
 *
 * Usage: npm run seed
 */

import { createClient } from '@supabase/supabase-js';

const FD_BASE = 'https://api.football-data.org/v4';
const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * football-data.org stores official names ("Juventus FC", "SSC Napoli", "Bologna FC 1909"),
 * but news articles — and Gemini's extraction — use common names ("Juventus", "Napoli", "Bologna").
 * We strip club-type suffixes/prefixes and trailing founding years so the slug matches
 * what the resolver sees. The original name is preserved on `name` for display.
 */
function commonName(name: string): string {
  return name
    // Drop governing-body prefixes on league names
    .replace(/\b(UEFA|FIFA|CONMEBOL|CONCACAF|AFC Champions)\b/gi, '')
    // Drop club-type tokens anywhere in the name (case-insensitive: VfB, HSV, etc.)
    .replace(/\b(FC|CF|CD|SSC|SS|AFC|AC|AS|RC|RCD|CA|SL|SC|BK|IF|FK|NK|HSV|TSV|VFL|VFB|RB)\b/gi, '')
    // Drop leading "1. FC" / "1. FSV" style prefixes (German)
    .replace(/^\s*\d+\.\s*(FC|FSV|FCN)?\s*/i, '')
    // Drop trailing founding years
    .replace(/\b(18|19|20)\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fdFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${FD_BASE}${path}`, {
    headers: { 'X-Auth-Token': FD_TOKEN },
  });
  if (!res.ok) {
    throw new Error(`football-data ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Rate limit: 10 req/min on free tier → sleep 6.5s between calls to be safe
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seedLeagues() {
  console.log('[seed] leagues...');
  const data = await fdFetch<{ competitions: any[] }>('/competitions');

  // Free tier: 12 competitions. Filter to leagues/cups we want to surface.
  const wanted = new Set([
    'PL',   // Premier League
    'PD',   // La Liga
    'BL1',  // Bundesliga
    'SA',   // Serie A
    'FL1',  // Ligue 1
    'CL',   // Champions League
    'EL',   // Europa League
    'WC',   // World Cup
    'EC',   // Euros
    'DED',  // Eredivisie
    'PPL',  // Primeira Liga
    'BSA',  // Brazil Série A
    'ELC',  // Championship
  ]);

  const rows = data.competitions
    .filter((c) => wanted.has(c.code))
    .map((c) => ({
      type: 'league' as const,
      slug: slugify(commonName(c.name)),
      name: c.name,
      football_data_id: c.id,
      country: c.area?.name ?? null,
      crest_url: c.emblem ?? null,
    }));

  const { error } = await supabase
    .from('entities')
    .upsert(rows, { onConflict: 'type,slug' });

  if (error) throw error;
  console.log(`[seed] upserted ${rows.length} leagues`);
  return data.competitions.filter((c) => wanted.has(c.code));
}

async function seedTeams(competitions: any[]) {
  console.log('[seed] teams...');
  const allTeams: any[] = [];

  for (const comp of competitions) {
    await sleep(6500); // rate limit
    try {
      const data = await fdFetch<{ teams: any[] }>(`/competitions/${comp.code}/teams`);
      const leagueSlug = slugify(commonName(comp.name));
      for (const t of data.teams) {
        allTeams.push({
          type: 'team' as const,
          slug: slugify(commonName(t.name)),
          name: t.name,
          football_data_id: t.id,
          country: t.area?.name ?? null,
          league_slug: leagueSlug,
          crest_url: t.crest ?? null,
        });
      }
      console.log(`  [${comp.code}] +${data.teams.length} teams`);
    } catch (e) {
      console.error(`  [${comp.code}] failed:`, e);
    }
  }

  // Dedupe by slug (teams appear in multiple competitions — e.g., Man City is in PL + CL)
  const deduped = Array.from(
    new Map(allTeams.map((t) => [t.slug, t])).values()
  );

  const { error } = await supabase
    .from('entities')
    .upsert(deduped, { onConflict: 'type,slug' });

  if (error) throw error;
  console.log(`[seed] upserted ${deduped.length} unique teams`);
}

async function main() {
  if (!FD_TOKEN) throw new Error('FOOTBALL_DATA_TOKEN required');
  const comps = await seedLeagues();
  await seedTeams(comps);
  console.log('[seed] done. Players left as phase 2 (needs paid tier for squad data).');
}

main().catch((e) => {
  console.error('[seed] fatal:', e);
  process.exit(1);
});
