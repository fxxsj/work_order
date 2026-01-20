module.exports = {
  root: true,

  env: {
    node: true,
    browser: true,
    es2021: true,
    jest: true
  },

  extends: [
    'plugin:vue/recommended',  // 升级到 recommended
    'eslint:recommended'
  ],

  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2021,
    sourceType: 'module'
  },

  rules: {
    // ===== Vue 规则 =====
    // 组件命名：必须多词，PascalCase
    'vue/multi-word-component-names': ['error', {
      ignores: ['Layout', 'Dashboard', 'Login', 'Profile', 'Notification', 'Pagination']
    }],

    // 组件名必须使用 PascalCase
    'vue/component-definition-name-casing': ['error', 'PascalCase'],

    // Props 必须使用 camelCase
    'vue/prop-name-casing': ['error', 'camelCase'],

    // 属性顺序
    'vue/attributes-order': ['error', {
      order: [
        'DEFINITION',
        'LIST_RENDERING',
        'CONDITIONALS',
        'RENDER_MODIFIERS',
        'GLOBAL',
        'UNIQUE',
        'TWO_WAY_BINDING',
        'OTHER_DIRECTIVES',
        'OTHER_ATTR',
        'EVENTS',
        'CONTENT'
      ]
    }],

    // 组件选项顺序
    'vue/order-in-components': ['error', {
      order: [
        'el',
        'name',
        'parent',
        'functional',
        ['delimiters', 'comments'],
        ['components', 'directives', 'filters'],
        'extends',
        'mixins',
        'inheritAttrs',
        'model',
        ['props', 'propsData'],
        'data',
        'computed',
        'watch',
        'LIFECYCLE_HOOKS',
        'methods',
        ['template', 'render'],
        'renderError'
      ]
    }],

    // HTML 缩进 2 空格
    'vue/html-indent': ['error', 2, {
      attribute: 1,
      baseIndent: 1,
      closeBracket: 0,
      alignAttributesVertically: true
    }],

    // 组件标签必须自闭合
    'vue/html-self-closing': ['error', {
      html: {
        void: 'always',
        normal: 'never',
        component: 'always'
      }
    }],

    // 最大属性数（单行）
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1
    }],

    // Mustache 插值空格
    'vue/mustache-interpolation-spacing': ['error', 'always'],

    // 禁止未使用的组件
    'vue/no-unused-components': 'warn',

    // 禁止未使用的变量
    'vue/no-unused-vars': 'warn',

    // v-bind 简写
    'vue/v-bind-style': ['error', 'shorthand'],

    // v-on 简写
    'vue/v-on-style': ['error', 'shorthand'],

    // 必须有 name
    'vue/require-name-property': 'error',

    // Props 必须有默认值
    'vue/require-default-prop': 'error',

    // Props 必须有类型
    'vue/require-prop-types': 'error',

    // ===== JavaScript 规则 =====
    // 缩进 2 空格
    indent: ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      MemberExpression: 1,
      FunctionDeclaration: { parameters: 1, body: 1 },
      FunctionExpression: { parameters: 1, body: 1 },
      CallExpression: { arguments: 1 },
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      flatTernaryExpressions: false,
      ignoreComments: false
    }],

    // 使用单引号
    quotes: ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],

    // 不使用分号
    semi: ['error', 'never'],

    // 逗号后空格
    'comma-spacing': ['error', { before: false, after: true }],

    // 对象字面量键值空格
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],

    // 花括号空格
    'object-curly-spacing': ['error', 'always'],

    // 数组括号空格
    'array-bracket-spacing': ['error', 'never'],

    // 箭头函数空格
    'arrow-spacing': ['error', { before: true, after: true }],

    // 函数括号前空格
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],

    // 关键字前后空格
    'keyword-spacing': ['error', { before: true, after: true }],

    // 操作符周围空格
    'space-infix-ops': 'error',

    // 驼峰命名
    camelcase: ['error', {
      properties: 'never',
      ignoreDestructuring: false,
      ignoreImports: false,
      ignoreGlobals: false
    }],

    // 文件末尾换行
    'eol-last': ['error', 'always'],

    // 禁止多余空行
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],

    // 禁止行尾空格
    'no-trailing-spaces': 'error',

    // 禁止未使用的变量
    'no-unused-vars': ['warn', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_'
    }],

    // 禁止 console（仅警告）
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // 禁止 debugger（仅警告）
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // 要求使用 === 和 !==
    eqeqeq: ['error', 'always', { null: 'ignore' }],

    // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
    'no-unreachable': 'error',

    // 要求使用 const 声明那些声明后不再被修改的变量
    'prefer-const': ['error', {
      destructuring: 'any',
      ignoreReadBeforeAssign: false
    }],

    // 禁止使用 var
    'no-var': 'error',

    // 要求箭头函数体使用大括号
    'arrow-body-style': ['error', 'as-needed'],

    // 要求对象字面量属性名称使用引号（仅在需要时）
    'quote-props': ['error', 'as-needed'],

    // 禁止对象字面量中出现重复的 key
    'no-dupe-keys': 'error',

    // 强制在逗号后使用空格
    'comma-dangle': ['error', {
      arrays: 'never',
      objects: 'never',
      imports: 'never',
      exports: 'never',
      functions: 'never'
    }]
  },

  overrides: [
    {
      files: ['tests/unit/**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
}
