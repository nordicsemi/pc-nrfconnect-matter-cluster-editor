/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

import Row, { RowProps } from './TableRow';

/**
 * A callback function to add a new row to the table.
 * This callback must implement adding a new row to the table by filling
 * the RowProps object with the new row data.
 *
 * @callback addRow
 * @returns {void}
 */

/**
 * The ClusterTable function creates a table according to the name, headers, rows, and it contains
 * also the addRow function which is used to add a new row to the table.
 *
 * You must provide the headers as an array of strings.
 * The rows must be an array of the objects based on the RowProps interface.
 *
 * If the headers length does not match the number of cells in rows, an error will be thrown.
 *
 * The function ClusterTable creates a table with the given name, headers, and rows.
 * The addRow function must be implemented in the caller component to allow adding new rows.
 *
 * In the first stage, it checks whether the number of headers matches the number of cells
 * in rows.
 * Then it creates a Table container which has a button to add a new row on the top.
 * The table content is created based on the provided headers by iterating through the list.
 * The last stage of creating the table is to iterate through the rows and create a single
 * row for each of them.
 *
 * Each Row has its own logic to expand, edit, and remove, hence there is no need to
 * update anything in this function.
 *
 * @component
 * @param {string} name - The name of the table.
 * @param {string[]} headers - An array of strings representing the headers of the table.
 * @param {RowProps[]} rows - An array of objects based on the RowProps interface representing the rows of the table.
 * @param {addRow} addRow - A function to add a new row to the table.
 * @param {string} description - A brief description of the table.
 * @returns {JSX.Element}  A ReactElement representing the table.
 *
 * @example
 * import React, { useState } from 'react';
 * import ClusterTable from './ClusterTable';
 * import { RowProps } from './TableRow';
 *
 * const ExampleComponent = () => {
 *     const [rows, setRows] = useState<RowProps[]>([
 *         {
 *             $: { id: '1' },
 *             cells: ['Cell1', 'Cell2', 'Cell3'],
 *             detailsBox: <div>Details</div>,
 *             updateValues: () => {},
 *             editBox: <div>Edit</div>,
 *             removeRow: () => {},
 *         },
 *     ]);
 *
 *     const addRow = () => {
 *         setRows([...rows, {
 *             $: { id: (rows.length + 1).toString() },
 *             cells: ['NewCell1', 'NewCell2', 'NewCell3'],
 *             detailsBox: <div>New Details</div>,
 *             updateValues: () => {},
 *             editBox: <div>New Edit</div>,
 *             removeRow: () => {},
 *         }]);
 *     };
 *
 *     return (
 *         <ClusterTable
 *             name="Example Table"
 *             headers={['Header1', 'Header2', 'Header3']}
 *             rows={rows}
 *             addRow={addRow}
 *             description="This table is used to display the example data."
 *         />
 *     );
 * };
 *
 * export default ExampleComponent;
 */
const ClusterTable = (
    name: string,
    headers: string[],
    rows: RowProps[],
    addRow: () => void,
    description?: string
) => {
    const [firstHeader, ...remainingHeaders] = headers;

    if (
        rows[0] &&
        [firstHeader, ...remainingHeaders].length !== rows[0].cells.length
    ) {
        throw new Error(
            `Headers length does not match the number of cells in rows for table: ${name}`
        );
    }

    return (
        <TableContainer component={Paper} sx={{ backgroundColor: '#f5f5f5' }}>
            {description && (
                <div className="TableDescription">
                    {description}
                    <br />
                </div>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 2 }}>
                <Button variant="primary" size="xl" onClick={addRow}>
                    Add {name}
                </Button>
            </Box>
            <Table aria-label="cluster table template">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: '60px' }} />
                        <TableCell>{firstHeader}</TableCell>
                        {remainingHeaders.map(header => (
                            <TableCell key={header} align="center">
                                {header}
                            </TableCell>
                        ))}
                        <TableCell key="Action" sx={{ width: '100px' }}>
                            Action
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map(row => (
                        <Row
                            key={row.$.id}
                            cells={row.cells}
                            $={row.$}
                            detailsBox={row.detailsBox}
                            updateValues={row.updateValues}
                            editBox={row.editBox}
                            removeRow={row.removeRow}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ClusterTable;
