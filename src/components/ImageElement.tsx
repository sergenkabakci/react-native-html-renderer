/**
 * Image Element Component
 * Renders img elements with async loading and sizing
 * @module components/ImageElement
 */

import React, { memo, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import type { ImageStyle, ViewStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';
import { LOG_PREFIX } from '../renderer/constants';
import { constrainDimensions } from '../hooks/useImageDimensions';

/**
 * Props for ImageElement
 */
export interface ImageElementProps {
  node: ElementNode;
  style?: ImageStyle | ViewStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Horizontal space reserved next to images (matches typical screen padding)
 */
const HORIZONTAL_INSET = 32;

/**
 * Default max width for images, measured once at startup.
 * @deprecated The renderer now follows `useWindowDimensions()` so images adapt to
 * rotation, split screen and foldables. Kept only for backwards compatibility.
 */
const DEFAULT_MAX_WIDTH = Dimensions.get('window').width - HORIZONTAL_INSET;

/**
 * Parse dimension value from attributes
 */
function parseDimension(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Image Element component for img tags
 */
function ImageElementComponent({
  node,
  style,
}: ImageElementProps): React.ReactElement {
  const { onImagePress } = useRenderContext();
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = Math.max(windowWidth - HORIZONTAL_INSET, 0);
  
  const src = node.attributes.src || '';
  const alt = node.attributes.alt || '';
  const widthAttr = parseDimension(node.attributes.width);
  const heightAttr = parseDimension(node.attributes.height);
  const hasSizeAttrs = Boolean(widthAttr && heightAttr);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fetchedSize, setFetchedSize] = useState<{ width: number; height: number } | null>(null);
  
  // Fetch the natural image size when the markup doesn't provide one
  useEffect(() => {
    if (!src || hasSizeAttrs) return;
    
    let cancelled = false;
    Image.getSize(
      src,
      (width, height) => {
        if (!cancelled) {
          setFetchedSize({ width, height });
        }
      },
      (error) => {
        if (cancelled) return;
        console.warn(`${LOG_PREFIX} Failed to get image size: ${src}`, error);
        setHasError(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [src, hasSizeAttrs]);
  
  // Fit the natural size into the current window width (recomputed on rotation/resize)
  const naturalSize = hasSizeAttrs
    ? { width: widthAttr as number, height: heightAttr as number }
    : fetchedSize;
  const dimensions = naturalSize
    ? constrainDimensions(naturalSize.width, naturalSize.height, maxWidth)
    : hasError
      ? { width: maxWidth, height: 200 }
      : null;
  
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);
  
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);
  
  const handlePress = useCallback(() => {
    if (onImagePress && src) {
      onImagePress(src, node);
    }
  }, [onImagePress, src, node]);
  
  // Don't render if no source
  if (!src) {
    return <View style={styles.placeholder} />;
  }
  
  const imageStyle: ImageStyle = {
    ...styles.image,
    ...(dimensions ? dimensions : {}),
    ...(style as ImageStyle),
  };
  
  const ImageComponent = (
    <View style={styles.container}>
      {isLoading && (
        <View style={[styles.loadingContainer, dimensions]}>
          <ActivityIndicator size="small" color="#666666" />
        </View>
      )}
      
      {hasError ? (
        <View style={[styles.errorContainer, dimensions]}>
          <View style={styles.errorIcon} />
        </View>
      ) : (
        <Image
          source={{ uri: src }}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          accessibilityLabel={alt}
          accessibilityRole="image"
          resizeMode="contain"
        />
      )}
    </View>
  );
  
  // Wrap in Pressable if onImagePress is provided
  if (onImagePress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="imagebutton"
        accessibilityHint="Press to view image"
      >
        {ImageComponent}
      </Pressable>
    );
  }
  
  return ImageComponent;
}

/**
 * Memoized ImageElement
 */
export const ImageElement = memo(ImageElementComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.node.attributes.src === next.node.attributes.src &&
    prev.style === next.style
  );
});

ImageElement.displayName = 'ImageElement';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  image: {
    resizeMode: 'contain',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    position: 'absolute',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef5350',
  },
  placeholder: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
});

export { parseDimension, DEFAULT_MAX_WIDTH };

