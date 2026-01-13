/**
 * Plugins module exports
 * @module plugins
 */

export {
    createPluginRegistry,
    defaultPluginRegistry,
    registerPlugin,
    unregisterPlugin,
    type PluginRegistry,
} from './pluginRegistry';

export type {
    RenderContext,
    TagRenderer,
    RenderersMap,
    NodeTransform,
    HtmlPlugin,
    PluginRegistryState,
    RegisterPluginOptions,
    TransformResult,
} from './pluginTypes';

