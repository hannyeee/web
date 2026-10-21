module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/test/styleMock.cjs',
  },
  testMatch: ['**/test/**/*.spec.js'],
}
