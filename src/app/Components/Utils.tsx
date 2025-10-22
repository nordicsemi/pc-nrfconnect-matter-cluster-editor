/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { useEffect, useRef } from 'react';

import { HexString } from '../defines';
/**
 * @template T - The type of the value being synchronized
 */

/**
 * A utility hook that synchronizes an internal component state with changes from an external source.
 * This is useful when a component needs to maintain its own state but also respond to changes
 * from props or other external sources.
 *
 * @function SynchronizeChangeFromOutside
 * @param {T} externalValue - The external value to monitor for changes
 * @param {function} setInternalValue - A function to update the internal state when external value changes
 * @returns {T} - The previous external value
 *
 * @example
 * import { useState } from 'react';
 * import { SynchronizeChangeFromOutside } from './Utils';
 *
 * const MyComponent = ({ externalData }) => {
 *   const [internalData, setInternalData] = useState(externalData);
 *
 *   // This will update internalData whenever externalData changes
 *   SynchronizeChangeFromOutside(externalData, setInternalData);
 *
 *   const handleLocalChange = (newValue) => {
 *     setInternalData(newValue);
 *     // Additional local processing can happen here
 *   };
 *
 *   return (
 *     <input
 *       value={internalData}
 *       onChange={(e) => handleLocalChange(e.target.value)}
 *     />
 *   );
 * };
 */
export const SynchronizeChangeFromOutside = <T,>(
    externalValue: T,
    setInternalValue: (value: T) => void
) => {
    const previousExternalValue = useRef(externalValue);
    useEffect(() => {
        if (previousExternalValue.current !== externalValue) {
            setInternalValue(externalValue);
            previousExternalValue.current = externalValue;
        }
    });
    return previousExternalValue.current;
};

/**
 * @template S - The type of the object to clone
 */

/**
 * Creates a deep clone of an object using JSON serialization/deserialization.
 * This is useful for creating a completely separate copy of an object to prevent
 * unintended modifications to the original object.
 *
 * Note: This method has limitations with circular references, functions, and certain JavaScript types.
 *
 * @function deepClone
 * @param {S} obj - The object to deep clone
 * @returns {S} - A deep clone of the input object
 *
 * @example
 * import { deepClone } from './Utils';
 *
 * const originalObject = {
 *   name: 'Device',
 *   settings: {
 *     enabled: true,
 *     options: ['option1', 'option2']
 *   }
 * };
 *
 * // Create a completely independent copy
 * const clonedObject = deepClone(originalObject);
 *
 * // Modify the clone without affecting the original
 * clonedObject.settings.enabled = false;
 * clonedObject.settings.options.push('option3');
 *
 * console.log(originalObject.settings.enabled); // true
 * console.log(originalObject.settings.options); // ['option1', 'option2']
 */
/**
 * Deep clones an object while preserving HexString instances.
 * Standard JSON.parse(JSON.stringify()) would convert HexString to plain objects.
 * @function deepClone
 * @param {S} obj - The object to deep clone
 * @returns {S} - A deep clone of the input object
 */
export const deepClone = <S,>(obj: S): S => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Preserve HexString instances
    if (obj instanceof HexString) {
        return new HexString(obj.toString()) as unknown as S;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as unknown as S;
    }

    // Handle objects
    const cloned = {} as S;
    Object.keys(obj).forEach(key => {
        (cloned as Record<string, unknown>)[key] = deepClone(
            (obj as Record<string, unknown>)[key]
        );
    });
    return cloned;
};

/**
 * Converts a camelCase string to a title case string.
 * This utility function transforms camelCase identifiers into a more readable format
 * by adding spaces before capital letters and capitalizing the first letter.
 *
 * @function camelCaseToTitle
 * @param {string} camelCase - The camelCase string to convert
 * @returns {string} - The converted string in title case format
 *
 * @example
 * import { camelCaseToTitle } from './Utils';
 *
 * console.log(camelCaseToTitle('deviceName')); // 'Device Name'
 * console.log(camelCaseToTitle('clusterIdentifier')); // 'Cluster Identifier'
 * console.log(camelCaseToTitle('matterProtocol')); // 'Matter Protocol'
 */

export const camelCaseToTitle = (camelCase: string): string =>
    camelCase
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase letters
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Insert space between uppercase and uppercase followed by lowercase
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Insert space between number and uppercase letter
        .replace(/^./, str => str.toUpperCase()); // Capitalize the first letter
