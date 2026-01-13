/**
 * Styles module exports
 * @module styles
 */

export {
    parseInlineStyle,
    parseBoxShorthand,
    mergeStyles,
    isEmptyStyle,
    type RNStyle,
} from './styleParser';

export {
    defaultTagStyles,
    defaultTextStyle,
    getDefaultTagStyle,
    isTextOnlyTag,
    isHeadingTag,
    TEXT_ONLY_TAGS,
    HEADING_TAGS,
} from './defaultStyles';

export {
    createStyleResolver,
    defaultStyleResolver,
    resolveTreeStyles,
    extractClassNames,
    createResponsiveStyle,
    scaleTextStyles,
    type TagsStyles,
    type ClassesStyles,
    type StyleResolverConfig,
    type ResolvedStyle,
} from './styleResolver';

