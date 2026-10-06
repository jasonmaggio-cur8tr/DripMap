import React, { useRef, useState, useEffect, useCallback } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Set to true for above-the-fold / hero images that should load immediately */
  eager?: boolean;
}

const supportsNativeLazy =
  typeof HTMLImageElement !== 'undefined' && 'loading' in HTMLImageElement.prototype;

const LazyImage: React.FC<LazyImageProps> = ({ eager = false, src, style, ...props }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager || supportsNativeLazy);
  const [loaded, setLoaded] = useState(false);

  // IntersectionObserver fallback for browsers without native lazy loading
  useEffect(() => {
    if (eager || supportsNativeLazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [eager]);

  // Handle images that are already cached / loaded synchronously
  useEffect(() => {
    if (shouldLoad && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [shouldLoad]);

  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <img
      ref={imgRef}
      src={shouldLoad ? src : undefined}
      loading={eager ? undefined : 'lazy'}
      decoding={eager ? undefined : 'async'}
      onLoad={handleLoad}
      style={{
        ...style,
        opacity: eager || loaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      {...props}
    />
  );
};

export default LazyImage;
