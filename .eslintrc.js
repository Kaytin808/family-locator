module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-void': 'off',
    'react/no-unstable-nested-components': ['warn', {allowAsProps: true}],
    'react-native/no-inline-styles': 'off',
  },
};
