/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { classNames } from '@nordicsemiconductor/pc-nrfconnect-shared';

const invokeIfSpaceOrEnterPressed =
    (onClick: React.KeyboardEventHandler<Element>) =>
    (event: React.KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === ' ' || event.key === 'Enter') {
            onClick(event);
        }
    };

const blurAndInvoke =
    (
        onClick: React.MouseEventHandler<HTMLElement>
    ): React.MouseEventHandler<HTMLElement> =>
    (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.currentTarget.blur();
        onClick(event);
    };

export const ListItemWithSelector = ({
    onSelect,
    selected,
    item,
    classNameExtended,
}: {
    onSelect?: () => void;
    selected?: boolean;
    item: React.ReactNode;
    classNameExtended?: string;
}) => (
    <div
        role="button"
        tabIndex={0}
        onClick={blurAndInvoke(() => onSelect && onSelect())}
        onKeyUp={invokeIfSpaceOrEnterPressed(() => onSelect && onSelect())}
        className={classNames(
            `tw-flex tw-w-fit tw-min-w-full tw-cursor-pointer tw-flex-row tw-items-center tw-gap-px tw-pt-2`,
            classNameExtended,
            selected && 'tw-bg-primary tw-text-gray-50',
            !selected && 'tw-bg-gray-50 tw-text-gray-700 hover:tw-bg-gray-100'
        )}
    >
        {item}
    </div>
);

export const ListItem = ({ item }: { item: React.ReactNode }) => (
    <div className="tw-flex tw-w-full tw-flex-row tw-items-center tw-justify-between tw-gap-px tw-p-4">
        <div>{item}</div>
    </div>
);

export const ListItemWarning = ({ item }: { item: React.ReactNode }) => (
    <div className="tw-flex tw-w-full tw-flex-row tw-items-center tw-justify-between tw-gap-px tw-p-4">
        <div className="tw-flex tw-items-center tw-gap-2">
            <span
                className="mdi mdi-alert-circle-outline tw-text-warning"
                aria-label="Warning"
                style={{ fontSize: '1.25em' }}
            />
            {item}
        </div>
    </div>
);

export const ListItemError = ({ item }: { item: React.ReactNode }) => (
    <div className="tw-flex tw-w-full tw-flex-row tw-items-center tw-justify-between tw-gap-px tw-p-4">
        <div className="tw-flex tw-items-center tw-gap-2">
            <span
                className="mdi mdi-alert-circle-outline tw-text-error"
                aria-label="Error"
                style={{ fontSize: '1.25em' }}
            />
            {item}
        </div>
    </div>
);
