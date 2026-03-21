import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import javaScriptObfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    const isProd = mode === 'production';
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        isProd && javaScriptObfuscator({
          options: {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            stringArray: true,
            stringArrayThreshold: 0.75,
            rotateStringArray: true,
            shuffleStringArray: true,
            splitStrings: false,
            identifierNamesGenerator: 'hexadecimal',
            selfDefending: false,
          },
        }),
      ].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      }
    };
});
