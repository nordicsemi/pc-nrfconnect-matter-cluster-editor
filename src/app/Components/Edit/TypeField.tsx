/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
    Box,
    FormControl,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Dropdown,
    InlineInput,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

interface TypeFieldProps {
    field: string;
    value: string;
    availableTypes: string[];
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
 * A reusable component for editing type fields with dropdown selection.
 *
 * @component TypeField
 * @param {string} field - The name of the field
 * @param {string} value - The current value
 * @param {string[]} availableTypes - Array of available type options
 * @param {boolean} required - Whether the field is required
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} tooltip - Tooltip text for the field
 * @param {onChange} onChange - Callback for value changes
 * @param {boolean} [useNrfconnect] - Whether to use NRF Connect components
 * @returns {JSX.Element} The rendered type field component
 *
 * @example
 * import TypeField from './Components/Edit/TypeField';
 *
 * const ExampleComponent = () => {
 *     return <TypeField field="Field Name" value="Current Value" availableTypes={['Option 1', 'Option 2', 'Option 3']} required={true} disabled={false} tooltip="Tooltip Text" onChange={value => console.log(value)} />
 * };
 */
const TypeField: React.FC<TypeFieldProps> = ({
    field,
    value,
    availableTypes,
    required,
    disabled,
    tooltip,
    onChange,
    useNrfconnect,
    tooltipPlacement = 'right',
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
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
                        <InlineInput
                            value={value}
                            onChange={onChange}
                            minSize={40}
                        />
                        <Dropdown<string>
                            items={availableTypes.map(type => ({
                                label: type,
                                value: type,
                            }))}
                            onSelect={item => onChange(item.value)}
                            selectedItem={{ label: '', value: '' }}
                            transparentButtonBg
                            disabled={disabled}
                            numItemsBeforeScroll={5}
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <TextField
                            required={required}
                            label={field}
                            value={value || ''}
                            onChange={e => onChange(e.target.value)}
                            disabled={disabled}
                            size="small"
                            fullWidth
                        />
                        <IconButton
                            size="small"
                            onClick={e => setAnchorEl(e.currentTarget)}
                            sx={{ mt: 1 }}
                            disabled={disabled}
                        >
                            <ArrowDropDownIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            {availableTypes.map(type => (
                                <MenuItem
                                    key={type}
                                    onClick={() => {
                                        onChange(type);
                                        setAnchorEl(null);
                                    }}
                                >
                                    {type}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                )}
            </FormControl>
        </Tooltip>
    );
};

export default TypeField;
