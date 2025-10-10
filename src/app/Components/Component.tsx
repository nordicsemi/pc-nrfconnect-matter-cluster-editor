/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from 'react';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { telemetry } from '@nordicsemiconductor/pc-nrfconnect-shared';

import eventEmitter from './EventEmitter';
import ClusterTable from './Table';
import { EditRowWrapper, RowProps } from './TableRow';

/**
 * @template T - The template type of the elements in the rows.
 */
interface ComponentProps<T> {
    name: string;
    headers: string[];
    /**
     * A callback function that returns a ReactNode to display the details of a row.
     *
     * @callback detailsBox
     * @param {T} element - The element to display the details of.
     * @returns {ReactNode} - The ReactNode to display the details of the row.
     */
    detailsBox: (element: T) => ReactNode;
    /**
     * A callback function that returns a ReactNode to edit a row.
     *
     * @callback editBox
     * @param {EditRowWrapper<T>} params - The parameters to edit the row.
     * @returns {ReactNode} - The ReactNode to edit the row.
     */
    editBox: (params: EditRowWrapper<T>) => ReactNode;
    /**
     * A callback function that returns an array of any values to display in the cells of a row.
     *
     * @callback getCells
     * @param {T} element - The element to get the cells of.
     * @returns {any[]} - The array of values to display in the cells of the row.
     */
    getCells: (element: T) => any[];
    /**
     * A callback function that loads all rows from a data source.
     *
     * @callback loadAllRows
     * @returns {T[]} - The array of elements to load.
     */
    loadAllRows: () => T[];
    /**
     * A callback function that saves all rows to a data source.
     *
     * @callback saveAllRows
     * @param {T[]} elements - The array of elements to save.
     * @returns {void}
     */
    saveAllRows: (elements: T[]) => void;
    emptyElement: T;
    description?: string;
}

/**
 * The Component React node renders a generic component as a table.
 * It utilizes the ClusterTable component to generate a table according to the provided parameters,
 * editBox to provide the ability to edit the row, and detailsBox to display the details of the row.
 *
 * Each row contains its own implementation of the editBox and detailsBox specific to the actual implementation.
 * This means that you need to provide these functions as props to the component and implement them in the actual component.
 *
 * It keeps the value of all rows and provides the ability to add, remove, and edit rows.
 *
 * This component reacts on the 'xmlInstanceChanged' event to load all the rows from the current global XMLCurrentInstance after its change,
 * and 'xmlInstanceSave' event to save all the current rows to the global XMLCurrentInstance.
 *
 * @component
 * @param {string} name - The name of the table.
 * @param {string[]} headers - The headers of the table columns.
 * @param {ReactNode} detailsBox - A function that returns a ReactNode to display the details of a row.
 * @param {ReactNode} editBox - A function that returns a ReactNode to edit a row.
 * @param {callback} getCells - A function that returns the cells of a row based on the element.
 * @param {callback} loadAllRows - A function that loads all rows from a data source.
 * @param {callback} saveAllRows - A function that saves all rows to a data source.
 * @param {string} description - A brief description of the component to be displayed in the top of the table.
 * @param {T} emptyElement - An empty element used to create new rows.
 *
 * @returns {JSX.Element} - The rendered table component.
 *
 * @example
 * const MyComponent = () => {
 *     const headers = ['ID', 'Name', 'Value'];
 *     const detailsBox = (element) => <div>{element.name}: {element.value}</div>;
 *     const editBox = ({ element, updateValues }) => (
 *         <input
 *             type="text"
 *             value={element.value}
 *             onChange={(e) => updateValues(element.id, { ...element, value: e.target.value })}
 *         />
 *     );
 *     const getCells = (element) => [element.id, element.name, element.value];
 *     const loadAllRows = () => [{ id: 1, name: 'Item 1', value: 'Value 1' }];
 *     const saveAllRows = (elements) => console.log('Saving elements', elements);
 *     const emptyElement = { id: 0, name: '', value: '' };
 *
 *     return (
 *         <Component
 *             name="My Table"
 *             headers={headers}
 *             detailsBox={detailsBox}
 *             editBox={editBox}
 *             getCells={getCells}
 *             loadAllRows={loadAllRows}
 *             saveAllRows={saveAllRows}
 *             emptyElement={emptyElement}
 *             description="This table is used to display the example data."
 *         />
 *     );
 * };
 */
