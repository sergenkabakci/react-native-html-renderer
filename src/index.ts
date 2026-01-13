/**
 * react-native-html-viewer
 * 
 * A performant HTML rendering library for React Native
 * using native components instead of WebView.
 * 
 * @packageDocumentation
 */

// Main renderer component
export { HTMLRenderer, default } from './renderer/HTMLRenderer';

// Renderer exports
export {
    NodeRenderer,
    NodesRenderer,
    DefaultFallback,
    useHtmlRenderer,
    RenderContextProvider,
    useRenderContext,
    useRenderers,
    usePluginRegistry,
    useLinkHandler as useContextLinkHandler,
    useImageHandler,
    useTextConfig,
    useDebugMode,
} from './renderer';

export type {
    HTMLRendererProps,
    FallbackProps,
    LinkPressHandler,
    ImagePressHandler,
    RenderContextValue,
    UseHtmlRendererOptions,
    UseHtmlRendererResult,
} from './renderer';

// Parser exports
export {
    parseHtml,
    parseHtmlStrict,
    walkAst,
    findNodes,
    findByTag,
    findById,
    countNodes,
    getTextContent,
    resetKeyCounter,
    useHtmlParser,
    useLazyHtmlParser,
    NodeType,
    isElementNode,
    isTextNode,
    isCommentNode,
    isSupportedTag,
    isBlockTag,
    isInlineTag,
    isSelfClosingTag,
    SUPPORTED_TAGS,
    BLOCK_TAGS,
    INLINE_TAGS,
    SELF_CLOSING_TAGS,
} from './parser';

export type {
    HtmlNode,
    ElementNode,
    TextNode,
    CommentNode,
    BaseNode,
    HtmlAttributes,
    ParseResult,
    ParseError,
    ParserOptions,
    SupportedTag,
    UseHtmlParserOptions,
    UseHtmlParserResult,
} from './parser';

// Style exports
export {
    parseInlineStyle,
    parseBoxShorthand,
    mergeStyles,
    isEmptyStyle,
    defaultTagStyles,
    defaultTextStyle,
    getDefaultTagStyle,
    isTextOnlyTag,
    isHeadingTag,
    TEXT_ONLY_TAGS,
    HEADING_TAGS,
    createStyleResolver,
    defaultStyleResolver,
    resolveTreeStyles,
    extractClassNames,
    createResponsiveStyle,
    scaleTextStyles,
} from './styles';

export type {
    RNStyle,
    TagsStyles,
    ClassesStyles,
    StyleResolverConfig,
    ResolvedStyle,
} from './styles';

// Plugin exports
export {
    createPluginRegistry,
    defaultPluginRegistry,
    registerPlugin,
    unregisterPlugin,
} from './plugins';

export type {
    HtmlPlugin,
    TagRenderer,
    RenderersMap,
    NodeTransform,
    RenderContext,
    PluginRegistry,
    PluginRegistryState,
    RegisterPluginOptions,
    TransformResult,
} from './plugins';

// Hook exports
export {
    useLinkHandler,
    detectLinkType,
    parseUrl,
    resolveUrl,
    useImageDimensions,
    constrainDimensions,
    fetchImageDimensions,
    clearDimensionsCache,
    useTextMeasurement,
    estimateTextHeight,
    willTruncate,
} from './hooks';

export type {
    LinkType,
    LinkInfo,
    UseLinkHandlerOptions,
    ImageDimensions,
    ImageDimensionsState,
    UseImageDimensionsOptions,
    TextMeasurement,
    TextMeasurementOptions,
    TextMeasurementState,
} from './hooks';

// Performance exports
export {
    VirtualizedContent,
    shouldVirtualize,
    chunkNodes,
    estimateNodeHeight,
    createNodeKeyGenerator,
    hashNodeTree,
    useMemoizedNodes,
    areNodesEqual,
    areNodesDeepEqual,
    createMemoizedRenderer,
    useStableNodesCallback,
    ContentCache,
    globalParseCache,
} from './performance';

export type { VirtualizedContentProps } from './performance';

// Component exports
export {
    BlockView,
    Heading,
    TextWrapper,
    List,
    ListItem,
    Anchor,
    ImageElement,
    Table,
    TableRow,
    TableCell,
    CodeBlock,
    HorizontalRule,
} from './components';

export type {
    BlockViewProps,
    HeadingProps,
    TextWrapperProps,
    ListProps,
    ListItemProps,
    AnchorProps,
    ImageElementProps,
    TableProps,
    TableRowProps,
    TableCellProps,
    CodeBlockProps,
    HorizontalRuleProps,
} from './components';

