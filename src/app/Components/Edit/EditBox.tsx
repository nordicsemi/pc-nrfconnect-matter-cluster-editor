/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { Box, Grid2 } from '@mui/material';
import {
    Button,
    Dialog,
    ErrorDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { ListItemError } from '../../../common/List';
import { HexString } from '../../defines';
import { camelCaseToTitle } from '../Utils';
import BooleanField from './BooleanField';
import DropdownField from './DropdownField';
import InnerElementEdit, { InnerElementEditProps } from './InnerElementEdit';
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
     * @returns {isValid: boolean, invalidMessages: string[]} Whether the field is valid and the invalid messages
     */
    isValid?: (
        field: keyof T,
        value: T
    ) => { isValid: boolean; invalidMessages: string[] };
    /**
     * @callback automateActions
     * @param {keyof T} field - The field that was changed
     * @param {T} value - The updated value object
     * @returns {Partial<T> | void} Optional partial object with automated field updates
     */
    automateActions?: (field: keyof T, value: T) => Partial<T> | void;
    open: boolean;
    children?: ReactNode;
    typeFields?: { [key in keyof T]?: readonly string[] };
    dropdownFields?: { [key in keyof T]?: readonly string[] };
    displayNote?: string;
    mainTitle?: string;
    defaultPrototype: T;
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
    isValid = () => ({ isValid: true, invalidMessages: [] }),
    automateActions,
    children,
    typeFields = {},
    dropdownFields = {},
    displayNote = 'Fields marked with * are mandatory to be filled. ',
    mainTitle = 'Edit the details here.',
    defaultPrototype,
}: EditBoxProps<T>) => {
    const [localValue, setLocalValue] = useState<T>(value);
    const [mandatoryCheckWarningOpen, mandatoryCheckWarningOpenSet] =
        React.useState(false);
    const [validationWarningOpen, validationWarningOpenSet] =
        React.useState(false);
    const [invalidMessages, setInvalidMessages] = React.useState<string[]>([]);
    const [showInnerElementEdit, showInnerElementEditSet] =
        React.useState(false);
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const getAllFieldKeys = (elem: T): (keyof T)[] => {
        const elemKeys = Object.keys(elem as object) as (keyof T)[];
        const protoKeys = Object.keys(
            defaultPrototype as object
        ) as (keyof T)[];
        const merged = new Set<keyof T>([...protoKeys, ...elemKeys]);
        return Array.from(merged);
    };

    const getFieldValue = (elem: T, field: keyof T) => {
        const v = elem[field];
        return v !== undefined ? v : (defaultPrototype as any)[field];
    };

    const handleChange = useCallback(
        (field: keyof T, fieldValue: any): void => {
            if (
                JSON.stringify(fieldValue) !== JSON.stringify(localValue[field])
            ) {
                if (treatAsHex && treatAsHex(field as keyof T)) {
                    fieldValue = new HexString(fieldValue);
                }
                setLocalValue(prev => {
                    const updatedValue = {
                        ...prev,
                        [field]: fieldValue,
                    };

                    // Call automateActions if provided and apply any automated updates
                    if (automateActions) {
                        const automatedUpdates = automateActions(
                            field,
                            updatedValue
                        );
                        if (automatedUpdates) {
                            return {
                                ...updatedValue,
                                ...automatedUpdates,
                            };
                        }
                    }

                    return updatedValue;
                });
            }
        },
        [treatAsHex, localValue, automateActions]
    );

    const allMandatoryFieldsFilledIn = () =>
        Object.entries(localValue as object).every(
            ([key, val]) =>
                isOptional(key as keyof T) ||
                (val !== null && val !== undefined && val !== '')
        );

    const allChecksPassed = () =>
        Object.keys(localValue as object).every(key => {
            const result = isValid(key as keyof T, localValue);
            if (!result.isValid) {
                setInvalidMessages(result.invalidMessages);
                return false;
            }
            return true;
        });

    const renderField = (field: keyof T) => {
        const val = localValue[field];
        const dropdownOptions = dropdownFields[field];
        const isHexField = treatAsHex && treatAsHex(field as keyof T);

        // Check if this field is a boolean in the prototype (to handle string "true"/"false" from XML)
        const prototypeValue = (defaultPrototype as any)[field];
        if (typeof val === 'boolean' || typeof prototypeValue === 'boolean') {
            return null;
        }

        if (field in typeFields && typeFields[field]) {
            return (
                <TypeField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={getFieldValue(localValue, field) as string}
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
                    value={getFieldValue(localValue, field) as string}
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
                value={
                    getFieldValue(localValue, field) as
                        | string
                        | number
                        | HexString
                }
                required={!isOptional(field)}
                disabled={isDisabled(field, localValue)}
                tooltip={onTooltipDisplay(field)}
                onChange={(v: string | HexString) => handleChange(field, v)}
                treatAsHex={isHexField}
            />
        );
    };

    const renderBooleanFields = () => {
        const allKeys = getAllFieldKeys(localValue);
        const booleanFields = allKeys.filter(field => {
            const v = getFieldValue(localValue, field);
            const prototypeValue = (defaultPrototype as any)[field];
            return (
                typeof v === 'boolean' || typeof prototypeValue === 'boolean'
            );
        });

        if (booleanFields.length === 0) {
            return null;
        }

        // Helper function to convert string "true"/"false" to boolean
        const toBooleanValue = (val: any): boolean => {
            if (typeof val === 'boolean') {
                return val;
            }
            if (typeof val === 'string') {
                return val.toLowerCase() === 'true';
            }
            return false;
        };

        return (
            <Box className="booleanFieldsGrid">
                <Grid2 container spacing={2}>
                    {booleanFields.map(field => (
                        <Grid2 key={String(field)}>
                            <BooleanField
                                key={String(field)}
                                field={camelCaseToTitle(String(field))}
                                value={toBooleanValue(
                                    getFieldValue(localValue, field)
                                )}
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

    const isNestedDialogVisible =
        mandatoryCheckWarningOpen ||
        validationWarningOpen ||
        showInnerElementEdit;

    return (
        <>
            <Dialog
                isVisible={open}
                onHide={() => {
                    onCancel();
                }}
                className={
                    isNestedDialogVisible
                        ? 'tw-pointer-events-none tw-opacity-40'
                        : ''
                }
            >
                <Dialog.Header title={mainTitle} />
                <Dialog.Body>
                    <div className="tw-flex tw-flex-col tw-gap-6">
                        <div className="tw-text-sm tw-font-medium">
                            {displayNote}
                        </div>
                        <div className="tw-flex tw-min-w-[500px] tw-flex-col tw-justify-center tw-gap-4">
                            {getAllFieldKeys(localValue).map(field =>
                                renderField(field as keyof T)
                            )}
                            {renderBooleanFields()}
                            {React.Children.map(children, child => {
                                // Recursively process children to find and inject callbacks into InnerElementEdit
                                const processChild = (
                                    childElement: ReactNode
                                ): ReactNode => {
                                    if (!React.isValidElement(childElement)) {
                                        return childElement;
                                    }

                                    // Check if this is InnerElementEdit
                                    if (
                                        childElement.type === InnerElementEdit
                                    ) {
                                        return React.cloneElement(
                                            childElement as React.ReactElement<
                                                InnerElementEditProps<T>
                                            >,
                                            {
                                                notifyStateChange: (
                                                    state: boolean
                                                ) => {
                                                    showInnerElementEditSet(
                                                        state
                                                    );
                                                },
                                            }
                                        );
                                    }

                                    // If not InnerElementEdit, recursively process its children
                                    if (childElement.props?.children) {
                                        const processedChildren =
                                            React.Children.map(
                                                childElement.props.children,
                                                processChild
                                            );

                                        // If there's only one child, pass it directly instead of as an array
                                        // This prevents issues with components that expect a single ReactElement
                                        const childrenToPass =
                                            React.Children.count(
                                                childElement.props.children
                                            ) === 1
                                                ? processedChildren?.[0]
                                                : processedChildren;

                                        return React.cloneElement(
                                            childElement as React.ReactElement<any>,
                                            {},
                                            childrenToPass
                                        );
                                    }

                                    return childElement;
                                };

                                return processChild(child);
                            })}
                        </div>
                    </div>
                </Dialog.Body>
                <Dialog.Footer>
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
                    <Button variant="secondary" size="xl" onClick={onCancel}>
                        Cancel
                    </Button>
                </Dialog.Footer>
            </Dialog>
            <ErrorDialog
                isVisible={mandatoryCheckWarningOpen}
                onHide={() => mandatoryCheckWarningOpenSet(false)}
                title="Not all mandatory fields are filled in"
            >
                You have not filled in all mandatory fields. Please fill in all
                fields marked with * before saving.
            </ErrorDialog>
            <ErrorDialog
                isVisible={validationWarningOpen}
                onHide={() => validationWarningOpenSet(false)}
                title="Not all fields are valid"
            >
                <div className="tw-flex tw-flex-col tw-gap-8 tw-text-sm tw-font-medium">
                    <div>
                        You have not filled in all fields correctly. Please fix
                        the following validation errors before saving:
                    </div>
                    <div
                        className={`tw-flex tw-flex-col tw-gap-2 ${
                            invalidMessages.length > 4
                                ? 'scrollbar tw-max-h-64 tw-overflow-y-auto'
                                : ''
                        }`}
                    >
                        {invalidMessages.map(message => (
                            <ListItemError key={message} item={message} />
                        ))}
                    </div>
                </div>
            </ErrorDialog>
        </>
    );
};

export default EditBox;
