/**
 * Text Measurement Hook
 * Provides text measurement utilities for layout calculations
 * @module hooks/useTextMeasurement
 */

import React, { useState, useCallback, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { TextStyle, LayoutChangeEvent } from 'react-native';

/**
 * Text measurements
 */
export interface TextMeasurement {
    width: number;
    height: number;
    lineCount: number;
}

/**
 * Options for measuring text
 */
export interface TextMeasurementOptions {
    /** Style to apply during measurement */
    style?: TextStyle;
    /** Maximum width constraint */
    maxWidth?: number;
    /** Maximum number of lines */
    numberOfLines?: number;
}

/**
 * State for text measurement
 */
export interface TextMeasurementState {
    measurement: TextMeasurement | null;
    isMeasuring: boolean;
}

/**
 * Hook for measuring text dimensions
 */
export function useTextMeasurement() {
    const [state, setState] = useState<TextMeasurementState>({
        measurement: null,
        isMeasuring: false,
    });

    const pendingMeasurement = useRef<{
        text: string;
        options: TextMeasurementOptions;
        resolve: (value: TextMeasurement) => void;
    } | null>(null);

    const [measureConfig, setMeasureConfig] = useState<{
        text: string;
        options: TextMeasurementOptions;
    } | null>(null);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        const lineHeight = measureConfig?.options.style?.lineHeight || 20;
        const lineCount = Math.round(height / lineHeight);

        const measurement: TextMeasurement = {
            width,
            height,
            lineCount,
        };

        setState({
            measurement,
            isMeasuring: false,
        });

        if (pendingMeasurement.current) {
            pendingMeasurement.current.resolve(measurement);
            pendingMeasurement.current = null;
        }

        setMeasureConfig(null);
    }, [measureConfig]);

    const measureText = useCallback((
        text: string,
        options: TextMeasurementOptions = {}
    ): Promise<TextMeasurement> => {
        return new Promise((resolve) => {
            pendingMeasurement.current = { text, options, resolve };

            setState(prev => ({
                ...prev,
                isMeasuring: true,
            }));

            setMeasureConfig({ text, options });
        });
    }, []);

    // Hidden measurement component
    const MeasureView = useCallback((): React.ReactElement | null => {
        if (!measureConfig) return null;

        const { text, options } = measureConfig;

        return React.createElement(View, { style: styles.measureContainer },
            React.createElement(Text, {
                style: [styles.measureText, options.style, { maxWidth: options.maxWidth }],
                numberOfLines: options.numberOfLines,
                onLayout: handleLayout,
            }, text)
        );
    }, [measureConfig, handleLayout]);

    return {
        measurement: state.measurement,
        isMeasuring: state.isMeasuring,
        measureText,
        MeasureView,
    };
}

/**
 * Estimate text height based on content and style
 */
export function estimateTextHeight(
    text: string,
    options: {
        fontSize?: number;
        lineHeight?: number;
        maxWidth?: number;
        averageCharWidth?: number;
    } = {}
): number {
    const {
        fontSize = 16,
        lineHeight = fontSize * 1.4,
        maxWidth = 300,
        averageCharWidth = fontSize * 0.5,
    } = options;

    const charsPerLine = Math.floor(maxWidth / averageCharWidth);
    const lines = Math.ceil(text.length / charsPerLine);

    return lines * lineHeight;
}

/**
 * Check if text will be truncated at given dimensions
 */
export function willTruncate(
    text: string,
    options: {
        maxWidth: number;
        maxHeight: number;
        fontSize?: number;
        lineHeight?: number;
    }
): boolean {
    const estimatedHeight = estimateTextHeight(text, options);
    return estimatedHeight > options.maxHeight;
}

const styles = StyleSheet.create({
    measureContainer: {
        position: 'absolute',
        opacity: 0,
        left: -9999,
    },
    measureText: {
        fontSize: 16,
    },
});

export default useTextMeasurement;

