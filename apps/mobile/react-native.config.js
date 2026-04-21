// Prevent react-native-worklets from being autolinked into the Android/iOS build.
// We only need its babel plugin (required by nativewind) — its native module is
// incompatible with Reanimated 3.16 / RN 0.76.
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
