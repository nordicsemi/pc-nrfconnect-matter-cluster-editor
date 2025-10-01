/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    DialogActions,
    DialogContent,
    DialogContentText,
    Grid2,
    IconButton,
    List,
    ListItem,
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
import InnerButton from './InnerButton';
import TextInputField from './TextInputField';
import TypeField from './TypeField';

import '../../../../resources/css/component.scss';

/**
 * @template T - The type of the object being edited.
 */

// Define the props that will be passed to children
export interface InnerElementChildProps<T> {
    element: T;
    elementIndex: number;
    /**
     * A callback function to update the element.
     *
     * @callback onElementChange
     * @param {keyof T} field - The field that changed
     * @param {any} value - The new value of the field
     */
    onElementChange: (field: keyof T, value: any) => void;
}

interface InnerElementEditProps<T> {
    buttonLabel: string;
    listOfElements: T[];
    /**
     * A callback function to close the dialog.
     *
     * @callback onClose
     * @returns {void}
     */
    onClose?: () => void;
    /**
     * A callback function to save the elements.
     *
     * @callback onSave
     * @param {T[]} elements - The updated list of elements
     * @returns {void}
     */
    onSave: (elements: T[]) => void;
    buttonTooltip?: string;
    /**
     * A callback function to display the tooltip text for a given field.
     *
     * @callback onTooltipDisplay
     * @param {keyof T} field - The field that the tooltip is being displayed for
     * @returns {string} The tooltip text
     */
    onTooltipDisplay: (field: keyof T) => string;
    /**
     * A callback function to determine if a field should be treated as a hexadecimal value.
     *
     * @callback treatAsHex
     * @param {keyof T} field - The field that is being checked if it should be treated as a hexadecimal value
     * @returns {boolean} Whether the field should be treated as a hexadecimal value
     */
    treatAsHex?: (field: keyof T) => boolean;
    /**
     * A callback function to determine if a field is optional.
     *
     * @callback isOptional
     * @param {keyof T} field - The field that is being checked if it is optional
     */
    isOptional?: (field: keyof T) => boolean;
    /**
     * A callback function to determine if a field should be disabled.
     *
     * @callback isDisabled
     * @param {keyof T} field - The field that is being checked if it should be disabled
     * @param {T} value - The value of the field
     * @returns {boolean} Whether the field should be disabled
     */
    isDisabled?: (field: keyof T, value: T) => boolean;
    defaultPrototype: T;
    typeFields?: {
        [K in keyof T]?: readonly string[];
    };
    dropdownFields?: {
        [K in keyof T]?: readonly string[];
    };
    children?: React.ReactElement<InnerElementChildProps<T>>[];
}

