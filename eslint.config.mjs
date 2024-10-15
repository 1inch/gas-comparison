import promise from 'eslint-plugin-promise';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [...compat.extends('standard', 'plugin:promise/recommended'), {
    plugins: {
        promise,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.mocha,
            ...globals.jest,
            artifacts: false,
            contract: false,
            assert: false,
            web3: false,
        },
    },

    rules: {
        strict: [2, 'global'],

        indent: [2, 4, {
            SwitchCase: 1,
        }],

        quotes: [2, 'single'],
        semi: ['error', 'always'],

        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always',
        }],

        'no-use-before-define': 0,
        'no-unused-expressions': 'off',
        eqeqeq: [2, 'smart'],

        'dot-notation': [2, {
            allowKeywords: true,
            allowPattern: '',
        }],

        'no-redeclare': [2, {
            builtinGlobals: true,
        }],

        'no-trailing-spaces': [2, {
            skipBlankLines: true,
        }],

        'eol-last': 1,

        'comma-spacing': [2, {
            before: false,
            after: true,
        }],

        camelcase: [2, {
            properties: 'always',
        }],

        'no-mixed-spaces-and-tabs': [2, 'smart-tabs'],
        'comma-dangle': [1, 'always-multiline'],
        'no-dupe-args': 2,
        'no-dupe-keys': 2,
        'no-debugger': 0,
        'no-undef': 2,
        'object-curly-spacing': [2, 'always'],
        'max-len': [2, 160],
        'generator-star-spacing': ['error', 'before'],
        'promise/avoid-new': 0,
        'promise/always-return': 0,
    },
}];
