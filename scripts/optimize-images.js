#!/usr/bin/env node

/**
 * Image Optimization Script
 * 
 * This script helps optimize images for better web performance
 * Usage: node scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';

const TARGET_IMAGE_SIZE = 50 * 1024; // 50KB target
const MAX_DIMENSION = 400; // Max width/height for profile images

/**
 * Analyze current image sizes
 */
function analyzeImages() {
  const publicDir = './public';
  const images = [];
  
  // Get all image files in public directory
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
        const size = stat.size;
        const sizeKB = Math.round(size / 1024);
        
        images.push({
          path: filePath,
          name: file,
          size: size,
          sizeKB: sizeKB,
          needsOptimization: size > TARGET_IMAGE_SIZE
        });
      }
    });
  }
  
  scanDirectory(publicDir);
  return images;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(images) {
  console.log('\n🖼️  IMAGE OPTIMIZATION ANALYSIS\n');
  console.log('================================\n');
  
  let totalSize = 0;
  let totalOptimizedSize = 0;
  
  images.forEach(img => {
    totalSize += img.size;
    
    if (img.needsOptimization) {
      console.log(`❌ ${img.name}`);
      console.log(`   Current: ${img.sizeKB} KB`);
      console.log(`   Target: ${Math.round(TARGET_IMAGE_SIZE / 1024)} KB`);
      console.log(`   Savings: ~${img.sizeKB - Math.round(TARGET_IMAGE_SIZE / 1024)} KB`);
      console.log('   Recommendations:');
      console.log('   - Resize to max 400x400px');
      console.log('   - Convert to WebP format');
      console.log('   - Use 80% quality compression');
      console.log('');
      
      totalOptimizedSize += TARGET_IMAGE_SIZE;
    } else {
      console.log(`✅ ${img.name} (${img.sizeKB} KB) - Already optimized`);
      totalOptimizedSize += img.size;
    }
  });
  
  const savings = totalSize - totalOptimizedSize;
  const savingsKB = Math.round(savings / 1024);
  const savingsPercent = Math.round((savings / totalSize) * 100);
  
  console.log('\n📊 OPTIMIZATION SUMMARY');
  console.log('=======================');
  console.log(`Current total: ${Math.round(totalSize / 1024)} KB`);
  console.log(`Optimized total: ${Math.round(totalOptimizedSize / 1024)} KB`);
  console.log(`Potential savings: ${savingsKB} KB (${savingsPercent}%)`);
  
  if (savingsKB > 0) {
    console.log('\n🛠️  OPTIMIZATION COMMANDS');
    console.log('========================');
    console.log('To optimize images using online tools:');
    console.log('1. TinyPNG: https://tinypng.com/');
    console.log('2. Squoosh: https://squoosh.app/');
    console.log('3. ImageOptim (Mac): https://imageoptim.com/');
    console.log('');
    console.log('Or use command-line tools:');
    console.log('npm install -g imagemin-cli imagemin-webp');
    console.log('imagemin public/*.jpg --out-dir=public/optimized --plugin=webp');
  }
}

/**
 * Generate modern image component
 */
function generateImageComponent() {
  const componentCode = `import { useState } from 'react';

/**
 * Optimized Image Component with modern loading techniques
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  priority = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Generate WebP source if available
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  return (
    <picture>
      {/* Modern WebP format for supported browsers */}
      <source srcSet={webpSrc} type="image/webp" />
      
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={\`\${className} \${isLoaded ? 'loaded' : 'loading'}\`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          transition: 'opacity 0.3s ease',
          opacity: isLoaded ? 1 : 0.7
        }}
      />
    </picture>
  );
};`;

  fs.writeFileSync('./src/components/OptimizedImage.jsx', componentCode);
  console.log('\n✅ Generated OptimizedImage component at src/components/OptimizedImage.jsx');
}

/**
 * Main execution
 */
function main() {
  try {
    const images = analyzeImages();
    
    if (images.length === 0) {
      console.log('No images found in public directory.');
      return;
    }
    
    generateRecommendations(images);
    
    // Create components directory if it doesn't exist
    if (!fs.existsSync('./src/components')) {
      fs.mkdirSync('./src/components');
    }
    
    generateImageComponent();
    
    console.log('\n🎯 NEXT STEPS');
    console.log('=============');
    console.log('1. Optimize images using the recommended tools');
    console.log('2. Replace <img> tags with <OptimizedImage> component');
    console.log('3. Add WebP versions of your images');
    console.log('4. Run "npm run build" to see bundle size improvements');
    
  } catch (error) {
    console.error('Error analyzing images:', error.message);
  }
}

// Run the script
main();