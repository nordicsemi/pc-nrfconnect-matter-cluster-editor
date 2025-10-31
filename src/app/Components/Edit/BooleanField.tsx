/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';
import { Toggle } from '@nordicsemiconductor/pc-nrfconnect-shared';

interface BooleanFieldProps {
    field: string;
    value: boolean;
    required: boolean;
    disabled: boolean;
    tooltip: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
    /**
     * A callback function to update the value.
     *
     * @callback onChange
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    onChange: (value: boolean) => void;
    leftLabel?: boolean;
}

/**
 * A reusable component for editing boolean fields using a toggle switch.
 *
 * @component BooleanField
 * @param {string} field - The name of the field
 * @param {boolean} value - The current value
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} tooltip - Tooltip text for the field
 * @param {onChange} onChange - Callback for value changes
 * @param {boolean} [leftLabel] - Whether to position the label on the left side instead of right
 * @returns {JSX.Element} The rendered boolean field component
 *
 * @example
 * import React, { useState } from 'react';
 * import BooleanField from './Components/Edit/BooleanField';
 *
 * const FeatureFlagEditor = () => {
 *   const [isEnabled, setIsEnabled] = useState(false);
 *   const [isRequired, setIsRequired] = useState(true);
 *
 *   return (
 *     <div style={{ width: '300px' }}>
 *       <BooleanField
 *         field="Enable Feature"
 *         value={isEnabled}
 *         required={false}
 *         disabled={false}
 *         tooltip="Enable or disable this feature"
 *         onChange={value => setIsEnabled(value)}
 *       />
 *
 *       <BooleanField
 *         field="Mark as Required"
 *         value={isRequired}
 *         required={false}
 *         disabled={false}
 *         tooltip="Set whether this feature is required"
 *         onChange={value => setIsRequired(value)}
 *         leftLabel={true}
 *       />
 *
 *       <div style={{ marginTop: '20px' }}>
 *         Feature status: {isEnabled ? 'Enabled' : 'Disabled'}
 *         {isRequired && ' (Required)'}
 *       </div>
 *     </div>
 *   );
 * };
 */
const BooleanField: React.FC<BooleanFieldProps> = ({
    field,
    value,
    required,
    disabled,
    tooltip,
    tooltipPlacement = 'right',
    onChange,
    leftLabel = false,
}) => (
    <Tooltip
        title={
            <Box
                sx={{
                    maxWidth: 220,
                    whiteSpace: 'pre-line',
                    wordWrap: 'break-word',
                }}
            >
                {tooltip}
            </Box>
        }
        arrow
        placement={tooltipPlacement}
    >
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
            }}
        >
            {leftLabel ? (
                <Typography
                    variant="body1"
                    sx={{ minWidth: 'fit-content', marginRight: 1 }}
                >
                    {field}:
                </Typography>
            ) : null}
            <FormControlLabel
                required={required}
                control={
                    <Toggle
                        isToggled={value}
                        onToggle={checked => onChange(checked)}
                        label={
                            !leftLabel ? (
                                <Typography variant="body2" noWrap>
                                    {field}
                                </Typography>
                            ) : null
                        }
                        labelRight={!leftLabel}
                        disabled={disabled}
                    />
                }
                label=""
                sx={{
                    marginLeft: leftLabel ? '3px' : '0px',
                    marginTop: leftLabel ? '6px' : '0px',
                    width: '100%',
                    justifyContent: 'flex-start',
                }}
            />
        </Box>
    </Tooltip>
);

export default BooleanField;
