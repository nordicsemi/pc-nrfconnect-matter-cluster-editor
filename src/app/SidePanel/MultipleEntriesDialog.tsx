/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    DialogButton,
    InfoDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { ListItemWithSelector } from '../../common/List';

interface MultipleEntriesDialogProps<T> {
    isVisible: boolean;
    onHide: () => void;
    onLoad: (entry: T) => void;
    title: string;
    entries: T[];
}

export const MultipleEntriesDialog = <T,>({
    isVisible,
    onHide,
    onLoad,
    title,
    entries,
}: MultipleEntriesDialogProps<T>) => (
    <InfoDialog
        isVisible={isVisible}
        onHide={onHide}
        title={`Multiple ${title}s in the single file`}
        footer={<DialogButton onClick={onHide}>Cancel</DialogButton>}
    >
        <div className="tw-flex tw-flex-col tw-gap-8">
            <div className="tw-text-sm tw-font-medium">
                This file contains multiple {title}s, but only one can be loaded
                at a time.
                <br />
                Please select one {title} from the list below to load:
            </div>
            <div
                className={`tw-flex tw-flex-col tw-gap-2 ${
                    entries.length > 4
                        ? 'scrollbar tw-max-h-64 tw-overflow-y-auto'
                        : ''
                }`}
            >
                {entries.map(entry => {
                    // Use the name property as key, which should exist for both clusters and device types
                    const key = (entry as { name?: string }).name || 'unknown';
                    const displayName =
                        (entry as { name?: string }).name || 'Unknown Entry';

                    return (
                        <ListItemWithSelector
                            key={key}
                            onSelect={() => onLoad(entry)}
                            selected={false}
                            item={<div>{displayName}</div>}
                        />
                    );
                })}
            </div>
        </div>
    </InfoDialog>
);
