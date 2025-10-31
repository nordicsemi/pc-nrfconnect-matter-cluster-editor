/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Box, TextField, Tooltip, Typography } from '@mui/material';
import { InlineInput } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { HexString } from '../../defines';

interface TextInputFieldProps {
    field: string;
    value: string | number | HexString;
    required?: boolean;
    disabled?: boolean;
    tooltip?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
    /**
     * A callback function to update the value.
     *
     * @callback onChange
     * @param {string | HexString} value - The new value.
     * @returns {void}
     */
    onChange: (value: string | HexString) => void;
    fullWidth?: boolean;
    useNrfconnect?: boolean;
    minSize?: number;
    /**
     * A callback function to validate the value.
     *
     * @callback isValid
     * @param {string | number | HexString} value - The value to validate.
     * @returns {boolean} Whether the value is valid.
     */
    isValid?: (value: string | number | HexString) => boolean;
    treatAsHex?: boolean;
}

/**
 * A reusable component for editing text and number fields.
 * Supports both MUI TextField and NRF Connect InlineInput.
 *
 * @component TextInputField
 * @param {string} field - The name of the field
 * @param {string | number | HexString} value - The current value
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} tooltip - Tooltip text for the field
 * @param {onChange} onChange - Callback for value changes
 * @param {boolean} [fullWidth] - Whether the field should take full width
 * @param {boolean} [useNrfconnect] - Whether to use NRF Connect InlineInput
 * @param {number} [minSize] - Minimum size for InlineInput
 * @param {isValid} [isValid] - Validation function for InlineInput
 * @param {boolean} [treatAsHex] - Whether to treat input as hex string
 * @returns {JSX.Element} The rendered text input field component
 *
 * @example
 * import React, { useState } from 'react';
 * import TextInputField from './Components/Edit/TextInputField';
 * import { HexString } from '../defines';
 *
 * const ClusterIdEditor = () => {
 *   const [clusterId, setClusterId] = useState(new HexString(0x0402));
 *
 *   const handleChange = (value) => {
 *     // Convert the string value to a HexString instance
 *     setClusterId(new HexString(value));
 *   };
 *
 *   const isValidHex = (value) => {
 *     // Basic validation for hex values
 *     try {
 *       const hex = value.toString().replace(/^0x/, '');
 *       return /^[0-9A-Fa-f]+$/.test(hex);
 *     } catch {
 *       return false;
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <TextInputField
 *         field="Cluster ID"
 *         value={clusterId}
 *         onChange={handleChange}
 *         required={true}
 *         tooltip="The ID of the cluster in hexadecimal format"
 *         treatAsHex={true}
 *         isValid={isValidHex}
 *       />
 *
 *       <TextInputField
 *         field="Cluster Name"
 *         value="Temperature Measurement"
 *         onChange={(value) => console.log('Name changed:', value)}
 *         useNrfconnect={true}
 *         minSize={20}
 *       />
 *     </div>
 *   );
 * };
 */
const TextInputField: React.FC<TextInputFieldProps> = ({
    field,
    value,
    required = false,
    disabled = false,
    tooltip = '',
    tooltipPlacement = 'right',
    onChange,
    fullWidth = false,
    useNrfconnect = false,
    minSize = 10,
    isValid = () => true,
    treatAsHex = false,
}) => {
    // Convert value to string representation
    const stringValue = (() => {
        if (value instanceof HexString) {
            // Always ensure HexString values have the 0x prefix
            const strValue = value.toString();
            return strValue.startsWith('0x') ? strValue : `0x${strValue}`;
        }
        // Preserve numeric 0 and boolean false; only default null/undefined to ''
        return String(value ?? '');
    })();

    // Handle input changes with hex filtering if needed
    const handleInputChange = (newValue: string) => {
        if (treatAsHex) {
            // Filter out non-hex characters in real-time
            const sanitizedValue = HexString.sanitizeHexString(newValue);
            onChange(sanitizedValue);
        } else {
            onChange(newValue);
        }
    };

    // Render NRF Connect InlineInput
    if (useNrfconnect) {
        return (
            <Tooltip
                title={
                    tooltip ? (
                        <Box
                            sx={{
                                maxWidth: 220,
                                whiteSpace: 'pre-line',
                                wordWrap: 'break-word',
                            }}
                        >
                            {tooltip}
                        </Box>
                    ) : null
                }
                arrow
                placement={tooltipPlacement}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{ mr: 2, minWidth: 'fit-content' }}
                    >
                        {field} {required ? '*' : ''}:
                    </Typography>
                    <InlineInput
                        value={stringValue}
                        onChange={handleInputChange}
                        minSize={minSize}
                        disabled={disabled}
                        isValid={isValid}
                        className={required ? '' : 'optional'}
                    />
                </Box>
            </Tooltip>
        );
    }

    // Render standard MUI TextField
    return (
        <Tooltip title={tooltip} arrow placement={tooltipPlacement}>
            <TextField
                required={required}
                label={field}
                value={stringValue}
                onChange={e => handleInputChange(e.target.value)}
                disabled={disabled}
                fullWidth={fullWidth}
                size="small"
                variant="outlined"
            />
        </Tooltip>
    );
};

export default TextInputField;
