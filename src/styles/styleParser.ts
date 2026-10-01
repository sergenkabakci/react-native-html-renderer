/**
 * CSS Style Parser
 * Converts inline CSS strings to React Native style objects
 * @module styles/styleParser
 */

import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';

/**
 * Combined style type for React Native
 */
export type RNStyle = ViewStyle | TextStyle | ImageStyle;

/**
 * CSS property to React Native property mapping
 */
const CSS_TO_RN_MAP: Record<string, string> = {
    // Layout
    'display': 'display',
    'flex': 'flex',
    'flex-direction': 'flexDirection',
    'flex-wrap': 'flexWrap',
    'flex-grow': 'flexGrow',
    'flex-shrink': 'flexShrink',
    'flex-basis': 'flexBasis',
    'justify-content': 'justifyContent',
    'align-items': 'alignItems',
    'align-self': 'alignSelf',
    'align-content': 'alignContent',

    // Dimensions
    'width': 'width',
    'height': 'height',
    'min-width': 'minWidth',
    'max-width': 'maxWidth',
    'min-height': 'minHeight',
    'max-height': 'maxHeight',

    // Positioning
    'position': 'position',
    'top': 'top',
    'right': 'right',
    'bottom': 'bottom',
    'left': 'left',
    'z-index': 'zIndex',

    // Margin
    'margin': 'margin',
    'margin-top': 'marginTop',
    'margin-right': 'marginRight',
    'margin-bottom': 'marginBottom',
    'margin-left': 'marginLeft',
    'margin-horizontal': 'marginHorizontal',
    'margin-vertical': 'marginVertical',

    // Padding
    'padding': 'padding',
    'padding-top': 'paddingTop',
    'padding-right': 'paddingRight',
    'padding-bottom': 'paddingBottom',
    'padding-left': 'paddingLeft',
    'padding-horizontal': 'paddingHorizontal',
    'padding-vertical': 'paddingVertical',

    // Border
    'border-width': 'borderWidth',
    'border-top-width': 'borderTopWidth',
    'border-right-width': 'borderRightWidth',
    'border-bottom-width': 'borderBottomWidth',
    'border-left-width': 'borderLeftWidth',
    'border-color': 'borderColor',
    'border-top-color': 'borderTopColor',
    'border-right-color': 'borderRightColor',
    'border-bottom-color': 'borderBottomColor',
    'border-left-color': 'borderLeftColor',
    'border-radius': 'borderRadius',
    'border-top-left-radius': 'borderTopLeftRadius',
    'border-top-right-radius': 'borderTopRightRadius',
    'border-bottom-left-radius': 'borderBottomLeftRadius',
    'border-bottom-right-radius': 'borderBottomRightRadius',
    'border-style': 'borderStyle',

    // Background
    'background-color': 'backgroundColor',
    'background': 'backgroundColor', // only plain colors, see parseInlineStyle
    'opacity': 'opacity',

    // Text
    'color': 'color',
    'font-size': 'fontSize',
    'font-family': 'fontFamily',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
    'line-height': 'lineHeight',
    'text-align': 'textAlign',
    'text-decoration': 'textDecorationLine',
    'text-decoration-line': 'textDecorationLine',
    'text-decoration-style': 'textDecorationStyle',
    'text-decoration-color': 'textDecorationColor',
    'text-transform': 'textTransform',
    'letter-spacing': 'letterSpacing',

    // Shadow: React Native 0.76+ (New Architecture) understands the CSS syntax
    'box-shadow': 'boxShadow',
    'shadow-color': 'shadowColor',
    'shadow-offset': 'shadowOffset',
    'shadow-opacity': 'shadowOpacity',
    'shadow-radius': 'shadowRadius',

    // Other
    'overflow': 'overflow',
    'aspect-ratio': 'aspectRatio',
};

/**
 * Values React Native accepts for enum-like style props.
 * Anything else (e.g. `display: block`) is dropped instead of being passed to
 * native, where it triggers warnings or red boxes.
 */
