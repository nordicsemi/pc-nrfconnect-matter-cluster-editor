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

export const ListItem = ({
    onSelect,
    selected,
    item,
}: {
    onSelect: () => void;
    selected: boolean;
    item: React.ReactNode;
}) => (
    <div
        role="button"
        tabIndex={0}
        onClick={blurAndInvoke(() => onSelect())}
        onKeyUp={invokeIfSpaceOrEnterPressed(() => onSelect())}
        className={classNames(
            'tw-flex tw-w-full tw-cursor-pointer tw-flex-row tw-items-center tw-justify-between tw-gap-px tw-p-4',
            selected && 'tw-bg-primary tw-text-gray-50',
            !selected && 'tw-bg-gray-50 tw-text-gray-700 hover:tw-bg-gray-100'
        )}
    >
        <div>{item}</div>
    </div>
);
