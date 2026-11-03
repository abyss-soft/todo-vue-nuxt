module.exports = {
  extends: [
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss',
  ],
  plugins: ['@stylistic/stylelint-plugin'],
  rules: {
    'no-descending-specificity': null,
    '@stylistic/declaration-block-semicolon-newline-after': 'always',
    '@stylistic/block-opening-brace-space-before': 'always',
    '@stylistic/max-empty-lines': 1,
  },
};
