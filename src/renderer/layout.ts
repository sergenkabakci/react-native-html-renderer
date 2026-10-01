/**
 * Layout classification
 * Decides which nodes flow as inline text and which are laid out as boxes
 * @module renderer/layout
 */

import type { ElementNode, HtmlNode } from '../parser/types';
import { INLINE_TAGS, NodeType, isLineBreakingTag } from '../parser/types';
import type { RenderersMap } from '../plugins';

/**
 * Classifier for one set of custom renderers
 */
export interface LayoutClassifier {
  /** Whether the node flows inside a line of text */
  isInline(node: HtmlNode): boolean;
  /** Whether an element has children that must be laid out as boxes */
  containsBlock(node: ElementNode): boolean;
}

const classifierCache = new WeakMap<RenderersMap, LayoutClassifier>();

/**
 * Create (or reuse) the classifier for a renderers map.
 *
 * - Text nodes and inline tags (`b`, `a`, `code`, `br`, ...) are inline, unless
 *   they contain a block element (e.g. `<a><img></a>`).
 * - Unknown tags with a custom renderer are inline, matching how custom tags
 *   were placed before; unknown tags without one fall back to a box.
 * - Everything else (div, p, ul, table, img, ...) is a block.
 */
export function getLayoutClassifier(renderers: RenderersMap): LayoutClassifier {
  const cached = classifierCache.get(renderers);
  if (cached) return cached;

  const inlineCache = new WeakMap<ElementNode, boolean>();

  function containsBlock(node: ElementNode): boolean {
    return node.children.some(
      (child) => child.type === NodeType.Element && !isInlineElement(child)
    );
  }

  function isInlineElement(node: ElementNode): boolean {
    const cachedResult = inlineCache.get(node);
    if (cachedResult !== undefined) return cachedResult;

    const tag = node.tagName;
    const inlineTag =
      INLINE_TAGS.has(tag) || (!isLineBreakingTag(tag) && Object.prototype.hasOwnProperty.call(renderers, tag));
    const result = inlineTag && !containsBlock(node);

    inlineCache.set(node, result);
    return result;
  }

  const classifier: LayoutClassifier = {
    isInline(node) {
      return node.type !== NodeType.Element || isInlineElement(node);
    },
    containsBlock,
  };

  classifierCache.set(renderers, classifier);
  return classifier;
}
