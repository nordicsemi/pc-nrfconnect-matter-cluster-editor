/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';

import EditBox from '../Components/Edit/EditBox';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import { EditRowWrapper } from '../Components/TableRow';
import {
    defaultXMLClusterCode,
    defaultXMLEnum,
    defaultXMLEnumItem,
} from '../defaults';
import { XMLClusterCode, XMLEnum, XMLEnumItem } from '../defines';
import {
    getTypeSize,
    isTypeComposite,
    isTypeCustom,
    loadMatterTypes,
} from '../matterTypes';

type EnumType = XMLEnum['$'];
type EnumItemType = XMLEnumItem['$'];
type EnumClusterType = XMLClusterCode['$'];

/**
 * Implementation of EditBox component dedicated to XMLEnum.
 *
 * The EnumEdit component provides an interface for users to create and modify Matter enumeration
 * definitions within the Matter Manufacturer Cluster Editor application. It allows users to:
 * - Define the enum name and underlying data type
 * - Add, edit, and remove enum items (name-value pairs)
 * - Associate the enum with specific clusters by their codes
 *
 * This component is part of the editing workflow in the application:
 * - EnumsTable component renders a table of enumerations
 * - When a user clicks "Edit" or "Add" in the EnumsTable, this component is displayed
 * - User can modify enum properties or create new enums
 * - Changes are saved back to the XML representation
 *
 * Component hierarchy:
 * - Used by the Component generic in EnumsTable via the editBox prop
 * - Uses EditBox as its container component to provide the editing form
 * - Uses InnerElementEdit to handle nested element editing for items and cluster assignments
 * - Integrates with available Matter data types from matterTypes.ts
 *
 * In the Matter specification, enumerations define named constants that represent discrete values,
 * which improves code readability and maintainability throughout the protocol.
 *
 * @param {Object} props - The input props for the component.
 * @param {XMLEnum} props.element - The XMLEnum data to be edited.
 * @param {Function} props.onSave - Callback function to handle saving the enum changes.
 * @param {Function} props.onCancel - Callback function to handle canceling the edit.
 * @param {boolean} props.open - Boolean flag to indicate whether the edit box is open or not.
 *
 * @returns {JSX.Element} The rendered EnumEdit component.
 */
