/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { Toggle } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { HexString } from '../../defines';
import TextInputField from './TextInputField';

interface InputAndBoolFieldProps {
    field: string;
    stringValue: string | HexString;
    boolValue: boolean;
    required?: boolean;
    disabled?: boolean;
    tooltip?: string;
    boolLabel?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
    /**
     * A callback function to update the string value.
     *
     * @callback onChangeString
     * @param {string | HexString} stringValue - The new value of the string field
     * @returns {void}
     */
    onChangeString: (stringValue: string | HexString) => void;
    /**
     * A callback function to update the boolean value.
     *
     * @callback onChangeBool
     * @param {boolean} boolValue - The new value of the boolean field
     * @returns {void}
     */
    onChangeBool: (boolValue: boolean) => void;
    useNrfconnect?: boolean;
}

/**
 * A component that displays a text input field and a toggle button.
 *
 * @component InputAndBoolField
 * @param {string} field - The label text for the input field
 * @param {string} stringValue - The current value of the input field
 * @param {boolean} boolValue - The current value of the toggle button
 * @param {boolean} [required] - Whether the input field is required
 * @param {boolean} [disabled] - Whether the input field is disabled
 * @param {string} [tooltip] - The tooltip text for the input field
 * @param {string} [boolLabel] - The label text for the toggle button
 * @param {onChangeString} onChangeString - The function to call when the input field value changes
 * @param {onChangeBool} onChangeBool - The function to call when the toggle button value changes
 * @param {boolean} [useNrfconnect] - Whether to use the nrfconnect shared components
 *
 * @returns {JSX.Element} The InputAndBoolField component
 *
 * @example
 * import InputAndBoolField from './Components/Edit/InputAndBoolField';
 *
 * const ExampleComponent = () => {
 *     const [inputValue, setInputValue] = useState("Current Value");
 *     const [toggleValue, setToggleValue] = useState(true);
 *
 *     const handleStringChange = (value: string) => {
 *         console.log(`String value changed to: ${value}`);
 *         setInputValue(value);
 *     };
 *
 *     const handleBoolChange = (value: boolean) => {
 *         console.log(`Boolean value changed to: ${value}`);
 *         setToggleValue(value);
 *     };
 *
 *     return (
 *         <Box sx={{ width: '100%', maxWidth: 500, margin: '20px auto' }}>
 *             <InputAndBoolField
 *                 field="Field Name"
 *                 stringValue={inputValue}
 *                 boolValue={toggleValue}
 *                 required={true}
 *                 tooltip="Enter a value and toggle the switch"
 *                 boolLabel="Enable Feature"
 *                 onChangeString={handleStringChange}
 *                 onChangeBool={handleBoolChange}
 *                 useNrfconnect={true}
 *             />
 *         </Box>
 *     );
 * };
 */
const InputAndBoolField: React.FC<InputAndBoolFieldProps> = ({
    field,
    stringValue,
    boolValue,
    required,
    disabled,
    tooltip,
    boolLabel,
    onChangeString,
    onChangeBool,
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
        <Box
            display="flex"
            alignItems="center"
            width="100%"
            gap={2}
            paddingRight={5}
        >
            <TextInputField
                field={field}
                value={String(stringValue)}
                required={required}
                disabled={disabled}
                onChange={onChangeString}
                fullWidth
                useNrfconnect={useNrfconnect}
            />
            <Toggle
                labelRight
                label={boolLabel || ''}
                isToggled={boolValue}
                onToggle={checked => onChangeBool(checked)}
                disabled={disabled}
            />
        </Box>
    </Tooltip>
);

export default InputAndBoolField;
