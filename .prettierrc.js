module.exports = {
  // Basic Settings
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Special Settings
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',

  // JSX Settings
  jsxBracketSameLine: false,

  // TypeScript Settings
  parser: 'typescript',

  // Tailwind CSS Settings
  tailwindConfig: './tailwind.config.js',

  // File Settings
  overrides: [
    {
      files: ['*.json', '*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        tabWidth: 2,
        proseWrap: 'always',
      },
    },
    {
      files: '*.tsx',
      options: {
        parser: 'typescript',
      },
    },
  ],

  // Plugin Settings
  plugins: ['prettier-plugin-tailwindcss', '@trivago/prettier-plugin-sort-imports'],

  // Import Sorting
  importOrder: [
    '^react',
    '^next',
    '^@/components/(.*)$',
    '^@/lib/(.*)$',
    '^@/hooks/(.*)$',
    '^@/styles/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
