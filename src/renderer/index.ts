/**
 * Renderer module exports
 * @module renderer
 */

export { HTMLRenderer, default } from './HTMLRenderer';
export { NodeRenderer, NodesRenderer, DefaultFallback } from './NodeRenderer';
export { useHtmlRenderer, type UseHtmlRendererOptions, type UseHtmlRendererResult } from './useHtmlRenderer';
export {
    RenderContextProvider,
    useRenderContext,
    useRenderers,
    usePluginRegistry,
    useLinkHandler,
    useImageHandler,
    useTextConfig,
    useDebugMode,
    type RenderContextValue,
    type RenderContextProviderProps,
} from './RenderContext';
export type {
    HTMLRendererProps,
    NodeRendererProps,
    TextRendererProps,
    FallbackProps,
    InternalRenderContext,
    LinkPressHandler,
    ImagePressHandler,
} from './types';

