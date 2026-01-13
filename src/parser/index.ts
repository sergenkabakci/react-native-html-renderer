/**
 * Parser module exports
 * @module parser
 */

export { parseHtml, parseHtmlStrict, walkAst, findNodes, findByTag, findById, countNodes, getTextContent, resetKeyCounter } from './parser';
export { useHtmlParser, useLazyHtmlParser } from './useHtmlParser';
export type { UseHtmlParserOptions, UseHtmlParserResult } from './useHtmlParser';
export {
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
} from './types';
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
} from './types';

