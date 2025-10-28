/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import { Button, classNames } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { ListItemWithSelector } from '../../common/List';
import { HexString } from '../defines';

import './ItemsList.scss';

interface ItemsListProps<T> {
    title: string;
    items: T[];
    currentIndex: number;
    onItemClick: (item: T, index: number) => void;
    isVisible: boolean;
}

/**
 * Collapsible list component for displaying clusters, device types, or extensions in the side panel.
 *
 * This component provides a collapsible section with a list of items that can be clicked to load.
 * The currently active item is highlighted. The section is only rendered when items are available.
 *
 * @function ItemsList
 * @param {ItemsListProps<T>} props - Component props
 * @param {string} props.title - Title of the section (e.g., "Clusters", "Device Types")
 * @param {T[]} props.items - Array of items to display
 * @param {number} props.currentIndex - Index of the currently active item (-1 if none)
 * @param {function} props.onItemClick - Callback when an item is clicked
 * @param {boolean} props.isVisible - Whether to render the section
 * @returns {JSX.Element | null} - The rendered items list or null if not visible
 */
export const ItemsList = <T,>({
    title,
    items,
    currentIndex,
    onItemClick,
    isVisible,
}: ItemsListProps<T>) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isVisible || items.length === 0) {
        return null;
    }

    return (
        <div className="tw-flex tw-flex-col tw-overflow-hidden">
            <Button
                variant="secondary"
                onClick={() => setIsExpanded(!isExpanded)}
                className={classNames(
                    'tw-flex tw-flex-shrink-0 tw-items-center tw-justify-between',
                    'tw-text-sm tw-text-gray-700'
                )}
            >
                <span>{title}</span>
                <span
                    className={classNames(
                        'mdi tw-transition-transform',
                        isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
                    )}
                />
            </Button>

            {isExpanded && (
                <div className="scrollbar tw-max-h-64 tw-overflow-auto">
                    <div className="tw-flex tw-flex-col">
                        {items.map((item, index) => {
                            // Extract name for display
                            const name = getItemName(item, index);
                            const isSelected = index === currentIndex;

                            return (
                                <ListItemWithSelector
                                    key={`${title}-${getItemName(item, 0)}`}
                                    onSelect={() => onItemClick(item, index)}
                                    selected={isSelected}
                                    item={
                                        <div className="tw-whitespace-nowrap">
                                            {name}
                                        </div>
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Extracts a display name from an item.
 * Handles different item types (clusters, device types, extensions).
 *
 * @function getItemName
 * @param {T} item - The item to get the name from
 * @param {number} index - The index of the item in the list
 * @returns {string} The name of the item
 */
function getItemName<T>(item: T, index: number): string {
    // Try to get the name property
    const itemWithName = item as {
        name?: string;
        $?: { code?: string | HexString };
    };

    if (itemWithName.name) {
        return itemWithName.name;
    }

    // For extensions, show code
    if (itemWithName.$ && itemWithName.$.code) {
        const code = itemWithName.$.code;
        const codeStr = code instanceof HexString ? code.toString() : code;
        return `Extension ${index + 1} (Code: ${codeStr})`;
    }

    return `Item ${index + 1}`;
}