/**
 * The inner element edit component is used to visualize and edit the list of elements provided as an array input.
 * It creates a new dialog window with a table of elements, where each element can be edited separately.
 * The window contains three buttons: close, save and add new element.
 *
 * You can provide an empty array as an argument which will be returned in the onSave callback after the creation
 * and clicking the save button.
 * To use this component and show the dialog window you need to manage the open state externally.
 *
 * The react node iterates through the list of elements, reads each field type and creates an editable field for each
 * of them.
 *
 * This component doesn't have any information about the structure of the elements, especially if their fields are
 * nested or optional. Due to that you need to provide a default prototype of the elements to be created when the user
 * clicks the add new elements button. The prototype should be an object with the same fields as the elements in the list.
 *
 * You can provide children components that can use element and index of the element as props.
 *
 * This code allows you to edit the array of elements that is called requireAttribute.
 * The requireAttribute must be defined in the default prototype.
 *
 * The inner element edit manages the open state of the dialog window internally.
 *
 * @component InnerElementEdit
 * @param {string} buttonLabel - Label text for the button that opens the dialog
 * @param {T[]} listOfElements - An input list of elements to be visualized and edited in the dialog window
 * @param {onClose} [onClose] - Optional callback function when close button is clicked
 * @param {onSave} onSave - Callback function when save button is clicked. Returns updated list of elements
 * @param {string} buttonTooltip - Tooltip text for the button that opens the dialog
 * @param {onTooltipDisplay} onTooltipDisplay - Callback function that returns tooltip text for a given field
 * @param {treatAsHex} [treatAsHex] - Optional callback function that determines if a field should be treated as a hexadecimal value
 * @param {isOptional} [isOptional] - Optional callback function that determines if a field is optional
 * @param {isDisabled} [isDisabled] - Optional callback function that determines if a field should be disabled
 * @param {T} defaultPrototype - Default element prototype used when adding new elements
 * @param {Object} [typeFields] - Optional mapping of field names to available type options
 * @param {Object} [dropdownFields] - Optional mapping of field names to dropdown options
 * @param {React.ReactElement[]} [children] - Optional child components
 * @returns {JSX.Element} Dialog window component for editing list of elements
 *
 * @example
 * import InnerElementEdit from './Components/Edit/InnerElementEdit';
 *
 * const ExampleComponent = () => {
 *     const [elements, setElements] = useState<Element[]>([]);
 *     const defaultElement = { id: '', name: '', type: 'default', isEnabled: false };
 *
 *     const handleTooltip = (field: keyof Element) => {
 *         const tooltips = {
 *             id: 'Unique identifier for the element',
 *             name: 'Display name of the element',
 *             type: 'Element type classification',
 *             isEnabled: 'Whether this element is active'
 *         };
 *         return tooltips[field] || '';
 *     };
 *
 *     const isFieldOptional = (field: keyof Element) => field !== 'id' && field !== 'name';
 *
 *     return (
 *         <InnerElementEdit
 *             buttonLabel="Edit Elements"
 *             listOfElements={elements}
 *             onSave={setElements}
 *             buttonTooltip="Click to edit the list of elements"
 *             onTooltipDisplay={handleTooltip}
 *             isOptional={isFieldOptional}
 *             defaultPrototype={defaultElement}
 *             dropdownFields={{ type: ['default', 'special', 'custom'] }}
 *         />
 *     );
 * };
 */