const Component = <T,>({
    name,
    headers,
    detailsBox,
    editBox,
    getCells,
    loadAllRows,
    saveAllRows,
    emptyElement,
    description,
}: ComponentProps<T>) => {
    /* Rows array to held the current rows visible in the table */
    const [rows, setRows] = useState<RowProps[]>([]);

    /* Static objects that hold current values for editing and removing rows */
    const currentRows = React.useRef<RowProps[]>([]);
    const currentId = React.useRef(0);

    /**
     * Removes a row from the currentRows state based on the provided id.
     *
     * @param {number} id - The unique identifier of the row to be removed.
     * @returns {void}
     */
    const removeRow = useCallback((id: number): void => {
        currentRows.current = currentRows.current.filter(
            row => row.$.id !== id
        );
        setRows(currentRows.current);
    }, []);

    /**
     * Update local rows after the values of the row are changed
     *
     * @param {number} id - The unique identifier of the row to be updated.
     * @param {T} element - The new element to be used to update the row.
     * @returns {void}
     */
    const updateValues = useCallback(
        (id: number, element: T): void => {
            currentRows.current = currentRows.current.map(row =>
                row.$.id === id
                    ? {
                          ...row,
                          $: { ...row.$, element, isNew: false },
                          cells: getCells(element),
                          detailsBox: detailsBox(element),
                      }
                    : row
            );
            setRows(currentRows.current);
        },
        [detailsBox, getCells]
    );

    /**
     * Creates a new row in the table based on the provided element and index.
     *
     * The output argument must be a RowProps object defined in the Table.tsx file.
     *
     * @param {T} element - The new element to be used to create the row.
     * @param {number} index - The unique identifier of the row.
     * @param {boolean} isNew - Whether this is a new row being created.
     * @returns {RowProps} - The row object that will be added to the table.
     */
    const createRow = useCallback(
        (element: T, index: number, isNew = false): RowProps => ({
            detailsBox: detailsBox(element),
            editBox: params => editBox({ ...params, element }),
            updateValues,
            removeRow,
            $: {
                element,
                id: index,
                isNew,
            },
            cells: getCells(element),
        }),
        [removeRow, updateValues, getCells, detailsBox, editBox]
    );

    /**
     * Adds a new row to the current rows state.
     * The new row is created with a unique id and empty values.
     *
     * @returns {void}
     * */
    const addRow = (): void => {
        const newElement: T = { ...emptyElement }; // Create a new copy of emptyElement
        const newRow: RowProps = createRow(newElement, currentId.current, true);
        currentRows.current = [...currentRows.current, newRow];
        currentId.current += 1;

        // Ensure state is updated
        setRows([...currentRows.current]);
    };

    useEffect(() => {
        // Loads all the rows from the XMLCurrentInstance and sets them to the currentRows state.
        // This functions can be used once the XMLCurrentInstance content is changed externally, for
        // example by loading data from the XML file.
        // This function must be used together with effect hook to listen to the 'xmlInstanceChanged' event.
        const loadRows = (): void => {
            // Obtain commands from the XMLCurrentInstance
            currentRows.current = [];
            currentId.current = 0;
            const elements = loadAllRows();
            if (elements) {
                // Fill the table with the new elements
                currentRows.current = elements.map((element, index) =>
                    createRow(element, index)
                );
            }
            // Update the actual table with the new rows
            currentId.current = currentRows.current.length;
            setRows(currentRows.current);
        };

        // Set the current rows at the first time.
        setRows(currentRows.current);

        // Once the xmlInstance is changed, we need to load all the rows again to fill the table
        eventEmitter.on('xmlInstanceChanged', loadRows);
        // Clear all events
        return () => {
            eventEmitter.off('xmlInstanceChanged', loadRows);
        };
    }, [createRow, loadAllRows]);

    useEffect(() => {
        // Save all current rows to the XMLCurrentInstance global object.
        const saveRows = () => {
            saveAllRows(currentRows.current.map(row => row.$.element as T));
        };

        // Once the xmlInstanceSave is emitted, we need to call saveRows callback to fill the specific part of the XMLCurrentInstance.
        eventEmitter.on('xmlInstanceSave', saveRows);
        // Clear all events
        return () => {
            eventEmitter.off('xmlInstanceSave', saveRows);
        };
    }, [saveAllRows]);

    useEffect(() => {
        // Send telemetry event when Component is rendered
        telemetry.sendEvent(`Component opened: ${name}`);
    }, [name]);

    /// Render a table according to the current name, headers, rows and addRow callback function
    return ClusterTable(name, headers, rows, addRow, description);
};

export default Component;
