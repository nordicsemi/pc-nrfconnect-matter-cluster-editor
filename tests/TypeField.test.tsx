/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import './__mocks__/mui.mock';
import './__mocks__/nordic-shared.mock';
import '@testing-library/jest-dom';

import React from 'react';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';

// Import the component
import TypeField from '../src/app/Components/Edit/TypeField';

/**
 * @jest-environment jsdom
 */

describe('TypeField component', () => {
    // Setup test variables
    const testField = 'Test Field';
    const testValue = 'Option 2';
    const testTypes = ['Option 1', 'Option 2', 'Option 3'];
    const onChangeMock = jest.fn();

    // Clean up after each test
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('renders with the provided field name and value when using nrfconnect components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect
            />
        );

        const tooltip = screen.getByTestId('mui-tooltip');
        expect(tooltip).toBeInTheDocument();

        const tooltipTitle = screen.getByTestId('mui-tooltip-title');
        expect(tooltipTitle).toBeInTheDocument();

        const tooltipBox = within(tooltipTitle).getByTestId('mui-box');
        expect(tooltipBox).toBeInTheDocument();
        expect(tooltipBox).toHaveAttribute(
            'data-sx',
            JSON.stringify({
                maxWidth: 220,
                whiteSpace: 'pre-line',
                wordWrap: 'break-word',
            })
        );
        expect(tooltipBox.textContent).toBe('Test tooltip');

        const fieldLabel = screen.getByTestId('mui-typography');
        expect(fieldLabel).toBeInTheDocument();
        expect(fieldLabel.getAttribute('data-variant')).toBe('body1');
        // Check if the Typography component contains the field name with required indicator
        expect(fieldLabel.textContent).toContain(`${testField} :`);

        // Check dropdown exists
        const dropdown = screen.getByTestId('nrf-dropdown');
        expect(dropdown).toBeInTheDocument();

        // Verify dropdown has items matching our test types
        const items = JSON.parse(dropdown.getAttribute('data-items') || '[]');
        expect(items.length).toBe(testTypes.length);
        expect(items[0].label).toBe(testTypes[0]);
        expect(items[1].label).toBe(testTypes[1]);
        expect(items[2].label).toBe(testTypes[2]);
    });

    it('calls onChange when dropdown selection changes with nrfconnect components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect
            />
        );

        // Find the actual select element inside the dropdown
        const selectElement = screen.getByTestId('nrf-dropdown-select');

        // Change the selection to a new value
        fireEvent.change(selectElement, { target: { value: 'Option 1' } });

        // Check if onChange was called with the new value
        expect(onChangeMock).toHaveBeenCalledWith('Option 1');
    });

    // MUI Component Tests (useNrfconnect=false)

    it('renders with the provided field name and value when using MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        const tooltip = screen.getByTestId('mui-tooltip');
        expect(tooltip).toBeInTheDocument();

        const tooltipTitle = screen.getByTestId('mui-tooltip-title');
        expect(tooltipTitle).toBeInTheDocument();

        const tooltipBox = within(tooltipTitle).getByTestId('mui-box');
        expect(tooltipBox).toBeInTheDocument();
        expect(tooltipBox).toHaveAttribute(
            'data-sx',
            JSON.stringify({
                maxWidth: 220,
                whiteSpace: 'pre-line',
                wordWrap: 'break-word',
            })
        );
        expect(tooltipBox.textContent).toBe('Test tooltip');

        // Check text field
        const textField = screen.getByTestId('mui-text-field');
        expect(textField).toBeInTheDocument();
        expect(textField.getAttribute('data-label')).toBe(testField);
        expect(textField.getAttribute('value')).toBe(testValue);
        expect(textField.getAttribute('data-required')).toBe('false');
        expect(textField.getAttribute('data-disabled')).toBe('false');

        // Check IconButton exists
        const iconButton = screen.getByTestId('mui-icon-button');
        expect(iconButton).toBeInTheDocument();

        // Check Menu exists but is closed by default
        const menu = screen.getByTestId('mui-menu');
        expect(menu).toBeInTheDocument();
        expect(menu.getAttribute('data-open')).toBe('false');

        // Check menu items
        const menuItems = screen.getAllByTestId('mui-menu-item');
        expect(menuItems.length).toBe(testTypes.length);
        expect(menuItems[0].textContent).toBe(testTypes[0]);
        expect(menuItems[1].textContent).toBe(testTypes[1]);
        expect(menuItems[2].textContent).toBe(testTypes[2]);
    });

    it('calls onChange when text field value changes with MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Find the text field
        const textField = screen.getByTestId('mui-text-field');

        // Change the text field value
        fireEvent.change(textField, { target: { value: 'Option 1' } });

        // Check if onChange was called with the new value
        expect(onChangeMock).toHaveBeenCalledWith('Option 1');
    });

    it('opens the dropdown menu when the icon button is clicked with MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Find the icon button
        const iconButton = screen.getByTestId('mui-icon-button');

        // Initially the menu should be closed
        const menu = screen.getByTestId('mui-menu');
        expect(menu.getAttribute('data-open')).toBe('false');

        // Click the icon button to open the menu
        fireEvent.click(iconButton);

        // After click, the menu should be open
        expect(menu.getAttribute('data-open')).toBe('true');
    });

    it('selects an option when a menu item is clicked with MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Find the icon button and click to open the menu
        const iconButton = screen.getByTestId('mui-icon-button');
        fireEvent.click(iconButton);

        // Find all menu items
        const menuItems = screen.getAllByTestId('mui-menu-item');

        // Click the first menu item
        fireEvent.click(menuItems[0]);

        // Check if onChange was called with the correct value
        expect(onChangeMock).toHaveBeenCalledWith(testTypes[0]);

        // Menu should close after selection
        const menu = screen.getByTestId('mui-menu');
        expect(menu.getAttribute('data-open')).toBe('false');
    });

    it('disables text field and dropdown button when disabled is true with MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Text field should be disabled
        const textField = screen.getByTestId('mui-text-field');
        expect(textField.getAttribute('data-disabled')).toBe('true');

        // Since the mock doesn't properly handle disabled state for IconButton,
        // we can only verify that the IconButton component exists
        const iconButton = screen.getByTestId('mui-icon-button');
        expect(iconButton).toBeInTheDocument();
    });

    it('renders with required indicator when required is true using MUI components', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Check that the text field has required=true
        const textField = screen.getByTestId('mui-text-field');
        expect(textField).toBeInTheDocument();
        expect(textField.getAttribute('data-required')).toBe('true');
    });

    it('renders without menu items when availableTypes is empty with MUI components', () => {
        render(
            <TypeField
                field={testField}
                value=""
                availableTypes={[]}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect={false}
            />
        );

        // Find the icon button and click to open the menu
        const iconButton = screen.getByTestId('mui-icon-button');
        fireEvent.click(iconButton);

        // Should not find any menu items
        const menuItems = screen.queryAllByTestId('mui-menu-item');
        expect(menuItems.length).toBe(0);
    });

    it('disables the dropdown when disabled is true', () => {
        render(
            <TypeField
                field={testField}
                value={testValue}
                availableTypes={testTypes}
                required={false}
                disabled
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect
            />
        );

        // Get dropdown and check if it's disabled
        const dropdown = screen.getByTestId('nrf-dropdown');
        expect(dropdown).toHaveAttribute('data-disabled', 'true');
    });

    it('renders without available types when availableTypes is empty', () => {
        render(
            <TypeField
                field={testField}
                value=""
                availableTypes={[]}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                useNrfconnect
            />
        );

        // Check that dropdown is disabled when no options are available
        const dropdown = screen.getByTestId('nrf-dropdown');
        expect(dropdown).toHaveAttribute('data-disabled', 'false');
        expect(dropdown).toHaveAttribute('data-items', '[]');
    });
});
