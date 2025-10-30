/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Paper,
    styled,
    Typography,
} from '@mui/material';

import { HexString } from '../defines';
import DropdownField from './Edit/DropdownField';
import TextInputField from './Edit/TextInputField';
import TypeField from './Edit/TypeField';
import { camelCaseToTitle } from './Utils';

/**
 * @template T - The type of the data object to be displayed and edited.
 */

/**
 * A styled Paper component for displaying individual items within a PageCard.
 * It provides consistent styling for each field displayed in the card.
 *
 * @type {React.FC<import('@mui/material').PaperProps>}
 */
export const SingleItem = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(0.2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary,
    flexGrow: 1,
    marginBottom: theme.spacing(1),
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

interface PageCardProps<T> {
    title: string;
    data: T;
    treatAsHex?: (field: keyof T) => boolean;
    isOptionalCallback?: (field: keyof T) => boolean;
    isDisabledCallback?: (field: keyof T, value: T) => boolean;
    tooltipCallback?: (field: keyof T) => string;
    onChange: (value: T) => void;
    children?: React.ReactNode;
    useNrfconnect?: boolean;
    typeFields?: { [key in keyof T]?: readonly string[] };
    dropdownFields?: { [key in keyof T]?: readonly string[] };
}

/**
 * A card component that displays a collection of editable fields for an object.
 * It automatically renders input fields for each primitive property of the provided data object.
 * Complex properties (objects or arrays) are ignored unless they are HexString instances.
 *
 * The component handles local state management, allowing users to edit values that can then be
 * propagated to the parent component.
 *
 * @param {string} title - The title to display at the top of the card
 * @param {T} data - The data object containing the properties to be displayed and edited
 * @param {function} [treatAsHex] - Callback that determines if a field should be treated as hexadecimal
 * @param {function} [isOptionalCallback] - Callback that determines if a field is optional
 * @param {function} [isDisabledCallback] - Callback that determines if a field should be disabled
 * @param {function} [tooltipCallback] - Callback that provides tooltip text for a field
 * @param {function} onChange - Callback function called when any field value changes
 * @param {React.ReactNode} [children] - Additional content to be displayed below the fields
 * @param {boolean} [useNrfconnect] - Whether to use Nordic Semiconductor styling
 * @param {object} [typeFields] - Object mapping field names to arrays of allowed type values
 * @param {object} [dropdownFields] - Object mapping field names to arrays of dropdown options
 * @returns {JSX.Element} The rendered PageCard component
 *
 * @example
 * import React, { useState } from 'react';
 * import PageCard from './Components/PageCard';
 * import { HexString } from './defines';
 *
 * const ClusterEditor = () => {
 *   const [clusterData, setClusterData] = useState({
 *     name: 'Temperature Measurement',
 *     code: new HexString(0x0402),
 *     revision: 1,
 *     description: 'Cluster for temperature measurement',
 *     isManufacturerSpecific: false
 *   });
 *
 *   // Identify fields that should be treated as hexadecimal
 *   const isHexField = (field) => {
 *     return field === 'code';
 *   };
 *
 *   // Identify fields that are optional
 *   const isOptional = (field) => {
 *     return field !== 'name' && field !== 'code';
 *   };
 *
 *   // Provide tooltips for fields
 *   const getTooltip = (field) => {
 *     const tooltips = {
 *       name: 'The name of the cluster',
 *       code: 'The cluster code in hexadecimal format',
 *       revision: 'The revision number of the cluster',
 *       description: 'A description of the cluster functionality'
 *     };
 *     return tooltips[field] || '';
 *   };
 *
 *   return (
 *     <PageCard
 *       title="Cluster Definition"
 *       data={clusterData}
 *       treatAsHex={isHexField}
 *       isOptionalCallback={isOptional}
 *       tooltipCallback={getTooltip}
 *       useNrfconnect={true}
 *     >
 *       <div>Additional custom content can go here</div>
 *     </PageCard>
 *   );
 * };
 *
 * export default ClusterEditor;
 */
const PageCard = <T,>({
    title,
    data,
    treatAsHex,
    isOptionalCallback,
    isDisabledCallback,
    tooltipCallback,
    onChange,
    children,
    useNrfconnect,
    typeFields,
    dropdownFields,
}: PageCardProps<T>) => {
    const [localValue, setLocalValue] = React.useState<T>(data);

    useEffect(() => {
        setLocalValue(data);
    }, [data]);

    // Helper function to render a field item
    const renderFieldItem = (field: string, value: any) => {
        if (typeFields && field in typeFields && typeFields[field as keyof T]) {
            return (
                <SingleItem key={field}>
                    <TypeField
                        key={String(field)}
                        field={camelCaseToTitle(String(field))}
                        value={value as string}
                        availableTypes={
                            typeFields[field as keyof T] as string[]
                        }
                        required={
                            isOptionalCallback
                                ? !isOptionalCallback(field as keyof T)
                                : false
                        }
                        disabled={
                            isDisabledCallback
                                ? isDisabledCallback(
                                      field as keyof T,
                                      localValue
                                  )
                                : false
                        }
                        tooltip={
                            tooltipCallback
                                ? tooltipCallback(field as keyof T)
                                : ''
                        }
                        onChange={(v: string) => {
                            const updatedValue = { ...localValue };
                            if (v !== value) {
                                updatedValue[field as keyof T] =
                                    v as unknown as T[keyof T];
                                setLocalValue(updatedValue as T);
                                onChange(updatedValue);
                            }
                        }}
                        useNrfconnect={useNrfconnect}
                    />
                </SingleItem>
            );
        }

        if (dropdownFields && field in dropdownFields) {
            return (
                <SingleItem key={field}>
                    <DropdownField
                        field={camelCaseToTitle(String(field))}
                        value={value as string}
                        options={dropdownFields[field as keyof T] as string[]}
                        onChange={(v: string) => {
                            const updatedValue = { ...localValue };
                            updatedValue[field as keyof T] =
                                v as unknown as T[keyof T];
                            setLocalValue(updatedValue as T);
                            onChange(updatedValue);
                        }}
                        required={
                            isOptionalCallback
                                ? !isOptionalCallback(field as keyof T)
                                : false
                        }
                        disabled={
                            isDisabledCallback
                                ? isDisabledCallback(
                                      field as keyof T,
                                      localValue
                                  )
                                : false
                        }
                        tooltip={
                            tooltipCallback
                                ? tooltipCallback(field as keyof T)
                                : ''
                        }
                        useNrfconnect={useNrfconnect}
                    />
                </SingleItem>
            );
        }

        return (
            <SingleItem key={field}>
                <TextInputField
                    field={camelCaseToTitle(String(field))}
                    value={value as string | number | HexString}
                    onChange={newValue => {
                        const updatedValue = { ...localValue };

                        if (
                            JSON.stringify(newValue) !==
                            JSON.stringify(localValue[field as keyof T])
                        ) {
                            if (treatAsHex && treatAsHex(field as keyof T)) {
                                newValue = new HexString(newValue.toString());
                            }

                            updatedValue[field as keyof T] =
                                newValue as unknown as T[keyof T];

                            setLocalValue(updatedValue as T);
                            onChange(updatedValue);
                        }
                    }}
                    required={
                        isOptionalCallback
                            ? !isOptionalCallback(field as keyof T)
                            : false
                    }
                    disabled={
                        isDisabledCallback
                            ? isDisabledCallback(field as keyof T, localValue)
                            : false
                    }
                    tooltip={
                        tooltipCallback ? tooltipCallback(field as keyof T) : ''
                    }
                    fullWidth
                    useNrfconnect={useNrfconnect}
                    minSize={10}
                    treatAsHex={treatAsHex && treatAsHex(field as keyof T)}
                />
            </SingleItem>
        );
    };

    return (
        <Card sx={{ marginBottom: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h4" align="center" sx={{ width: '100%' }}>
                <Box sx={{ paddingY: 2, paddingLeft: 2, textAlign: 'left' }}>
                    {title}
                </Box>
            </Typography>
            <Box sx={{ textAlign: 'left', paddingLeft: 2 }}>
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mb: 1,
                        color: 'text.secondary',
                    }}
                >
                    Click on any field to edit its value.
                    <br />
                    Fields marked with * are required.
                </Typography>
            </Box>
            <CardContent>
                <Box>
                    {Object.entries(localValue as Record<string, unknown>).map(
                        ([field, value]) => {
                            if (
                                (Array.isArray(value) ||
                                    typeof value === 'object') &&
                                !(value instanceof HexString)
                            ) {
                                return null;
                            }
                            return renderFieldItem(field, value);
                        }
                    )}
                    {React.Children.map(children, child => (
                        <SingleItem>{child}</SingleItem>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
};

export default PageCard;
