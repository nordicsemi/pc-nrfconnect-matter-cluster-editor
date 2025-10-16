/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
    Box,
    DialogActions,
    DialogContent,
    DialogContentText,
    Grid2,
} from '@mui/material';
import {
    Button,
    Dialog,
    InfoDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { HexString } from '../../defines';
import { camelCaseToTitle } from '../Utils';
import BooleanField from './BooleanField';
import DropdownField from './DropdownField';
import TextInputField from './TextInputField';
import TypeField from './TypeField';

export interface EditBoxProps<T> {
    value: T;
    /**
     * @callback onCancel
     * @returns {void}
     */
    onCancel: () => void;
    /**
     * @callback onSave
     * @param {T} value - The value of the object being edited
     * @returns {void}
     */
    onSave: (value: T) => void;
    /**
     * @callback onTooltipDisplay
     * @param {keyof T} field - The field that the tooltip is being displayed for
     * @returns {string} The tooltip text
     */

    onTooltipDisplay: (field: keyof T) => string;
    /**
     * @callback treatAsHex
     * @param {keyof T} field - The field that should be treated as a hexadecimal value
     * @returns {boolean} Whether the field should be treated as a hexadecimal value
     */
    treatAsHex?: (field: keyof T) => boolean;
    /**
     * @callback isOptional
     * @param {keyof T} field - The field that is being checked if it is optional
     * @param {T} value - The dield value
     * @returns {boolean} Whether the field is optional
     */
    isOptional?: (field: keyof T, value?: T) => boolean;
    /**
     * @callback isDisabled
     * @param {keyof T} field - The field that is being checked if it is disabled
     * @param {T} value - The value of the object being edited
     * @returns {boolean} Whether the field is disabled
     */
    isDisabled?: (field: keyof T, value: T) => boolean;
    /**
     * Validate callback. Checks if field is valid according to the whole values set.
     *
     * @callback isValid
     * @param {keyof T} field - The field that is being checked if it is valid
     * @param {T} value - The value of the object being edited
     * @returns {boolean} Whether the field is valid
     */
    isValid?: (field: keyof T, value: T) => boolean;

    /**
     * @callback getInvalidFields
     * @param {T} value - The value of the object being edited
     * @returns {string[]} The invalid fields
     */
    getInvalidMessages?: (field: keyof T) => string;
    open: boolean;
    children?: ReactNode;
    typeFields?: { [key in keyof T]?: readonly string[] };
    dropdownFields?: { [key in keyof T]?: readonly string[] };
    displayNote?: string;
    mainTitle?: string;
}

/**
 * An EditBox is a generic component that allows editing the properties of an object.
 * The types of the properties are inferred from the object passed as a prop.
 *
 * @component EditBox
 * @param {T} value - The current value of the object being edited
 * @param {boolean} open - Whether the dialog is open
 * @param {onSave} onSave - Called when save button is clicked with updated value
 * @param {onCancel} onCancel - Called when cancel button is clicked
 * @param {onTooltipDisplay} onTooltipDisplay - Returns tooltip text for a given field
 * @param {treatAsHex} [treatAsHex] - Returns whether a field should be treated as a hexadecimal value
 * @param {isOptional} [isOptional] - Returns whether a field is optional
 * @param {isDisabled} [isDisabled] - Returns whether a field is disabled
 * @param {ReactNode} [children] - Optional child elements to render in dialog
 * @param {Object} [typeFields] - Mapping of field names to available type options
 * @param {Object} [dropdownFields] - Mapping of field names to dropdown options
 * @returns {JSX.Element} The EditBox dialog component
 *
 * @example
 * const MyComponent = () => {
 *   const [open, setOpen] = useState(false);
 *   const [data, setData] = useState({
 *     name: '',
 *     type: 'default',
 *     isActive: false
 *   });
 *
 *   return (
 *     <EditBox
 *       value={data}
 *       open={open}
 *       onSave={newData => {
 *         setData(newData);
 *         setOpen(false);
 *       }}
 *       onCancel={() => setOpen(false)}
 *       onTooltipDisplay={field => `Tooltip for ${field}`}
 *       isOptional={field => field !== 'name'}
 *       isDisabled={(field, value) => false}
 *       typeFields={{
 *         type: ['default', 'custom', 'advanced'] as const
 *       }}
 *       dropdownFields={{
 *         type: ['default', 'custom', 'advanced'] as const
 *       }}
 *       treatAsHex={field => field === 'id'}
 *       mainTitle="Edit User Data"
 *       displayNote="Please fill all required fields marked with *"
 *     >
 *       <TextField
 *         label="Description"
 *         multiline
 *         value={data.description || ''}
 *         onChange={e => setData({...data, description: e.target.value})}
 *       />
 *     </EditBox>
 *   );
 * };
 */
const EditBox = <T,>({
    value,
    open,
    onSave,
    onCancel,
    onTooltipDisplay,
    treatAsHex,
    isOptional = () => false,
    isDisabled = () => false,
    isValid = () => true,
    getInvalidMessages = () => '',
    children,
    typeFields = {},
    dropdownFields = {},
    displayNote = 'Fields marked with * are mandatory to be filled. ',
    mainTitle = 'Edit the details here.',
}: EditBoxProps<T>) => {
    const [localValue, setLocalValue] = useState<T>(value);
    const [mandatoryCheckWarningOpen, mandatoryCheckWarningOpenSet] =
        React.useState(false);
    const [validationWarningOpen, validationWarningOpenSet] =
        React.useState(false);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = useCallback(
        (field: keyof T, fieldValue: any): void => {
            if (
                JSON.stringify(fieldValue) !== JSON.stringify(localValue[field])
            ) {
                if (treatAsHex && treatAsHex(field as keyof T)) {
                    fieldValue = new HexString(fieldValue);
                }
                setLocalValue(prev => ({
                    ...prev,
                    [field]: fieldValue,
                }));
            }
        },
        [treatAsHex, localValue]
    );

    const allMandatoryFieldsFilledIn = () =>
        Object.entries(localValue as object).every(
            ([key, val]) =>
                isOptional(key as keyof T) ||
                (val !== null && val !== undefined && val !== '')
        );

    const allChecksPassed = () =>
        Object.entries(localValue as object).every(([key]) =>
            isValid(key as keyof T, localValue)
        );

    const renderField = (field: keyof T) => {
        const val = localValue[field];
        const dropdownOptions = dropdownFields[field];
        const isHexField = treatAsHex && treatAsHex(field as keyof T);

        if (typeof val === 'boolean') {
            return null;
        }

        if (field in typeFields && typeFields[field]) {
            return (
                <TypeField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={val as string}
                    availableTypes={typeFields[field] as string[]}
                    required={!isOptional(field, localValue)}
                    disabled={isDisabled(field, localValue)}
                    tooltip={onTooltipDisplay(field)}
                    onChange={(v: string) => handleChange(field, v)}
                />
            );
        }

        if (dropdownOptions) {
            return (
                <DropdownField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={val as string}
                    options={dropdownOptions}
                    required={!isOptional(field)}
                    disabled={isDisabled(field, localValue)}
                    tooltip={onTooltipDisplay(field)}
                    onChange={(v: string) => handleChange(field, v)}
                />
            );
        }

        return (
            <TextInputField
                key={String(field)}
                field={camelCaseToTitle(String(field))}
                value={val as string | number | HexString}
                required={!isOptional(field)}
                disabled={isDisabled(field, localValue)}
                tooltip={onTooltipDisplay(field)}
                onChange={(v: string | HexString) => handleChange(field, v)}
                treatAsHex={isHexField}
            />
        );
    };

    const renderBooleanFields = () => {
        const booleanFields = Object.entries(localValue as object)
            .filter(([, val]) => typeof val === 'boolean')
            .map(([field]) => field as keyof T);

        if (booleanFields.length === 0) {
            return null;
        }

        return (
            <Box className="booleanFieldsGrid">
                <Grid2 container spacing={2}>
                    {booleanFields.map(field => (
                        <Grid2 key={String(field)}>
                            <BooleanField
                                key={String(field)}
                                field={camelCaseToTitle(String(field))}
                                value={localValue[field] as boolean}
                                required={!isOptional(field)}
                                disabled={isDisabled(field, localValue)}
                                tooltip={onTooltipDisplay(field)}
                                onChange={(v: boolean) =>
                                    handleChange(field, v)
                                }
                            />
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        );
    };

    return (
        <Dialog
            isVisible={open}
            onHide={() => {
                onCancel();
            }}
        >
            <DialogContent>
                <DialogContentText variant="h6">{mainTitle}</DialogContentText>
                <br />
                <DialogContentText variant="body2">
                    {displayNote}
                </DialogContentText>
                <br />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 2,
                        minWidth: 500,
                    }}
                >
                    {Object.keys(value as object).map(field =>
                        renderField(field as keyof T)
                    )}
                    {renderBooleanFields()}
                    {children}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="secondary" size="xl" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="xl"
                    onClick={() => {
                        if (!allMandatoryFieldsFilledIn()) {
                            mandatoryCheckWarningOpenSet(true);
                            return;
                        }
                        if (!allChecksPassed()) {
                            validationWarningOpenSet(true);
                            return;
                        }

                        onSave(localValue);
                    }}
                >
                    Save
                </Button>
                <InfoDialog
                    isVisible={mandatoryCheckWarningOpen}
                    onHide={() => mandatoryCheckWarningOpenSet(false)}
                    title="Not all mandatory fields are filled in"
                >
                    You have not filled in all mandatory fields. Please fill in
                    all fields marked with * before saving.
                </InfoDialog>
                <InfoDialog
                    isVisible={validationWarningOpen}
                    onHide={() => validationWarningOpenSet(false)}
                    title="Not all fields are valid"
                >
                    You have not filled in all fields correctly. Please fix the
                    following validation errors before saving:
                    <ul>
                        {Object.entries(localValue as object)
                            .filter(
                                ([key]) => !isValid(key as keyof T, localValue)
                            )
                            .map(([key]) => (
                                <li key={key}>
                                    {camelCaseToTitle(String(key))} -{' '}
                                    {getInvalidMessages(key as keyof T)}
                                </li>
                            ))}
                    </ul>
                </InfoDialog>
            </DialogActions>
        </Dialog>
    );
};

export default EditBox;
