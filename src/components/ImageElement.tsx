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
} from 'react-native';
import type { ImageStyle, ViewStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

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
 * Default max width for images
 */
const DEFAULT_MAX_WIDTH = Dimensions.get('window').width - 32;

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
  
  const src = node.attributes.src || '';
  const alt = node.attributes.alt || '';
  const widthAttr = parseDimension(node.attributes.width);
  const heightAttr = parseDimension(node.attributes.height);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(
    widthAttr && heightAttr ? { width: widthAttr, height: heightAttr } : null
  );
  
  // Fetch image dimensions if not provided
  useEffect(() => {
    if (!src || dimensions) return;
    
    Image.getSize(
      src,
      (width, height) => {
        // Scale down if larger than max width
        if (width > DEFAULT_MAX_WIDTH) {
          const ratio = DEFAULT_MAX_WIDTH / width;
          setDimensions({
            width: DEFAULT_MAX_WIDTH,
            height: height * ratio,
          });
        } else {
          setDimensions({ width, height });
        }
      },
      (error) => {
        console.warn(`[react-native-html-viewer] Failed to get image size: ${src}`, error);
        // Use fallback dimensions
        setDimensions({ width: DEFAULT_MAX_WIDTH, height: 200 });
        setHasError(true);
      }
    );
  }, [src, dimensions]);
  
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

