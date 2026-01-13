/**
 * Hooks module exports
 * @module hooks
 */

export {
    useLinkHandler,
    detectLinkType,
    parseUrl,
    resolveUrl,
    type LinkType,
    type LinkInfo,
    type UseLinkHandlerOptions,
} from './useLinkHandler';

export {
    useImageDimensions,
    constrainDimensions,
    fetchImageDimensions,
    clearDimensionsCache,
    type ImageDimensions,
    type ImageDimensionsState,
    type UseImageDimensionsOptions,
} from './useImageDimensions';

export {
    useTextMeasurement,
    estimateTextHeight,
    willTruncate,
    type TextMeasurement,
    type TextMeasurementOptions,
    type TextMeasurementState,
} from './useTextMeasurement';

