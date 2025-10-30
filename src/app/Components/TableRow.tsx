/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactNode } from 'react';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import {
    Collapse,
    IconButton,
    Popover,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { Toggle } from '@nordicsemiconductor/pc-nrfconnect-shared';

/**
 * Interface for the EditRowWrapper structure.
 *
 * @template T - The type of the element of the row.
 */

export interface EditRowWrapper<T> {
    element: T;
    /**
     * A callback function to save the updated element.
     *
     * @callback onSave
     * @param {T} updatedElement - The updated element.
     * @returns {void}
     */
    onSave: (updatedElement: T) => void;
    /**
     * A callback function to cancel the edit.
     *
     * @callback onCancel
     * @returns {void}
     */
    onCancel: () => void;
    open: boolean;
}

export interface RowProps<T = unknown> {
    cells: any[];
    detailsBox: ReactNode;
    /**
     * A callback function to update the values of the row.
     *
     * @callback updateValues
     * @param {number} id - The id of the row.
     * @param {any} values - The values of the row.
     * @returns {void}
     */
    updateValues: (id: number, values: any) => void;
    /**
     * A callback function to open Edit dialog for the row.
     *
     * @callback editBox
     * @param {EditRowWrapper<T>} params - The parameters for the edit.
     * @returns {ReactNode} - The ReactNode dialog window to edit the row.
     */
    editBox: (params: EditRowWrapper<T>) => ReactNode;
    /**
     * A callback function to remove the row.
     *
     * @callback removeRow
     * @param {number} id - The id of the row.
     * @returns {void}
     */
    removeRow: (id: number) => void;
    $: {
        id: number;
        element: T;
        isNew?: boolean;
    };
}

/**
 * The Row component that represents a single row in the table.
 * It contains all the necessary buttons and actions to edit, remove, and expand the row.
 *
 * The logic of the row is implemented externally by the caller component.
 * It is only a visual representation which must be feed with the necessary functions.
 *
 * @param {any[]} cells - The cells content to display in the row.
 * @param {ReactNode} detailsBox - The content to display when the row is expanded.
 * @param {updateValues} updateValues - A callback function to update the values of the row.
 * @param {editBox} editBox - A callback function to open Edit dialog for the row.
 * @param {removeRow} removeRow - A callback function to remove the row.
 * @param {Object} $ - An object containing the row's id, element, and isNew flag.
 * @param {number} $.id - The id of the row.
 * @param {T} $.element - The element associated with the row.
 * @param {boolean} [$.isNew] - Optional flag indicating if the row is newly created.
 * @returns {ReactNode} The Row component.
 *
 * @example
 * import React from 'react';
 * import Row, { RowProps } from './Components/TableRow';
 *
 * const ExampleComponent = () => {
 *     const rowProps: RowProps = {
 *         cells: ['Cell 1', 'Cell 2', true],
 *         detailsBox: <div>Details Content</div>,
 *         updateValues: (id, values) => console.log(`Update row ${id} with values`, values),
 *         editBox: ({ element, onChange, onClose, open, isNewRow, onCancel }) => (
 *             <div style={{ display: open ? 'block' : 'none' }}>
 *                 <input
 *                     type="text"
 *                     value={element}
 *                     onChange={e => onChange(e.target.value)}
 *                 />
 *                 <button onClick={onClose}>Close</button>
 *             </div>
 *         ),
 *         removeRow: id => console.log(`Remove row ${id}`),
 *         $: {
 *             id: 1,
 *             element: 'Initial Value',
 *         },
 *     };
 *
 *     return (
 *         <table>
 *             <tbody>
 *                 <Row {...rowProps} />
 *             </tbody>
 *         </table>
 *     );
 * };
 * export default ExampleComponent;
 */
const Row = <T,>({
    cells,
    $,
    detailsBox,
    updateValues,
    editBox,
    removeRow,
}: RowProps<T>) => {
    // React useState hooks manages all the states of the specific row.
    const [openDetails, setOpenDetails] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [openEdit, setOpenEdit] = React.useState<boolean>(false);

    // Open edit dialog automatically for new rows
    React.useEffect(() => {
        if ($.isNew) {
            setOpenEdit(true);
        }
    }, [$.isNew]);

    // Functions to handle all the actions of the row.
    // Using this function some elements are expanded, edited or removed.
    const handleRemoveClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClosePopover = () => {
        setAnchorEl(null);
    };
    const onValueChange = (newValue: any) => {
        if (newValue !== $.element) {
            updateValues($.id, newValue);
        }
    };

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell align="center">
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpenDetails(!openDetails)}
                    >
                        {openDetails ? (
                            <KeyboardArrowUpIcon />
                        ) : (
                            <KeyboardArrowDownIcon />
                        )}
                    </IconButton>
                </TableCell>
                {cells.map(cell => {
                    const randomKey = Math.random();
                    if (typeof cell === 'string' || typeof cell === 'number') {
                        return (
                            <TableCell key={randomKey} align="center">
                                {cell}
                            </TableCell>
                        );
                    }
                    if (typeof cell === 'boolean') {
                        return (
                            <TableCell key={randomKey} align="right">
                                <Toggle isToggled={cell} />
                            </TableCell>
                        );
                    }
                    if (React.isValidElement(cell)) {
                        return (
                            <TableCell key={randomKey} align="center">
                                {cell}
                            </TableCell>
                        );
                    }
                    return (
                        <TableCell key={randomKey}>
                            {JSON.stringify(cell)}
                        </TableCell>
                    );
                })}
                <TableCell align="center">
                    <IconButton
                        aria-label="edit"
                        size="small"
                        onClick={() => setOpenEdit(true)}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        aria-label="remove"
                        size="small"
                        onClick={handleRemoveClick}
                    >
                        <DeleteIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={cells.length + 2}
                >
                    <Collapse in={openDetails} timeout="auto" unmountOnExit>
                        {detailsBox}
                    </Collapse>
                </TableCell>
            </TableRow>
            {editBox({
                element: $.element,
                open: openEdit,
                onSave: (newValue: T) => {
                    onValueChange(newValue);
                    $.isNew = false;
                    setOpenEdit(false);
                },
                onCancel: () => {
                    if ($.isNew) {
                        removeRow($.id);
                    }
                    setOpenEdit(false);
                },
            })}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Typography sx={{ p: 2 }}>
                    Are you sure you want to delete this row?
                </Typography>
                <IconButton
                    onClick={() => {
                        handleClosePopover();
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <IconButton
                    onClick={() => {
                        removeRow($.id);
                        handleClosePopover();
                    }}
                >
                    <CheckIcon />
                </IconButton>
            </Popover>
        </>
    );
};

export default Row;
