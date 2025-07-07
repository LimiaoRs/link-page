import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig({
  base: '/my-react-app/',
  plugins: [
    react(),
    // Gzip compression for static assets
    viteCompression({
      algorithm: 'gzip',
      deleteOriginFile: false,
    }),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && analyzer({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ].filter(Boolean),
  
  // Build optimizations
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Enable gzip compression
    reportCompressedSize: true,
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  
  // Enable experimental features for better performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  // CSS optimizations
  css: {
    devSourcemap: false,
  },
})
