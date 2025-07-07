import { useState } from 'react';

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
  const webpSrc = src.replace(/.(jpg|jpeg|png)$/i, '.webp');
  
  return (
    <picture>
      {/* Modern WebP format for supported browsers */}
      <source srcSet={webpSrc} type="image/webp" />
      
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
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
};