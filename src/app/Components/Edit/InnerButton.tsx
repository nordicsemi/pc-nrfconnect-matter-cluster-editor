/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Badge, Box, Tooltip } from '@mui/material';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

interface InnerButtonProps {
    /**
     * The function to call when the button is clicked.
     *
     * @callback onClick
     * @returns {void}
     */
    onClick: () => void;
    label: string;
    badgeContent: number;
    color?: 'primary' | 'secondary';
    tooltip?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * An InnerButton component that displays a badge with a button.
 *
 * @component InnerButton
 * @param {Function} onClick - The function to call when the button is clicked
 * @param {string} label - The label text for the button
 * @param {number} badgeContent - The number to display in the badge
 * @param {string} [color] - The color of the badge (default: 'secondary')
 * @param {string} [tooltip] - The tooltip text for the button
 *
 * @returns {JSX.Element} The InnerButton component
 *
 * @example
 * import InnerButton from './Components/Edit/InnerButton';
 *
 * const ExampleComponent = () => {
 *     return <InnerButton onClick={() => console.log('Button clicked')} label="Button Label" badgeContent={10} />
 * };
 */
const InnerButton = ({
    onClick,
    label,
    badgeContent,
    color = 'secondary',
    tooltip = '',
    tooltipPlacement = 'right',
}: InnerButtonProps) => (
    <Tooltip title={tooltip} arrow placement={tooltipPlacement}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Badge badgeContent={badgeContent} color={color}>
                <Button variant="info" size="xl" onClick={() => onClick()}>
                    {label}
                </Button>
            </Badge>
        </Box>
    </Tooltip>
);

export default InnerButton;
