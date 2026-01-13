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
    'border': 'border',
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
    'background': 'backgroundColor',
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
    'text-shadow': 'textShadowColor',
    'word-spacing': 'letterSpacing',
    'white-space': 'whiteSpace',
    'text-overflow': 'textOverflow',

    // Shadow (limited support)
    'box-shadow': 'shadowColor',
    'shadow-color': 'shadowColor',
    'shadow-offset': 'shadowOffset',
    'shadow-opacity': 'shadowOpacity',
    'shadow-radius': 'shadowRadius',

    // Other
    'overflow': 'overflow',
    'aspect-ratio': 'aspectRatio',
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
        return FONT_WEIGHT_MAP[trimmed] || trimmed;
    }

    // Handle numeric values
    const numericMatch = trimmed.match(/^(-?[\d.]+)(px|em|rem|%|pt|vh|vw)?$/);
    if (numericMatch) {
        const num = parseFloat(numericMatch[1]);
        const unit = numericMatch[2];

        // React Native doesn't support units, convert to numbers
        switch (unit) {
            case 'px':
                return num;
            case 'em':
            case 'rem':
                // Approximate conversion (base 16px)
                return num * 16;
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
    const decorations = value.split(' ');
    const mapped: string[] = [];

    for (const dec of decorations) {
        switch (dec) {
            case 'underline':
                mapped.push('underline');
                break;
            case 'line-through':
                mapped.push('line-through');
                break;
            case 'overline':
                // Not supported in RN, skip
                break;
            case 'none':
                return 'none';
        }
    }

    return mapped.join(' ') || 'none';
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

    // Split by semicolon, handling potential edge cases
    const declarations = cssString.split(';').filter(Boolean);

    for (const declaration of declarations) {
        const colonIndex = declaration.indexOf(':');
        if (colonIndex === -1) continue;

        const property = declaration.substring(0, colonIndex).trim().toLowerCase();
        const value = declaration.substring(colonIndex + 1).trim();

        if (!property || !value) continue;

        // Map CSS property to RN property
        const rnProperty = CSS_TO_RN_MAP[property];
        if (!rnProperty) {
            // Skip unsupported properties silently
            continue;
        }

        const parsedValue = parseValue(value, rnProperty);
        if (parsedValue !== undefined) {
            style[rnProperty] = parsedValue;
        }
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