const ALLOWED_VALUES: Record<string, Set<string>> = {
    display: new Set(['flex', 'none', 'contents']),
    position: new Set(['absolute', 'relative', 'static']),
    overflow: new Set(['visible', 'hidden', 'scroll']),
    flexDirection: new Set(['row', 'column', 'row-reverse', 'column-reverse']),
    flexWrap: new Set(['wrap', 'nowrap', 'wrap-reverse']),
    justifyContent: new Set(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']),
    alignItems: new Set(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']),
    alignSelf: new Set(['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline']),
    alignContent: new Set(['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly']),
    fontStyle: new Set(['normal', 'italic']),
    textAlign: new Set(['auto', 'left', 'right', 'center', 'justify']),
    textTransform: new Set(['none', 'uppercase', 'lowercase', 'capitalize']),
    textDecorationStyle: new Set(['solid', 'double', 'dotted', 'dashed']),
    borderStyle: new Set(['solid', 'dotted', 'dashed']),
};

/**
 * CSS values that have a direct React Native equivalent under another name
 */
const VALUE_ALIASES: Record<string, Record<string, string>> = {
    textAlign: { start: 'left', end: 'right' },
    fontStyle: { oblique: 'italic' },
    justifyContent: { start: 'flex-start', end: 'flex-end', left: 'flex-start', right: 'flex-end' },
    alignItems: { start: 'flex-start', end: 'flex-end' },
    alignSelf: { start: 'flex-start', end: 'flex-end' },
};

/**
 * Props that must be plain numbers (no percentages or keywords)
 */
const NUMBER_ONLY_PROPS = new Set([
    'fontSize', 'lineHeight', 'letterSpacing', 'opacity', 'zIndex',
    'flex', 'flexGrow', 'flexShrink',
    'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'shadowOpacity', 'shadowRadius',
]);

/**
 * Generic CSS font families mapped to something every platform can resolve
 */
const GENERIC_FONT_FAMILIES: Record<string, string | undefined> = {
    'monospace': 'monospace',
    'serif': 'serif',
    'sans-serif': undefined,
    'system-ui': undefined,
    'cursive': undefined,
    'fantasy': undefined,
};

/**
 * Font weight mapping from CSS to React Native
 */
const FONT_WEIGHT_MAP: Record<string, TextStyle['fontWeight']> = {
    'normal': 'normal',
    'bold': 'bold',
    '100': '100',
    '200': '200',
    '300': '300',
    '400': '400',
    '500': '500',
    '600': '600',
    '700': '700',
    '800': '800',
    '900': '900',
    'lighter': '300',
    'bolder': '700',
};

/**
 * Base font size used to resolve relative units (em, rem, unitless line-height)
 */
const DEFAULT_FONT_SIZE = 16;

/**
 * Parse a single CSS value, handling units
 */
function parseValue(value: string, property: string): unknown {
    const trimmed = value.trim();

    // Handle inherit, initial, unset
    if (['inherit', 'initial', 'unset'].includes(trimmed)) {
        return undefined;
    }

    // Handle font-weight specially
    if (property === 'fontWeight' || property === 'font-weight') {
        return FONT_WEIGHT_MAP[trimmed];
    }

    // React Native wants a single font name, CSS allows a fallback list
    if (property === 'fontFamily') {
        const first = trimmed.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (first.toLowerCase() in GENERIC_FONT_FAMILIES) {
            return GENERIC_FONT_FAMILIES[first.toLowerCase()];
        }
        return first || undefined;
    }

    // Pass shadows through as-is, React Native parses the CSS syntax itself
    if (property === 'boxShadow') {
        return trimmed;
    }

    // Enum-like props: map aliases, drop values React Native doesn't support
    const allowed = ALLOWED_VALUES[property];
    if (allowed) {
        const value = VALUE_ALIASES[property]?.[trimmed] ?? trimmed;
        return allowed.has(value) ? value : undefined;
    }

    // Handle numeric values
    const numericMatch = trimmed.match(/^(-?[\d.]+)(px|em|rem|%|pt|vh|vw)?$/);
    if (numericMatch) {
        const num = parseFloat(numericMatch[1]);
        const unit = numericMatch[2];

        if (Number.isNaN(num)) {
            return undefined;
        }

        // Percentages and viewport units make no sense for these props
        if (NUMBER_ONLY_PROPS.has(property) && (unit === '%' || unit === 'vh' || unit === 'vw')) {
            return undefined;
        }

        // React Native doesn't support units, convert to numbers
        switch (unit) {
            case 'px':
                return num;
            case 'em':
            case 'rem':
                // Approximate conversion (base 16px)
                return num * DEFAULT_FONT_SIZE;
            case 'pt':
                return num * 1.333; // 1pt ≈ 1.333px
            case '%':
                // Return as string for percentage
                return `${num}%`;
            case 'vh':
            case 'vw':
                // These need runtime dimensions, return as percentage
                return `${num}%`;
            default:
                return num;
        }
    }

    // Handle color values
    if (isColorProperty(property)) {
        return parseColor(trimmed);
    }

    // Handle text-decoration mapping
    if (property === 'textDecorationLine' || property === 'text-decoration') {
        return mapTextDecoration(trimmed);
    }

    // Keywords like `auto` or `normal` are not valid for number-only props
    if (NUMBER_ONLY_PROPS.has(property)) {
        return undefined;
    }

    // calc(), var() and other CSS functions have no React Native equivalent
    if (trimmed.includes('(')) {
        return undefined;
    }

    // Return as-is for string values
    return trimmed;
}

/**
 * Check if a property is color-related
 */
function isColorProperty(property: string): boolean {
    const colorProps = ['color', 'backgroundColor', 'borderColor', 'shadowColor'];
    return colorProps.some(p => property.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Parse color value
 */
function parseColor(value: string): string {
    // Already valid color format
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        return value;
    }

    // Named colors are supported by React Native
    return value;
}

/**
 * Map CSS text-decoration to React Native textDecorationLine
 */
function mapTextDecoration(value: string): string {
    const decorations = value.split(/\s+/);
    if (decorations.includes('none')) {
        return 'none';
    }

    // React Native only accepts this exact order; `overline`, colors and styles are ignored
    const underline = decorations.includes('underline');
    const lineThrough = decorations.includes('line-through');
    if (underline && lineThrough) return 'underline line-through';
    if (underline) return 'underline';
    if (lineThrough) return 'line-through';
    return 'none';
}

/**
 * Box properties that accept the 1-4 value CSS shorthand
 */
const BOX_SHORTHANDS = new Set(['margin', 'padding']);

/**
 * Expand `margin: 0 auto` style shorthands into the four sides.
 * Returns undefined when a part can't be converted.
 */
function expandBoxShorthand(value: string, prefix: string): Record<string, unknown> | undefined {
    const parts = value.split(/\s+/).map(part => (part === 'auto' ? 'auto' : parseValue(part, prefix)));
    if (parts.some(part => part === undefined || (typeof part === 'string' && part !== 'auto' && !part.endsWith('%')))) {
        return undefined;
    }

    const [top, right = top, bottom = top, left = right] = parts;
    return {
        [`${prefix}Top`]: top,
        [`${prefix}Right`]: right,
        [`${prefix}Bottom`]: bottom,
        [`${prefix}Left`]: left,
    };
}

/**
 * Expand `border: 1px solid #ccc` into width, style and color
 */
function expandBorderShorthand(value: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const part of value.split(/\s+(?![^(]*\))/)) {
        if (/^-?[\d.]+(px)?$/.test(part)) {
            result.borderWidth = parseFloat(part);
        } else if (ALLOWED_VALUES.borderStyle.has(part)) {
            result.borderStyle = part;
        } else if (part === 'none' || part === '0') {
            result.borderWidth = 0;
        } else if (part) {
            result.borderColor = parseColor(part);
        }
    }
    return result;
}

/**
 * Parse a CSS style string into a React Native style object
 * 
 * @param cssString - Inline CSS string (e.g., "color: red; font-size: 16px")
 * @returns React Native compatible style object
 * 
 * @example
 * ```typescript
 * const style = parseInlineStyle('color: red; margin: 10px;');
 * // { color: 'red', margin: 10 }
 * ```
 */
export function parseInlineStyle(cssString: string | undefined): RNStyle {
    if (!cssString || cssString.trim() === '') {
        return {};
    }

    const style: Record<string, unknown> = {};
    let lineHeightMultiplier: number | undefined;

    // Split by semicolon, handling potential edge cases
    const declarations = cssString.split(';').filter(Boolean);

    for (const declaration of declarations) {
        const colonIndex = declaration.indexOf(':');
        if (colonIndex === -1) continue;

        const property = declaration.substring(0, colonIndex).trim().toLowerCase();
        const value = declaration
            .substring(colonIndex + 1)
            .replace(/!important\s*$/i, '')
            .trim();

        if (!property || !value) continue;

        if (property === 'border') {
            Object.assign(style, expandBorderShorthand(value));
            continue;
        }

        // Map CSS property to RN property
        const rnProperty = CSS_TO_RN_MAP[property];
        if (!rnProperty) {
            // Skip unsupported properties silently
            continue;
        }

        // `background` is often an image or gradient, keep only plain colors
        if (property === 'background' && /url\(|gradient\(|\s/.test(value)) {
            continue;
        }

        if (BOX_SHORTHANDS.has(rnProperty) && /\s/.test(value)) {
            const expanded = expandBoxShorthand(value, rnProperty);
            if (expanded) {
                Object.assign(style, expanded);
            }
            continue;
        }

        // CSS allows a unitless multiplier for line-height (`line-height: 1.5`)
        if (rnProperty === 'lineHeight' && /^[\d.]+$/.test(value)) {
            lineHeightMultiplier = parseFloat(value);
            continue;
        }

        const parsedValue = parseValue(value, rnProperty);
        if (parsedValue !== undefined) {
            style[rnProperty] = parsedValue;
        }
    }

    if (lineHeightMultiplier !== undefined && !Number.isNaN(lineHeightMultiplier)) {
        const fontSize = typeof style.fontSize === 'number' ? style.fontSize : DEFAULT_FONT_SIZE;
        style.lineHeight = Math.round(fontSize * lineHeightMultiplier * 100) / 100;
    }

    return style as RNStyle;
}

/**
 * Parse margin/padding shorthand into individual values
 * 
 * @param value - Shorthand value (e.g., "10px 20px" or "10px 20px 30px 40px")
 * @param prefix - Property prefix ('margin' or 'padding')
 * @returns Object with individual values
 */
export function parseBoxShorthand(
    value: string,
    prefix: 'margin' | 'padding'
): Record<string, number> {
    const parts = value.split(/\s+/).map(v => {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
    });

    let top: number, right: number, bottom: number, left: number;

    switch (parts.length) {
        case 1:
            [top] = parts;
            right = bottom = left = top;
            break;
        case 2:
            [top, right] = parts;
            bottom = top;
            left = right;
            break;
        case 3:
            [top, right, bottom] = parts;
            left = right;
            break;
        case 4:
        default:
            [top, right, bottom, left] = parts;
            break;
    }

    return {
        [`${prefix}Top`]: top,
        [`${prefix}Right`]: right,
        [`${prefix}Bottom`]: bottom,
        [`${prefix}Left`]: left,
    };
}

/**
 * Merge multiple style objects, later styles override earlier
 * 
 * @param styles - Style objects to merge
 * @returns Merged style object
 */
export function mergeStyles(...styles: (RNStyle | undefined)[]): RNStyle {
    return Object.assign({}, ...styles.filter(Boolean)) as RNStyle;
}

/**
 * Check if a style object is empty
 */
export function isEmptyStyle(style: RNStyle | undefined): boolean {
    if (!style) return true;
    return Object.keys(style).length === 0;
}

