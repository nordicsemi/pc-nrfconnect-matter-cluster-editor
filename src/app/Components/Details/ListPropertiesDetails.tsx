/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import * as React from 'react';

import { DetailsItem } from './DetailsBox';

interface ListPropertiesDetailsProps {
    textToDisplay: string;
    items: (string | number | null)[];
}

/**
 * The ListPropertiesDetails component displays a list of input items using DetailsItem blocks.
 * You can provide a list of items in format of string or number.
 * If the specific item within the input list is null, then it is skipped, so you can provide
 * a list that is supposed to be modified at runtime by a user.
 *
 * The textToDisplay is a string that will be displayed before the list of items.
 *
 * The whole list of items is displayed in a single DetailsItem block.
 *
 * @component ListPropertiesDetails
 * @param {string} textToDisplay - The text to be displayed before the list of items.
 * @param {string | number | null} items - The list of items to be displayed.
 * @returns {React.ReactNode} The rendered `ListPropertiesDetails` component.
 * @example
 * <ListPropertiesDetails textToDisplay="My Items:" items={['Item 1', 'Item 2', 'Item 3']} />
 * <ListPropertiesDetails textToDisplay="Numbers:" items={[1, 2, 3]} />
 * <ListPropertiesDetails textToDisplay="Partial List:" items={['Item 1', null, 'Item 3']} />
 */
const ListPropertiesDetails: React.FC<ListPropertiesDetailsProps> = ({
    items,
    textToDisplay,
}) => (
    <DetailsItem>
        <strong>{textToDisplay} </strong>
        <div style={{ display: 'flex', gap: '8px' }}>
            {items.map(
                item =>
                    item != null && (
                        <div key={item} style={{ width: 'fit-content' }}>
                            <DetailsItem>{item}</DetailsItem>
                        </div>
                    )
            )}
        </div>
    </DetailsItem>
);

export default ListPropertiesDetails;
