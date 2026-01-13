/**
 * React hook for parsing HTML with memoization
 * @module parser/useHtmlParser
 */

import { useMemo, useCallback } from 'react';
import { parseHtml } from './parser';
import type { HtmlNode, ParseResult, ParserOptions } from './types';

/**
 * Options for the useHtmlParser hook
 */
export interface UseHtmlParserOptions extends Partial<ParserOptions> {
    /** Skip parsing if html is empty or undefined */
    skipEmpty?: boolean;
}

/**
 * Return type for useHtmlParser hook
 */
export interface UseHtmlParserResult {
    /** Parsed AST nodes */
    nodes: HtmlNode[];
    /** Any parsing errors */
    errors: ParseResult['errors'];
    /** Whether parsing was successful (no errors) */
    isSuccess: boolean;
    /** Re-parse function for imperative updates */
    reparse: (newHtml: string) => ParseResult;
}

/**
 * Hook for parsing HTML into an AST with memoization
 * 
 * Automatically memoizes the parsing result based on the HTML string
 * and parser options, preventing unnecessary re-parses.
 * 
 * @param html - The HTML string to parse
 * @param options - Parser options
 * @returns Parsed nodes, errors, and helper functions
 * 
 * @example
 * ```tsx
 * function MyComponent({ html }: { html: string }) {
 *   const { nodes, errors, isSuccess } = useHtmlParser(html);
 *   
 *   if (!isSuccess) {
 *     return <Text>Error parsing HTML</Text>;
 *   }
 *   
 *   return <NodeRenderer nodes={nodes} />;
 * }
 * ```
 */
export function useHtmlParser(
    html: string | undefined | null,
    options: UseHtmlParserOptions = {}
): UseHtmlParserResult {
    const { skipEmpty = true, ...parserOptions } = options;

    // Memoize parser options to prevent unnecessary re-parses
    const optionsKey = useMemo(
        () => JSON.stringify(parserOptions),
        [parserOptions]
    );

    // Parse HTML with memoization
    const parseResult = useMemo<ParseResult>(() => {
        // Handle empty/null HTML
        if (!html || (skipEmpty && html.trim() === '')) {
            return { nodes: [], errors: [] };
        }

        return parseHtml(html, parserOptions);
    }, [html, optionsKey, skipEmpty]);

    // Imperative re-parse function
    const reparse = useCallback((newHtml: string): ParseResult => {
        return parseHtml(newHtml, parserOptions);
    }, [optionsKey]);

    return {
        nodes: parseResult.nodes,
        errors: parseResult.errors,
        isSuccess: parseResult.errors.length === 0,
        reparse,
    };
}

/**
 * Hook for lazy parsing - only parses when explicitly called
 * 
 * Useful when you want to control when parsing happens,
 * such as after user input is complete.
 * 
 * @param options - Parser options
 * @returns Parse function and last result
 * 
 * @example
 * ```tsx
 * function LazyParser() {
 *   const { parse, result } = useLazyHtmlParser();
 *   const [html, setHtml] = useState('');
 *   
 *   const handleSubmit = () => {
 *     parse(html);
 *   };
 *   
 *   return (
 *     <>
 *       <TextInput onChangeText={setHtml} />
 *       <Button onPress={handleSubmit} title="Parse" />
 *       {result && <NodeRenderer nodes={result.nodes} />}
 *     </>
 *   );
 * }
 * ```
 */
export function useLazyHtmlParser(options: Partial<ParserOptions> = {}) {
    const [result, setResult] = useState<ParseResult | null>(null);

    const parse = useCallback((html: string): ParseResult => {
        const parseResult = parseHtml(html, options);
        setResult(parseResult);
        return parseResult;
    }, [options]);

    const clear = useCallback(() => {
        setResult(null);
    }, []);

    return {
        parse,
        result,
        clear,
        nodes: result?.nodes ?? [],
        errors: result?.errors ?? [],
        isSuccess: result ? result.errors.length === 0 : false,
    };
}

// Need to import useState for useLazyHtmlParser
import { useState } from 'react';

export default useHtmlParser;

