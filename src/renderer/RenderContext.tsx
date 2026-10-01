/**
 * Render Context Provider
 * Provides render configuration to nested components
 * @module renderer/RenderContext
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import type { RenderersMap, PluginRegistry } from '../plugins';
import { createPluginRegistry } from '../plugins';
import type { LinkPressHandler, ImagePressHandler, FallbackProps } from './types';

/**
 * Render context value
 */
export interface RenderContextValue {
  /** Style resolver function */
  resolveStyle: (node: ElementNode) => { style: ViewStyle | TextStyle | ImageStyle };
  /** Custom renderers */
  renderers: RenderersMap;
  /** Plugin registry */
  pluginRegistry: PluginRegistry;
  /** Link press handler */
  onLinkPress?: LinkPressHandler;
  /** Image press handler */
  onImagePress?: ImagePressHandler;
  /** Text scale */
  textScale: number;
  /** Text selectable */
  textSelectable: boolean;
  /** Text style every text in the document inherits from */
  baseTextStyle?: TextStyle;
  /** Custom fonts */
  customFonts?: Record<string, string>;
  /** Fallback component */
  FallbackComponent?: React.ComponentType<FallbackProps>;
  /** Debug mode */
  debug: boolean;
}

/**
 * Default render context
 */
const defaultContext: RenderContextValue = {
  resolveStyle: () => ({ style: {} }),
  renderers: {},
  pluginRegistry: createPluginRegistry(),
  textScale: 1,
  textSelectable: false,
  debug: false,
};

/**
 * React context for render configuration
 */
const RenderContext = createContext<RenderContextValue>(defaultContext);

/**
 * Props for RenderContextProvider
 */
export interface RenderContextProviderProps extends Partial<RenderContextValue> {
  children: ReactNode;
}

/**
 * Provider component for render context
 */
export function RenderContextProvider({
  children,
  resolveStyle,
  renderers,
  pluginRegistry,
  onLinkPress,
  onImagePress,
  textScale,
  textSelectable,
  baseTextStyle,
  customFonts,
  FallbackComponent,
  debug,
}: RenderContextProviderProps): React.ReactElement {
  // `??` instead of object spread so an explicitly passed `undefined` keeps the default
  const value = useMemo<RenderContextValue>(
    () => ({
      resolveStyle: resolveStyle ?? defaultContext.resolveStyle,
      renderers: renderers ?? defaultContext.renderers,
      pluginRegistry: pluginRegistry ?? defaultContext.pluginRegistry,
      onLinkPress,
      onImagePress,
      textScale: textScale ?? defaultContext.textScale,
      textSelectable: textSelectable ?? defaultContext.textSelectable,
      baseTextStyle,
      customFonts,
      FallbackComponent,
      debug: debug ?? defaultContext.debug,
    }),
    [
      resolveStyle,
      renderers,
      pluginRegistry,
      onLinkPress,
      onImagePress,
      textScale,
      textSelectable,
      baseTextStyle,
      customFonts,
      FallbackComponent,
      debug,
    ]
  );

  return (
    <RenderContext.Provider value={value}>
      {children}
    </RenderContext.Provider>
  );
}

/**
 * Hook to access render context
 */
export function useRenderContext(): RenderContextValue {
  return useContext(RenderContext);
}

/**
 * Hook to get specific context values
 */
export function useRenderers(): RenderersMap {
  const { renderers } = useRenderContext();
  return renderers;
}

export function usePluginRegistry(): PluginRegistry {
  const { pluginRegistry } = useRenderContext();
  return pluginRegistry;
}

export function useLinkHandler(): LinkPressHandler | undefined {
  const { onLinkPress } = useRenderContext();
  return onLinkPress;
}

export function useImageHandler(): ImagePressHandler | undefined {
  const { onImagePress } = useRenderContext();
  return onImagePress;
}

export function useTextConfig() {
  const { textScale, textSelectable, customFonts } = useRenderContext();
  return { textScale, textSelectable, customFonts };
}

export function useDebugMode(): boolean {
  const { debug } = useRenderContext();
  return debug;
}

export { RenderContext };

