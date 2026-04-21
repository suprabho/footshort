module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Must run before babel-preset-expo's codegen plugin so its
      // `isCodegenDeclaration` check fails on react-native-screens fabric files.
      './babel-plugins/skip-codegen-for-screens.js',
      // Reanimated must be last
      'react-native-reanimated/plugin',
    ],
  };
};
