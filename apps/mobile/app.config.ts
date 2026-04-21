import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'ShortFoot',
  slug: 'footshort',
  owner: 'promaddesign',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  scheme: 'shortfoot',
  android: {
    package: 'app.shortfoot',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#0B0B0F',
    },
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: '718ceb3c-a4cc-4180-867f-813e1be1d476',
    },
  },
};

export default config;
