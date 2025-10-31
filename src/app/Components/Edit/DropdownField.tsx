/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Tooltip,
    Typography,
} from '@mui/material';
import { Dropdown } from '@nordicsemiconductor/pc-nrfconnect-shared';

interface DropdownFieldProps {
    field: string;
    value: string;
    options: readonly string[];
    required: boolean;
    disabled: boolean;
    tooltip: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
    /**
     * A callback function to update the value.
     *
     * @callback onChange
     * @param {string} value - The new value.
     * @returns {void}
     */
    onChange: (value: string) => void;
    useNrfconnect?: boolean;
}

/**
 * A reusable dropdown component for editing fields with predefined options.
 *
 * @component DropdownField
 * @param {string} field - The name of the field
 * @param {string} value - The current value
 * @param {string[]} options - Array of available options
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} tooltip - Tooltip text for the field
 * @param {onChange} onChange - Callback for value changes
 * @param {boolean} [useNrfconnect] - Whether to use the nrfconnect shared components
 * @returns {JSX.Element} The rendered dropdown component
 *
 * @example
 * import DropdownField from './Components/Edit/DropdownField';
 *
 * const ExampleComponent = () => {
 *     return (
 *         <DropdownField
 *             field="Field Name"
 *             value="Current Value"
 *             options={['Option 1', 'Option 2', 'Option 3']}
 *             required={true}
 *             disabled={false}
 *             tooltip="Tooltip Text"
 *             onChange={value => console.log(value)}
 *         />
 *     );
 * };
 */
const DropdownField: React.FC<DropdownFieldProps> = ({
    field,
    value,
    options,
    required,
    disabled,
    tooltip,
    onChange,
    useNrfconnect,
    tooltipPlacement = 'right',
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
        <FormControl fullWidth size="small" className="largeDropdown">
            {useNrfconnect ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                        variant="body1"
                        sx={{ mr: 2, minWidth: 'fit-content' }}
                    >
                        {field} {required ? '*' : ''}:
                    </Typography>
                    <Dropdown<string>
                        items={options.map(option => ({
                            label: option,
                            value: option,
                        }))}
                        onSelect={item => onChange(item.value)}
                        selectedItem={{ label: value, value }}
                        transparentButtonBg
                    />
                </Box>
            ) : (
                <>
                    <InputLabel>
                        {field} {required ? '*' : ''}
                    </InputLabel>
                    <Select
                        required={required}
                        label={field}
                        value={value || ''}
                        onChange={(e: SelectChangeEvent) =>
                            onChange(e.target.value)
                        }
                        disabled={disabled}
                        size="small"
                    >
                        {options.map(option => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </>
            )}
        </FormControl>
    </Tooltip>
);

export default DropdownField;
