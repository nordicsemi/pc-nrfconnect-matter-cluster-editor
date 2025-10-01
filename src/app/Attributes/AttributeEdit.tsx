/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';

import EditBox from '../Components/Edit/EditBox';
import InnerElementEdit from '../Components/Edit/InnerElementEdit';
import { EditRowWrapper } from '../Components/TableRow';
import { defaultXMLClusterAccess } from '../defaults';
import { XMLAttribute, XMLClusterAccess } from '../defines';
import {
    accessOptions,
    apiMaturityOptions,
    clientServerOptions,
    globalMatterTypes,
    roleOptions,
} from '../matterTypes';

type AttributeValuesType = XMLAttribute['$'];
type AccessType = XMLClusterAccess['$'];

/**
 * Implementation of EditBox component dedicated to XMLAttribute.
 *
 * The AttributeEdit component provides an interface for users to create and modify Matter attributes
 * within the Matter Manufacturer Cluster Editor application. It renders form fields for all attribute
 * properties defined in the Matter specification, including access privileges, data types, and flags.
 *
 * This component is part of the editing workflow in the application:
 * - AttributesTable component renders a table of attributes
 * - When a user clicks "Edit" or "Add" in the AttributesTable, this component is displayed
 * - User can modify attribute properties or create new attributes
 * - Changes are saved back to the XML representation for the cluster
 *
 * Component hierarchy:
 * - Used by the Component generic in AttributesTable via the editBox prop
 * - Uses EditBox as its container component to provide the editing form
 * - Uses InnerElementEdit to handle nested element editing (like access privileges)
 * - Interacts with Matter type definitions from matterTypes.ts
 *
 * The component provides validation, tooltips, and conditional rendering of fields based on
 * the attribute type (e.g., numeric types get min/max fields, array types get length fields).
 *
 * @param {Object} props - The input props for the component.
 * @param {XMLAttribute} props.element - The XML attribute element to be edited.
 * @param {function(XMLAttribute): void} props.onChange - Callback function to handle changes to the attribute.
 * @param {function(): void} props.onClose - Callback function to handle closing the edit box.
 * @param {boolean} props.open - Boolean flag to indicate if the edit box is open.
 * @param {boolean} props.isNewRow - Boolean flag to indicate if the attribute is a new row.
 * @param {function(): void} props.onCancel - Callback function to handle canceling the edit.
 *
 * @returns {JSX.Element} The rendered AttributeEdit component.
 */