const EnumEdit: React.FC<EditRowWrapper<XMLEnum>> = ({
    element: enumData,
    onSave,
    onCancel,
    open,
}) => {
    const [localEnum, setLocalEnum] = useState<XMLEnum>(enumData);

    // Load types only once when component mounts
    const availableTypes = useMemo(
        () => loadMatterTypes().map(type => type.name),
        []
    );

    useEffect(() => {
        setLocalEnum(enumData);
    }, [enumData]);

    const handleValueChange = useCallback(
        (value: EnumType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localEnum.$)) {
                setLocalEnum(prev => {
                    const updatedEnum = {
                        ...prev,
                        $: value,
                    };
                    setTimeout(() => {
                        onSave(updatedEnum);
                    }, 0);
                    return updatedEnum;
                });
            } else {
                onSave(localEnum);
            }
        },
        [localEnum, onSave]
    );

    const handleItemChange = useCallback((value: EnumItemType[]): void => {
        setLocalEnum(prev => ({
            ...prev,
            item: value.map(newItem => ({ $: newItem })),
        }));
    }, []);

    const handleClusterChange = useCallback(
        (value: EnumClusterType[]): void => {
            setLocalEnum(prev => ({
                ...prev,
                cluster: value.map(newCluster => ({ $: newCluster })),
            }));
        },
        []
    );

    const handleItemTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the item. It shall be unique within the enum.',
            value: 'The value assigned to the item, which must match the specified data type of the enumerated type.',
        };
        return tooltips[field] || '';
    };

    const handleAssignedClustersTooltip = (field: string) => {
        if (field === 'code') {
            return 'The code of the cluster that the enum is associated with. It shall be empty if enum is global and not applicable to a specific cluster.';
        }
        return '';
    };

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the enum. It shall be unique within the cluster.',
            type: 'The data type of the attribute. The valid values are listed in the src/app/zap-templates/zcl/data-model/chip/chip-types.xml file, relative to the Matter project root directory.',
            array: "The flag indicating if the enum value is an array. The valid values are 'true' and 'false'. If the enum value is an array, the storage type is fixed to 'External'. It means that the Enum value will not be generated automatically, and you will need to provide a custom implementation of the enum.",
        };
        return tooltips[field] || '';
    };

    const handleOptionalField = (field: string) => {
        if (field === 'array') {
            return true;
        }
        return false;
    };

    const handleFieldIsValid = (field: string, items: EnumType) => {
        const invalidMessages: string[] = [];
        if (field === 'length') {
            // Check for array type
            if (
                (Object.keys(items).includes('array') &&
                    (items.array === true || String(items.array) === 'true')) ||
                (Object.keys(items).includes('type') &&
                    items.type &&
                    isTypeComposite(items.type))
            ) {
                if (
                    items.length === undefined ||
                    items.length === null ||
                    items.length <= 0
                ) {
                    invalidMessages.push('The length of the enum is required.');
                }
            }
        }
        return {
            isValid: invalidMessages.length === 0,
            invalidMessages,
        };
    };

    const handleFieldDisabled = (field: string, items: EnumType) => {
        // Enable all fields for custom types
        if (
            Object.keys(items).includes('type') &&
            items.type &&
            isTypeCustom(items.type)
        ) {
            return false;
        }

        if (field === 'length') {
            if (items.array === true || String(items.array) === 'true') {
                return false;
            }
            // Enable length field for composite types
            if (
                Object.keys(items).includes('type') &&
                items.type &&
                isTypeComposite(items.type)
            ) {
                return false;
            }
            return true;
        }
        return false;
    };

    const handleAutomateActions = useCallback(
        (field: keyof EnumType, value: EnumType) => {
            if (field === 'type' && value.type) {
                // Auto-set array flag for array type
                if (value.type === 'array') {
                    return { array: true };
                }
                if (isTypeComposite(value.type)) {
                    const size = getTypeSize(value.type);
                    if (size !== undefined) {
                        return { length: size };
                    }
                    return { length: 0 };
                }
                return undefined;
            }
            return undefined;
        },
        []
    );

    return (
        <EditBox<EnumType>
            value={localEnum.$}
            open={open}
            onSave={newValue => {
                handleValueChange(newValue);
            }}
            onTooltipDisplay={field => handleFieldTooltip(field)}
            isOptional={handleOptionalField}
            isDisabled={handleFieldDisabled}
            isValid={handleFieldIsValid}
            onCancel={onCancel}
            automateActions={handleAutomateActions}
            typeFields={{
                type: availableTypes,
            }}
            defaultPrototype={defaultXMLEnum.$}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <InnerElementEdit
                    buttonLabel="Items"
                    listOfElements={
                        (localEnum.item || []).map(
                            arg => arg.$
                        ) as EnumItemType[]
                    }
                    onSave={handleItemChange}
                    onTooltipDisplay={handleItemTooltip}
                    isOptional={() => false}
                    defaultPrototype={defaultXMLEnumItem.$}
                />

                <InnerElementEdit
                    buttonLabel="Assigned clusters"
                    listOfElements={
                        localEnum.cluster.map(
                            access => access.$
                        ) as EnumClusterType[]
                    }
                    onSave={handleClusterChange}
                    onTooltipDisplay={handleAssignedClustersTooltip}
                    isOptional={() => false}
                    defaultPrototype={defaultXMLClusterCode.$}
                    treatAsHex={(field: keyof EnumClusterType) =>
                        field === 'code'
                    }
                />
            </Box>
        </EditBox>
    );
};

export default EnumEdit;
