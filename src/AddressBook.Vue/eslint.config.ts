import pluginJs from '@eslint/js';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import pluginVue from 'eslint-plugin-vue';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// typescript-eslint is wired directly instead of through @vue/eslint-config-typescript, whose
// dependency tree pulls in a braces version with an open high-severity advisory.
export default tseslint.config(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue}'] },
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/coverage/**']),
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    // .vue files are parsed by vue-eslint-parser, which hands <script lang="ts"> to the TS parser.
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  skipFormatting,
);
