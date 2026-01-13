/**
 * Main HTMLRenderer Component
 * The primary component for rendering HTML content in React Native
 * @module renderer/HTMLRenderer
 */

import React, { useMemo, useCallback, useEffect, memo, type ReactNode } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { ViewStyle } from 'react-native';

import { useHtmlParser } from '../parser/useHtmlParser';
import { createStyleResolver, type StyleResolverConfig } from '../styles/styleResolver';
import { createPluginRegistry, type PluginRegistry, type HtmlPlugin, type RenderersMap } from '../plugins';
import { RenderContextProvider } from './RenderContext';
import { NodesRenderer } from './NodeRenderer';
import type { HTMLRendererProps, FallbackProps } from './types';

/**
 * Error boundary fallback component
 */
function DefaultErrorFallback(): React.ReactElement {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Failed to render HTML</Text>
    </View>
  );
}

/**
 * Empty content placeholder
 */
function EmptyContent(): React.ReactElement {
  return <View />;
}

/**
 * HTMLRenderer Component
 * 
 * Renders HTML content as native React Native components.
 * 
 * @param props - Renderer configuration
 * @returns Rendered HTML as React Native components
 * 
 * @example
 * Basic usage:
 * ```tsx
 * <HTMLRenderer html="<p>Hello <strong>World</strong>!</p>" />
 * ```
 * 
 * @example
 * With custom styles:
 * ```tsx
 * <HTMLRenderer
 *   html={htmlContent}
 *   tagsStyles={{
 *     p: { color: 'blue' },
 *     h1: { fontSize: 28 },
 *   }}
 *   classesStyles={{
 *     highlight: { backgroundColor: 'yellow' },
 *   }}
 * />
 * ```
 * 
 * @example
 * With link handling:
 * ```tsx
 * <HTMLRenderer
 *   html="<a href='https://example.com'>Link</a>"
 *   onLinkPress={(url) => {
 *     console.log('Link pressed:', url);
 *   }}
 * />
 * ```
 */
function HTMLRendererComponent({
  html,
  tagsStyles = {},
  classesStyles = {},
  renderers = {},
  baseTextStyle,
  containerStyle,
  onLinkPress,
  onImagePress,
  plugins = [],
  pluginRegistry: customRegistry,
  parserOptions = {},
  textScale = 1,
  textSelectable = false,
  customFonts,
  fallbackComponent,
  debug = false,
  contentKey,
  enableVirtualization = false,
  virtualizationThreshold = 500,
  errorBoundaryFallback,
  onRenderComplete,
  onError,
}: HTMLRendererProps): React.ReactElement {
  // Parse HTML
  const { nodes, errors, isSuccess } = useHtmlParser(html, parserOptions);
  
  // Handle parse errors
  useEffect(() => {
    if (errors.length > 0 && onError) {
      onError(new Error(errors.map(e => e.message).join(', ')));
    }
  }, [errors, onError]);
  
  // Report render completion
  useEffect(() => {
    if (isSuccess && onRenderComplete) {
      onRenderComplete(nodes.length);
    }
  }, [isSuccess, nodes.length, onRenderComplete]);
  
  // Create plugin registry
  const registry = useMemo<PluginRegistry>(() => {
    if (customRegistry) return customRegistry;
    
    const reg = createPluginRegistry();
    
    // Register provided plugins
    for (const plugin of plugins) {
      try {
        reg.register(plugin);
      } catch (error) {
        if (debug) {
          console.warn(`[react-native-html-viewer] Failed to register plugin: ${plugin.name}`, error);
        }
      }
    }
    
    return reg;
  }, [customRegistry, plugins, debug]);
  
  // Create style resolver
  const resolveStyle = useMemo(() => {
    const config: StyleResolverConfig = {
      tagsStyles,
      classesStyles,
      baseTextStyle,
      useDefaultStyles: true,
    };
    return createStyleResolver(config);
  }, [tagsStyles, classesStyles, baseTextStyle]);
  
  // Merge custom renderers with plugin renderers
  const mergedRenderers = useMemo<RenderersMap>(() => {
    return {
      ...registry.getRenderers(),
      ...renderers,
    };
  }, [registry, renderers]);
  
  // Handle empty or failed HTML
  if (!html || html.trim() === '') {
    return <EmptyContent />;
  }
  
  if (!isSuccess) {
    if (errorBoundaryFallback) {
      return <>{errorBoundaryFallback}</>;
    }
    return <DefaultErrorFallback />;
  }
  
  return (
    <RenderContextProvider
      resolveStyle={resolveStyle}
      renderers={mergedRenderers}
      pluginRegistry={registry}
      onLinkPress={onLinkPress}
      onImagePress={onImagePress}
      textScale={textScale}
      textSelectable={textSelectable}
      customFonts={customFonts}
      FallbackComponent={fallbackComponent}
      debug={debug}
    >
      <View
        key={contentKey}
        style={[styles.container, containerStyle]}
      >
        <NodesRenderer nodes={nodes} />
      </View>
    </RenderContextProvider>
  );
}

/**
 * Memoized HTMLRenderer
 */
export const HTMLRenderer = memo(HTMLRendererComponent);

HTMLRenderer.displayName = 'HTMLRenderer';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default HTMLRenderer;

