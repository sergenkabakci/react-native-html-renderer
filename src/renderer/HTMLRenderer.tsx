/**
 * Main HTMLRenderer Component
 * The primary component for rendering HTML content in React Native
 * @module renderer/HTMLRenderer
 */

import React, { useMemo, useCallback, useEffect, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { useHtmlParser } from '../parser/useHtmlParser';
import type { HtmlNode, ParserOptions } from '../parser/types';
import { createStyleResolver, type StyleResolverConfig } from '../styles/styleResolver';
import { createPluginRegistry, type PluginRegistry, type HtmlPlugin, type RenderersMap } from '../plugins';
import { VirtualizedContent, shouldVirtualize } from '../performance/VirtualizedContent';
import { RenderContextProvider } from './RenderContext';
import { NodesRenderer } from './NodeRenderer';
import { HtmlErrorBoundary } from './ErrorBoundary';
import { LOG_PREFIX } from './constants';
import type { HTMLRendererProps } from './types';

// Shared defaults: fresh `{}` / `[]` literals in the parameter list would change
// identity on every render and invalidate the memoized registry, resolver and context.
const EMPTY_RENDERERS: RenderersMap = {};
const EMPTY_PLUGINS: HtmlPlugin[] = [];
const EMPTY_PARSER_OPTIONS: Partial<ParserOptions> = {};

/**
 * Keep the first object seen for a given serialized value, so inline style
 * literals (`tagsStyles={{ p: {...} }}`) don't rebuild the whole tree each render.
 */
function useStableStyleObject<T extends object | undefined>(value: T): T {
  const key = value === undefined ? undefined : JSON.stringify(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, [key]);
}

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
  tagsStyles: tagsStylesProp,
  classesStyles: classesStylesProp,
  renderers = EMPTY_RENDERERS,
  baseTextStyle: baseTextStyleProp,
  containerStyle,
  onLinkPress,
  onImagePress,
  plugins = EMPTY_PLUGINS,
  pluginRegistry: customRegistry,
  parserOptions = EMPTY_PARSER_OPTIONS,
  textScale = 1,
  textSelectable = false,
  customFonts,
  fallbackComponent,
  debug = false,
  contentKey,
  enableVirtualization = false,
  estimatedRowHeight,
  virtualizationThreshold = 500,
  errorBoundaryFallback,
  onRenderComplete,
  onError,
}: HTMLRendererProps): React.ReactElement {
  const tagsStyles = useStableStyleObject(tagsStylesProp);
  const classesStyles = useStableStyleObject(classesStylesProp);
  const baseTextStyle = useStableStyleObject(baseTextStyleProp);

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
          console.warn(`${LOG_PREFIX} Failed to register plugin: ${plugin.name}`, error);
        }
      }
    }
    
    return reg;
  }, [customRegistry, plugins, debug]);
  
  // Create style resolver
  const resolveStyle = useMemo(() => {
    // baseTextStyle is not part of the resolver: it is inherited through
    // RenderContext, so nested elements don't reset their parent's text style
    const config: StyleResolverConfig = {
      tagsStyles,
      classesStyles,
      useDefaultStyles: true,
    };
    return createStyleResolver(config);
  }, [tagsStyles, classesStyles]);
  
  // Merge custom renderers with plugin renderers
  const mergedRenderers = useMemo<RenderersMap>(() => {
    return {
      ...registry.getRenderers(),
      ...renderers,
    };
  }, [registry, renderers]);
  
  // Only virtualize when explicitly enabled and the tree is large enough
  const virtualize = useMemo(
    () => enableVirtualization && shouldVirtualize(nodes, virtualizationThreshold),
    [enableVirtualization, nodes, virtualizationThreshold]
  );

  const renderChunk = useCallback(
    (chunk: HtmlNode[]) => <NodesRenderer nodes={chunk} />,
    []
  );

  const errorFallback = errorBoundaryFallback ?? <DefaultErrorFallback />;

  // Handle empty or failed HTML
  if (!html || html.trim() === '') {
    return <EmptyContent />;
  }
  
  if (!isSuccess) {
    return <>{errorFallback}</>;
  }
  
  return (
    <HtmlErrorBoundary fallback={errorFallback} onError={onError} resetKey={html}>
      <RenderContextProvider
        resolveStyle={resolveStyle}
        renderers={mergedRenderers}
        pluginRegistry={registry}
        onLinkPress={onLinkPress}
        onImagePress={onImagePress}
        textScale={textScale}
        textSelectable={textSelectable}
        baseTextStyle={baseTextStyle}
        customFonts={customFonts}
        FallbackComponent={fallbackComponent}
        debug={debug}
      >
        {virtualize ? (
          <VirtualizedContent
            key={contentKey}
            nodes={nodes}
            renderNodes={renderChunk}
            estimatedRowHeight={estimatedRowHeight}
            style={containerStyle}
            debug={debug}
          />
        ) : (
          <View
            key={contentKey}
            style={[styles.container, containerStyle]}
          >
            <NodesRenderer nodes={nodes} />
          </View>
        )}
      </RenderContextProvider>
    </HtmlErrorBoundary>
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