const InnerElementEdit = <T,>({
    buttonLabel,
    listOfElements: elements,
    onClose,
    onSave,
    buttonTooltip,
    onTooltipDisplay,
    isOptional,
    isDisabled,
    defaultPrototype,
    dropdownFields,
    typeFields,
    children,
    treatAsHex,
}: InnerElementEditProps<T>) => {
    const [internalList, setInternalList] = useState<T[]>(elements);
    const [showInnerElementEdit, setShowInnerElementEdit] =
        useState<boolean>(false);
    const [mandatoryCheckWarningOpen, setMandatoryCheckWarningOpen] =
        useState<boolean>(false);
    const [currentLength, setCurrentLength] = useState<number>(elements.length);

    useEffect(() => {
        setInternalList(elements);
        setCurrentLength(elements.length);
    }, [elements]);

    const handleAddInnerElement = () => {
        setInternalList([...internalList, defaultPrototype]);
    };

    const handleDeleteInnerElement = (index: number) =>
        setInternalList(internalList.filter((_, i) => i !== index));

    const allMandatoryFieldsFilledIn = () =>
        internalList.every(element =>
            Object.entries(element as object).every(
                ([key, val]) =>
                    isOptional?.(key as keyof T) ||
                    (val !== null && val !== undefined && val !== '')
            )
        );

    const handleFieldChange = (index: number, field: keyof T, value: any) => {
        const updatedElementList = [...internalList];
        if (treatAsHex && treatAsHex(field as keyof T)) {
            value = new HexString(value);
        }
        if (updatedElementList[index][field] !== value) {
            updatedElementList[index] = {
                ...updatedElementList[index],
                [field]: value,
            };
        }
        setInternalList(updatedElementList);
    };

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

    const renderField = (elem: T, field: keyof T, index: number) => {
        const value = getFieldValue(elem, field);

        if (typeof value === 'boolean') {
            return null;
        }

        if (typeFields && field in typeFields && typeFields[field]) {
            return (
                <TypeField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={value as string}
                    availableTypes={typeFields[field] as string[]}
                    required={!isOptional?.(field)}
                    disabled={isDisabled?.(field, elem) ?? false}
                    tooltip={onTooltipDisplay(field)}
                    onChange={v => handleFieldChange(index, field, v)}
                />
            );
        }

        if (dropdownFields?.[field]) {
            return (
                <DropdownField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={value as string}
                    options={dropdownFields[field] as readonly string[]}
                    required={!isOptional?.(field)}
                    disabled={isDisabled?.(field, elem) ?? false}
                    tooltip={onTooltipDisplay(field)}
                    onChange={v => handleFieldChange(index, field, v)}
                />
            );
        }

        if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            value instanceof HexString
        ) {
            return (
                <TextInputField
                    key={String(field)}
                    field={camelCaseToTitle(String(field))}
                    value={
                        value instanceof HexString
                            ? value.toString()
                            : (value as string)
                    }
                    required={!isOptional?.(field)}
                    disabled={isDisabled?.(field, elem) ?? false}
                    tooltip={onTooltipDisplay(field)}
                    onChange={v => handleFieldChange(index, field, v)}
                    fullWidth
                />
            );
        }

        return null;
    };

    const renderBooleanFields = (elem: T, index: number) => {
        const allKeys = getAllFieldKeys(elem);
        const booleanFields = allKeys.filter(field => {
            const v = getFieldValue(elem, field);
            return typeof v === 'boolean';
        });

        if (booleanFields.length === 0) {
            return null;
        }

        return (
            <Box className="booleanFieldsGrid">
                <Grid2 container spacing={1}>
                    {booleanFields.map(field => (
                        <Grid2 key={String(field)}>
                            <BooleanField
                                field={camelCaseToTitle(String(field))}
                                value={getFieldValue(elem, field) as boolean}
                                required={!isOptional?.(field)}
                                disabled={isDisabled?.(field, elem) ?? false}
                                tooltip={onTooltipDisplay(field)}
                                onChange={v =>
                                    handleFieldChange(index, field, v)
                                }
                            />
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        );
    };

    return (
        <>
            <InnerButton
                label={buttonLabel}
                badgeContent={currentLength}
                onClick={() => {
                    setInternalList(elements);
                    setCurrentLength(elements.length);
                    setShowInnerElementEdit(true);
                }}
                tooltip={buttonTooltip}
            />

            <Dialog
                isVisible={showInnerElementEdit}
                onHide={() => {
                    setShowInnerElementEdit(false);
                    onClose?.();
                }}
            >
                <DialogContent>
                    <DialogContentText variant="body2">
                        Fields marked with * are mandatory to be filled.
                    </DialogContentText>
                    <br />

                    <IconButton color="primary" onClick={handleAddInnerElement}>
                        <AddIcon />
                    </IconButton>
                    <List>
                        {internalList.map((elem, index) => (
                            <ListItem key={index} className="innerListItem">
                                {getAllFieldKeys(elem).map(field =>
                                    renderField(elem, field as keyof T, index)
                                )}
                                {renderBooleanFields(elem, index)}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 5,
                                    }}
                                >
                                    {React.Children.map(children, child =>
                                        React.isValidElement(child)
                                            ? React.cloneElement(child, {
                                                  element: elem,
                                                  elementIndex: index,
                                                  onElementChange: (
                                                      field: keyof T,
                                                      value: any
                                                  ) =>
                                                      handleFieldChange(
                                                          index,
                                                          field,
                                                          value
                                                      ),
                                              })
                                            : child
                                    )}
                                </Box>
                                <div className="innerDeleteButton">
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() =>
                                            handleDeleteInnerElement(index)
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </div>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setShowInnerElementEdit(false);
                            onClose?.();
                        }}
                        variant="secondary"
                        size="xl"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            if (!allMandatoryFieldsFilledIn()) {
                                setMandatoryCheckWarningOpen(true);
                                return;
                            }

                            setShowInnerElementEdit(false);
                            setCurrentLength(internalList.length);
                            onSave(internalList);
                        }}
                        variant="primary"
                        size="xl"
                    >
                        Save
                    </Button>
                    <InfoDialog
                        isVisible={mandatoryCheckWarningOpen}
                        onHide={() => setMandatoryCheckWarningOpen(false)}
                        title="Not all mandatory fields are filled in"
                    >
                        You have not filled in all mandatory fields. Please fill
                        in all fields marked with * before saving.
                    </InfoDialog>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default InnerElementEdit;
