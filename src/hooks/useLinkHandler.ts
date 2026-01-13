/**
 * Link Handler Hook
 * Provides link detection and handling utilities
 * @module hooks/useLinkHandler
 */

import { useCallback, useMemo } from 'react';
import { Linking, Alert } from 'react-native';
import type { ElementNode } from '../parser/types';

/**
 * Link types
 */
export type LinkType = 'external' | 'internal' | 'mailto' | 'tel' | 'unknown';

/**
 * Link info extracted from a URL
 */
export interface LinkInfo {
    /** Original URL */
    url: string;
    /** Type of link */
    type: LinkType;
    /** Whether the URL is valid */
    isValid: boolean;
    /** Protocol (http, https, mailto, tel, etc.) */
    protocol?: string;
    /** Host for external links */
    host?: string;
}

/**
 * Options for useLinkHandler
 */
export interface UseLinkHandlerOptions {
    /** Custom handler for links */
    onPress?: (url: string, node: ElementNode) => void;
    /** Whether to confirm before opening external links */
    confirmExternal?: boolean;
    /** Message to show in confirmation dialog */
    confirmMessage?: string;
    /** Base URL for resolving relative links */
    baseUrl?: string;
}

/**
 * Detect link type from URL
 */
export function detectLinkType(url: string): LinkType {
    if (!url) return 'unknown';

    if (url.startsWith('mailto:')) return 'mailto';
    if (url.startsWith('tel:')) return 'tel';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'external';
    if (url.startsWith('#') || url.startsWith('/')) return 'internal';

    return 'unknown';
}

/**
 * Parse URL and extract info
 */
export function parseUrl(url: string): LinkInfo {
    const type = detectLinkType(url);

    const info: LinkInfo = {
        url,
        type,
        isValid: Boolean(url),
    };

    try {
        if (type === 'external') {
            const parsed = new URL(url);
            info.protocol = parsed.protocol.replace(':', '');
            info.host = parsed.host;
        } else if (type === 'mailto') {
            info.protocol = 'mailto';
        } else if (type === 'tel') {
            info.protocol = 'tel';
        }
    } catch {
        info.isValid = false;
    }

    return info;
}

/**
 * Resolve a relative URL against a base URL
 */
export function resolveUrl(relativeUrl: string, baseUrl: string): string {
    if (!relativeUrl || !baseUrl) return relativeUrl;

    // Already absolute
    if (relativeUrl.match(/^https?:\/\//)) return relativeUrl;

    try {
        return new URL(relativeUrl, baseUrl).toString();
    } catch {
        return relativeUrl;
    }
}

/**
 * Hook for handling link presses
 * 
 * @param options - Configuration options
 * @returns Link handler function and utilities
 * 
 * @example
 * ```tsx
 * const { handleLinkPress } = useLinkHandler({
 *   onPress: (url) => console.log('Link pressed:', url),
 *   confirmExternal: true,
 * });
 * ```
 */
export function useLinkHandler(options: UseLinkHandlerOptions = {}) {
    const {
        onPress,
        confirmExternal = false,
        confirmMessage = 'Open this link in your browser?',
        baseUrl,
    } = options;

    const openUrl = useCallback(async (url: string): Promise<boolean> => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const handleLinkPress = useCallback(
        async (url: string, node: ElementNode): Promise<void> => {
            // Resolve URL if base provided
            const resolvedUrl = baseUrl ? resolveUrl(url, baseUrl) : url;
            const info = parseUrl(resolvedUrl);

            // Custom handler takes priority
            if (onPress) {
                onPress(resolvedUrl, node);
                return;
            }

            // Confirm external links if enabled
            if (confirmExternal && info.type === 'external') {
                Alert.alert(
                    'Open Link',
                    confirmMessage,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open', onPress: () => openUrl(resolvedUrl) },
                    ],
                    { cancelable: true }
                );
                return;
            }

            // Default behavior
            await openUrl(resolvedUrl);
        },
        [onPress, confirmExternal, confirmMessage, baseUrl, openUrl]
    );

    return {
        handleLinkPress,
        openUrl,
        parseUrl,
        detectLinkType,
        resolveUrl: (url: string) => baseUrl ? resolveUrl(url, baseUrl) : url,
    };
}

export default useLinkHandler;

