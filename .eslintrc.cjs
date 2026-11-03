module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  extends: ['@nuxtjs/eslint-config-typescript', 'plugin:prettier/recommended'],
  plugins: [],
  rules: {
    'nuxt/no-cjs-in-config': 0,
    'vue/comment-directive': 0,
    'vue/valid-v-on': 0,
    'import/named': 0,
    camelcase: 0,
    'vue/multi-word-component-names': 0,
    'vue/no-multiple-template-root': 0,
    'no-console': ['warn', { allow: ['error'] }],
    'vue/no-v-text-v-html-on-component': [
      'off',
      { allow: ['router-link', 'nuxt-link'] },
    ],
    'vue/no-v-html': 'off',
    'vue/html-self-closing': 'off',
    'max-len': ['error', { code: 130 }],
  },
};
