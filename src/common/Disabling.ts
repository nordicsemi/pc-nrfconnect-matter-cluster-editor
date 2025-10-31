/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isTypeComposite, isTypeNumeric } from '../app/matterTypes';

export const disableLength = (items: any, field: string): boolean => {
    if (field === 'length' || field === 'minLength') {
        if (
            items.array === true ||
            String(items.array) === 'true' ||
            items.type === 'array'
        ) {
            return false;
        }
        // Enable length field for composite types
        if (
            Object.keys(items).includes('type') &&
            items.type &&
            isTypeComposite(items.type)
        ) {
            return false;
        }
        return true;
    }
    return false;
};

export const disableMinMax = (items: any, field: string): boolean => {
    if (field === 'min' || field === 'max') {
        if (Object.keys(items).includes('type') && isTypeNumeric(items.type)) {
            return false;
        }
        return true;
    }
    return false;
};
