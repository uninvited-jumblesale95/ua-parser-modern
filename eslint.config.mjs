import antfu from '@antfu/eslint-config'

export default antfu()
  .append(
    {
      files: ['src/index.ts'],
      rules: {
        'e18e/prefer-static-regex': 'off',
        'regexp/no-contradiction-with-assertion': 'off',
        'regexp/no-misleading-capturing-group': 'off',
        'regexp/no-optional-assertion': 'off',
        'regexp/no-super-linear-backtracking': 'off',
        'regexp/optimal-lookaround-quantifier': 'off',
        'regexp/optimal-quantifier-concatenation': 'off',
        'regexp/strict': 'off',
      },
    },
    {
      files: ['test/index.test-d.ts', 'test/index.test.ts'],
      rules: {
        'e18e/prefer-static-regex': 'off',
        'regexp/no-misleading-capturing-group': 'off',
        'regexp/optimal-quantifier-concatenation': 'off',
      },
    },
  )
