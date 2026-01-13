/**
 * Image Dimensions Hook
 * Provides image sizing utilities with async loading
 * @module hooks/useImageDimensions
 */

import { useState, useEffect, useCallback } from 'react';
import { Image, Dimensions as RNDimensions } from 'react-native';

/**
 * Image dimensions
 */
export interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * Image dimensions state
 */
export interface ImageDimensionsState {
    /** Current dimensions */
    dimensions: ImageDimensions | null;
    /** Whether dimensions are being loaded */
    isLoading: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Whether dimensions were loaded from cache */
    fromCache: boolean;
}

/**
 * Options for useImageDimensions
 */
export interface UseImageDimensionsOptions {
    /** Maximum width constraint */
    maxWidth?: number;
    /** Maximum height constraint */
    maxHeight?: number;
    /** Default dimensions to use while loading */
    defaultDimensions?: ImageDimensions;
    /** Whether to maintain aspect ratio when constraining */
    maintainAspectRatio?: boolean;
}

/**
 * Simple in-memory cache for image dimensions
 */
const dimensionsCache = new Map<string, ImageDimensions>();

/**
 * Get default max width based on screen dimensions
 */
function getDefaultMaxWidth(): number {
    return RNDimensions.get('window').width - 32;
}

/**
 * Calculate constrained dimensions
 */
export function constrainDimensions(
    width: number,
    height: number,
    maxWidth: number = getDefaultMaxWidth(),
    maxHeight?: number,
    maintainAspectRatio: boolean = true
): ImageDimensions {
    if (!maintainAspectRatio) {
        return {
            width: Math.min(width, maxWidth),
            height: maxHeight ? Math.min(height, maxHeight) : height,
        };
    }

    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    // Constrain by width
    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
    }

    // Constrain by height if specified
    if (maxHeight && newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    }

    return { width: newWidth, height: newHeight };
}

/**
 * Fetch image dimensions from URL
 */
export function fetchImageDimensions(url: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        // Check cache first
        const cached = dimensionsCache.get(url);
        if (cached) {
            resolve(cached);
            return;
        }

        Image.getSize(
            url,
            (width, height) => {
                const dimensions = { width, height };
                dimensionsCache.set(url, dimensions);
                resolve(dimensions);
            },
            (error) => {
                reject(new Error(`Failed to get image dimensions: ${error?.message || 'Unknown error'}`));
            }
        );
    });
}

/**
 * Clear the dimensions cache
 */
export function clearDimensionsCache(): void {
    dimensionsCache.clear();
}

/**
 * Hook for loading and managing image dimensions
 * 
 * @param src - Image source URL
 * @param options - Configuration options
 * @returns Dimensions state and utilities
 * 
 * @example
 * ```tsx
 * const { dimensions, isLoading } = useImageDimensions(imageUrl, {
 *   maxWidth: 300,
 *   maintainAspectRatio: true,
 * });
 * 
 * if (isLoading) {
 *   return <ActivityIndicator />;
 * }
 * 
 * return <Image source={{ uri: imageUrl }} style={dimensions} />;
 * ```
 */
export function useImageDimensions(
    src: string | undefined,
    options: UseImageDimensionsOptions = {}
): ImageDimensionsState & { refresh: () => void } {
    const {
        maxWidth = getDefaultMaxWidth(),
        maxHeight,
        defaultDimensions,
        maintainAspectRatio = true,
    } = options;

    const [state, setState] = useState<ImageDimensionsState>({
        dimensions: defaultDimensions || null,
        isLoading: Boolean(src),
        error: null,
        fromCache: false,
    });

    const loadDimensions = useCallback(async () => {
        if (!src) {
            setState({
                dimensions: defaultDimensions || null,
                isLoading: false,
                error: null,
                fromCache: false,
            });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const fromCache = dimensionsCache.has(src);
            const rawDimensions = await fetchImageDimensions(src);
            const constrained = constrainDimensions(
                rawDimensions.width,
                rawDimensions.height,
                maxWidth,
                maxHeight,
                maintainAspectRatio
            );

            setState({
                dimensions: constrained,
                isLoading: false,
                error: null,
                fromCache,
            });
        } catch (error) {
            setState({
                dimensions: defaultDimensions || { width: maxWidth, height: 200 },
                isLoading: false,
                error: error instanceof Error ? error : new Error('Unknown error'),
                fromCache: false,
            });
        }
    }, [src, maxWidth, maxHeight, maintainAspectRatio, defaultDimensions]);

    useEffect(() => {
        loadDimensions();
    }, [loadDimensions]);

    return {
        ...state,
        refresh: loadDimensions,
    };
}

export default useImageDimensions;

