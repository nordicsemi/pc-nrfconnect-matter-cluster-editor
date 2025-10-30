/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/material';

import EditBox from '../Components/Edit/EditBox';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import { EditRowWrapper } from '../Components/TableRow';
import { defaultXMLClusterCode, defaultXMLStructItem } from '../defaults';
import { XMLClusterCode, XMLStruct, XMLStructItem } from '../defines';
import { globalMatterTypes, isTypeNumeric } from '../matterTypes';

type StructType = XMLStruct['$'];
type StructItemType = XMLStructItem['$'];
type StructClusterType = XMLClusterCode['$'];

/**
 * Implementation of EditBox component dedicated to XMLStruct.
 *
 * The StructEdit component provides an interface for users to create and modify Matter structure
 * definitions within the Matter Manufacturer Cluster Editor application. It allows users to:
 * - Define the structure name and fabric scoping properties
 * - Add, edit, and remove structure fields (items) with their data types and constraints
 * - Associate the structure with specific clusters by their codes
 *
 * This component is part of the editing workflow in the application:
 * - StructTable component renders a table of structure definitions
 * - When a user clicks "Edit" or "Add" in the StructTable, this component is displayed
 * - User can modify structure properties or create new structures
 * - Changes are saved back to the XML representation
 *
 * Component hierarchy:
 * - Used by the Component generic in StructTable via the editBox prop
 * - Uses EditBox as its container component to provide the editing form
 * - Uses InnerElementEdit to handle nested element editing for items and cluster assignments
 * - Integrates with available Matter data types from matterTypes.ts
 *
 * In the Matter specification, structures define complex data types that group multiple fields
 * together, enabling the representation of complex data models throughout the protocol. This
 * component provides the primary interface for defining and customizing these structures.
 *
 * @component
 * @callback callback
 * @param {Object} props - The input props for the component.
 * @param {XMLStruct} props.element - The XMLStruct object to be edited.
 * @param {callback} props.onSave - Callback function to handle saving the structure changes.
 * @param {callback} props.onCancel - Callback function to handle canceling the edit.
 * @param {boolean} props.open - Boolean flag to indicate if the edit box is open.
 *
 * @returns {JSX.Element} The rendered StructEdit component.
 */
const StructEdit: React.FC<EditRowWrapper<XMLStruct>> = ({
    element: structData,
    onSave,
    onCancel,
    open,
}) => {
    const [localStruct, setStructData] = useState<XMLStruct>(structData);

    useEffect(() => {
        setStructData(structData);
    }, [structData]);

    const handleValueChange = useCallback(
        (value: StructType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localStruct.$)) {
                setStructData(prev => {
                    const updatedStruct = {
                        ...prev,
                        $: value,
                    };
                    setTimeout(() => {
                        onSave(updatedStruct);
                    }, 0);
                    return updatedStruct;
                });
            } else {
                onSave(localStruct);
            }
        },
        [localStruct, onSave]
    );

    const handleItemChange = useCallback((value: StructItemType[]): void => {
        setStructData(prev => ({
            ...prev,
            item: value.map(newItem => ({ $: newItem })),
        }));
    }, []);

    const handleClusterChange = useCallback(
        (value: StructClusterType[]): void => {
            setStructData(prev => ({
                ...prev,
                cluster: value.map(newCluster => ({ $: newCluster })),
            }));
        },
        []
    );

    const handleItemTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the item. It shall be unique within the structure.',
            fieldId:
                'The numeric identifier of the item. It shall be unique within the structure.',
            type: 'The data type of the item. The valid values are listed in the src/app/zap-templates/zcl/data-model/chip/chip-types.xml file, relative to the Matter project root directory.',
            length: "The length of the item in bytes. This value applies only to the 'array' data type. It shall be greater than the 'minLength' value.",
            minLength:
                "The minimum allowed length of the item in bytes. This value applies only to the 'array' data type.",
            min: "The minimum allowed value of the item. This value applies only to the numeric data types. The minimum value shall be smaller than 'max' value and fit in the numeric type bounds.",
            max: "The maximum allowed value of the item. This value applies only to the numeric data types. The maximum value shall be greater than 'min' value and fit in the numeric type bounds.",
            isNullable:
                "The flag indicating if the item can be set to NULL. The valid values are 'true' and 'false'.",
            isFabricSensitive:
                "The flag indicating if the item is fabric sensitive, which means it can be treated differently depending on the specific fabric. The valid values are 'true' and 'false'.",
            array: "The flag indicating if the item is an array. If it is set to 'true', the type field represents the type of the array elements.",
        };
        return tooltips[field] || '';
    };

    const handleAssignedClustersTooltip = (field: string) => {
        if (field === 'code') {
            return 'The code of the cluster that the struct is associated with. It shall be empty if structure is global and not applicable to a specific cluster.';
        }
        return '';
    };

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the structure. It shall be unique within the cluster.',
            isFabricScoped:
                "The flag that indicates if the structure is fabric scoped. The valid values are 'true' and 'false'.",
        };
        return tooltips[field] || '';
    };

    const handleOptionalField = (field: string) => {
        if (field === 'name') {
            return false;
        }
        return true;
    };

    const handleOptionalItem = (field: string) => {
        if (field === 'fieldId' || field === 'name' || field === 'type') {
            return false;
        }
        return true;
    };

    const handleFieldDisabled = (field: string, items: StructItemType) => {
        if (field === 'length' || field === 'minLength') {
            if (items.array === true || String(items.array) === 'true') {
                return false;
            }
            return true;
        }
        if (field === 'min' || field === 'max') {
            if (
                Object.keys(items).includes('type') &&
                isTypeNumeric(items.type)
            ) {
                return false;
            }
            return true;
        }
        return false;
    };

    return (
        <EditBox<StructType>
            value={localStruct.$}
            open={open}
            onSave={newValue => {
                handleValueChange(newValue);
            }}
            onCancel={onCancel}
            onTooltipDisplay={handleFieldTooltip}
            isOptional={handleOptionalField}
            isDisabled={() => false}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <InnerElementEdit
                    buttonLabel="Items"
                    listOfElements={
                        (localStruct.item || []).map(
                            arg => arg.$
                        ) as StructItemType[]
                    }
                    onSave={handleItemChange}
                    onTooltipDisplay={handleItemTooltip}
                    isOptional={handleOptionalItem}
                    defaultPrototype={defaultXMLStructItem.$}
                    isDisabled={handleFieldDisabled}
                    treatAsHex={(field: keyof StructItemType) =>
                        field === 'fieldId'
                    }
                    typeFields={{
                        type: globalMatterTypes,
                    }}
                />

                <InnerElementEdit
                    buttonLabel="Assigned clusters"
                    listOfElements={
                        localStruct.cluster.map(
                            access => access.$
                        ) as StructClusterType[]
                    }
                    onSave={handleClusterChange}
                    onTooltipDisplay={handleAssignedClustersTooltip}
                    isOptional={() => false}
                    defaultPrototype={defaultXMLClusterCode.$}
                    treatAsHex={(field: keyof StructClusterType) =>
                        field === 'code'
                    }
                />
            </Box>
        </EditBox>
    );
};

export default StructEdit;
