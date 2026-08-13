import React, { useRef, useState, useEffect, useCallback } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Set to true for above-the-fold / hero images that should load immediately */
  eager?: boolean;
}

const supportsNativeLazy =
  typeof HTMLImageElement !== 'undefined' && 'loading' in HTMLImageElement.prototype;

const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';

/** 1×1 transparent GIF – prevents older Safari from fetching the page URL when src is empty */
const PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const LazyImage: React.FC<LazyImageProps> = ({ eager = false, src, style, ...props }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  // If neither native lazy nor IntersectionObserver is available, just load
  // eagerly (graceful degradation — same behaviour as a plain <img>).
  const canLazy = supportsNativeLazy || hasIntersectionObserver;
  const [shouldLoad, setShouldLoad] = useState(eager || !canLazy || supportsNativeLazy);
  const [loaded, setLoaded] = useState(false);

  // IntersectionObserver fallback for browsers without native lazy loading
  useEffect(() => {
    if (eager || supportsNativeLazy || !hasIntersectionObserver || !imgRef.current) return;

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
      src={shouldLoad ? src : PLACEHOLDER}
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
