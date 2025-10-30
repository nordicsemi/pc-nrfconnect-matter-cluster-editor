/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { ReactNode } from 'react';
import { Box, Paper, styled, Typography } from '@mui/material';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

import InnerElementDetails from './InnerElementDetails';

export const DetailsItem = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary,
    flexGrow: 1,
    marginBottom: theme.spacing(2),
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

interface DetailBoxProps<T> {
    description?: string;
    children?: ReactNode;
    innerElements?: {
        name: string;
        element: T[];
        size?: 'sm' | 'm' | 'lg' | 'xl';
    }[];
}

/**
 * A detail box component that is part of a table and becomes visible after clicking the expand button.
 * It contains additional information about the row which is not directly visible in the table.
 * The content of the detail box is provided as a prop and can be customized based on specific requirements.
 *
 * You can put as children for example `InnerElementDetail`, or `ListOfProperties` components.
 *
 * @component DetailsBox
 * @param {string} [description] - A description of the details.
 * @param {object} [innerElements] - An array of inner elements to be displayed in the detail box.
 * @param {React.ReactNode} [children] - The children of the component. Put here everything relevant to the details.
 * @returns {React.ReactNode} The rendered DetailBox component.
 *
 * @example
 * <DetailsBox
 *     description="This is a description of the details."
 *     innerElements={[
 *         {
 *             name: 'Element',
 *             element: [
 *                 { name: 'John', age: 30 },
 *                 { name: 'Doe', age: 25 },
 *             ],
 *             size: 'sm',
 *         },
 *     ]}
 * >
 *     <div>Children</div>
 * </DetailsBox>
 */
const DetailsBox = <T,>({
    description,
    innerElements,
    children,
}: DetailBoxProps<T>) => {
    const [openStates, setOpenStates] = React.useState<boolean[]>(
        innerElements ? new Array(innerElements.length).fill(false) : []
    );
    return (
        <Box sx={{ margin: 1, width: '100%' }}>
            <Typography variant="h6" gutterBottom component="div">
                Details
            </Typography>
            <Box>
                {description && (
                    <DetailsItem>
                        <strong>Description:</strong> {description}
                    </DetailsItem>
                )}
                {children}
                {innerElements && innerElements.length > 0 && (
                    <div>
                        {innerElements.map((item, index) => (
                            <React.Fragment
                                key={`${item.name}-${item.element.length}`}
                            >
                                {item.element.length > 0 && (
                                    <DetailsItem>
                                        <strong>
                                            {item.element.length} {item.name}
                                            {item.element.length > 1
                                                ? 's'
                                                : ''}{' '}
                                            set.
                                        </strong>
                                        <br />
                                        Press the button to see details:
                                        <span style={{ marginRight: '8px' }} />
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => {
                                                const newOpenStates = [
                                                    ...openStates,
                                                ];
                                                newOpenStates[index] =
                                                    !newOpenStates[index];
                                                setOpenStates(newOpenStates);
                                            }}
                                        >
                                            {item.name}s
                                        </Button>
                                        <InnerElementDetails
                                            open={openStates[index]}
                                            content={item.element}
                                            onClose={() => {
                                                const newOpenStates = [
                                                    ...openStates,
                                                ];
                                                newOpenStates[index] =
                                                    !newOpenStates[index];
                                                setOpenStates(newOpenStates);
                                            }}
                                            size={item.size}
                                        />
                                    </DetailsItem>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </Box>
        </Box>
    );
};

export default DetailsBox;