const AttributeEdit: React.FC<EditRowWrapper<XMLAttribute>> = ({
    element: attribute,
    onSave,
    onCancel,
    open,
}) => {
    const [localAttribute, setLocalAttribute] =
        useState<XMLAttribute>(attribute);

    useEffect(() => {
        setLocalAttribute(attribute);
    }, [attribute]);

    const handleValueChange = useCallback(
        (value: AttributeValuesType): void => {
            if (JSON.stringify(value) !== JSON.stringify(localAttribute.$)) {
                setLocalAttribute(prev => {
                    const updatedAttribute = {
                        ...prev,
                        $: value,
                        _: value.name,
                    };
                    setTimeout(() => {
                        onSave(updatedAttribute);
                    }, 0);
                    return updatedAttribute;
                });
            } else {
                onSave(localAttribute);
            }
        },
        [localAttribute, onSave]
    );

    const handleAccessTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            op: "The type of access. The valid values are 'read', 'write' and 'invoke'.",
            role: "The role of the access. The valid values are 'view', 'operate', 'manage' and 'administer'.",
        };
        return tooltips[field] || '';
    };

    const handleFieldTooltip = (field: string) => {
        const tooltips: { [key: string]: string } = {
            name: 'The name of the attribute. It shall be unique within the cluster.',
            side: "The communication side on which the attribute can be enabled. The valid values are 'client' and 'server'.",
            code: 'The code of the attribute. It shall be unique within the cluster. The code is 32-bit combination of the manufacturer code and attribute ID. The most significant 16 bits are the manufacturer code (range test codes is 0xFFF1 - 0xFFF4). The least significant 16 bits are the attribute ID within 0x0000 - 0x4FFF range.',
            define: 'The C-language define representing the attribute in the C-code. It shall be written using only capital letters and underscores, for example YOUR_ATTRIBUTE_NAME.',
            type: 'The data type of the attribute. Select from predefined Matter types or enter your own custom type.',
            length: "The length of the attribute in bytes. This value applies only to the 'array' data type.",
            min: "The minimum allowed value of the attribute. This value applies only to the numeric data types. The minimum value shall be smaller than 'max' value and fit in the numeric type bounds.",
            max: "The maximum allowed value of the attribute. This value applies only to the numeric data types. The maximum value shall be greater than 'min' value and fit in the numeric type bounds.",
            writable:
                "The flag indicating if the attribute can be modified with write operation. The valid values are 'true' and 'false'.",
            reportable:
                "The flag indicating if the attribute can be reported. The valid values are 'true' and 'false'.",
            isNullable:
                "The flag indicating if the attribute can be set to NULL. The valid values are 'true' and 'false'.",
            optional:
                "The flag indicating if the attribute is optional or mandatory. The valid values are 'true' and 'false'.",
            default:
                'The default value of the attribute. This value shall be the same type as the attribute type.',
            apiMaturity:
                "The API maturity level of the attribute. The valid values are 'provisional', 'internal', 'stable', and 'deprecated'. This field is optional and items without it are considered to be stable.",
            description:
                'The attribute description that explains the purpose of the attribute and its use cases.',
            array: "The flag indicating if the attribute is an array. The valid values are 'true' and 'false'.",
        };
        return tooltips[field] || '';
    };

    const handleOptional = (field: string) => {
        if (
            field === 'side' ||
            field === 'code' ||
            field === 'define' ||
            field === 'type' ||
            field === 'name'
        ) {
            return false;
        }
        return true;
    };

    const handleDisabled = (field: string, items: AttributeValuesType) => {
        if (field === 'length') {
            if (Object.keys(items).includes('array') && items.array === true) {
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

    const isTypeNumeric = (type: string) =>
        type === 'int8u' ||
        type === 'int16u' ||
        type === 'int24u' ||
        type === 'int32u' ||
        type === 'int40u' ||
        type === 'int48u' ||
        type === 'int56u' ||
        type === 'int64u' ||
        type === 'int8s' ||
        type === 'int16s' ||
        type === 'int24s' ||
        type === 'int32s' ||
        type === 'int40s' ||
        type === 'int48s' ||
        type === 'int56s' ||
        type === 'int64s' ||
        type === 'single' ||
        type === 'double';

    return (
        <EditBox<AttributeValuesType>
            value={localAttribute.$}
            open={open}
            onSave={newValue => {
                handleValueChange(newValue);
            }}
            onTooltipDisplay={handleFieldTooltip}
            isOptional={handleOptional}
            isDisabled={handleDisabled}
            onCancel={onCancel}
            typeFields={{
                type: globalMatterTypes,
            }}
            treatAsHex={(field: keyof AttributeValuesType) => field === 'code'}
            dropdownFields={{
                side: clientServerOptions,
                apiMaturity: apiMaturityOptions,
            }}
        >
            <InnerElementEdit
                buttonLabel="Accesses"
                listOfElements={
                    (localAttribute.access || []).map(
                        access => access.$
                    ) as AccessType[]
                }
                onSave={(updatedAccess: AccessType[]) => {
                    setLocalAttribute(prev => ({
                        ...prev,
                        access: updatedAccess.map(access => ({ $: access })),
                    }));
                }}
                onTooltipDisplay={handleAccessTooltip}
                isOptional={() => false}
                defaultPrototype={defaultXMLClusterAccess.$}
                dropdownFields={{
                    op: accessOptions,
                    role: roleOptions,
                }}
            />
        </EditBox>
    );
};

export default AttributeEdit;
