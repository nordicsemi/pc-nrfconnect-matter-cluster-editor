/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isTypeComposite, isTypeNumeric } from '../app/matterTypes';

export const validateLength = (
    items: any,
    field: string
): { isValid: boolean; invalidMessage: string } => {
    let invalidMessage = '';
    if (field === 'length') {
        // Check for array type or composite type
        if (
            (Object.keys(items).includes('array') &&
                (items.array === true || String(items.array) === 'true')) ||
            (Object.keys(items).includes('type') &&
                items.type &&
                isTypeComposite(items.type))
        ) {
            if (
                items.length === undefined ||
                items.length === null ||
                items.length <= 0
            ) {
                invalidMessage =
                    'The length of the item is required for array type or composite type.';
            }
        }
    }
    return {
        isValid: invalidMessage === '',
        invalidMessage,
    };
};

export const validateMax = (
    items: any,
    field: string
): { isValid: boolean; invalidMessage: string } => {
    let invalidMessage = '';
    if (field === 'max') {
        if (
            Object.keys(items).includes('type') &&
            isTypeNumeric(items.type) &&
            (items.max === undefined ||
                items.max === null ||
                items.max <= (items.min || 0))
        ) {
            invalidMessage =
                'The maximum value must be greater than the minimum value for numeric types.';
        }
    }
    return {
        isValid: invalidMessage === '',
        invalidMessage,
    };
};
