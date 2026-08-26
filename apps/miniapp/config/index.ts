import { defineConfig } from '@tarojs/cli';

export default defineConfig({
  projectName: 'miniapp',
  date: '2026-08-26',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  mini: {},
});
