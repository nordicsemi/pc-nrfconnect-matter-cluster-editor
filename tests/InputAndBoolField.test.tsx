/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import './__mocks__/component.mock';
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
import InputAndBoolField from '../src/app/Components/Edit/InputAndBoolField';
import { HexString } from '../src/app/defines';

/**
 * @jest-environment jsdom
 */

describe('InputAndBoolField component', () => {
    // Setup test variables
    const testField = 'Test Field';
    const testStringValue = 'Test Value';
    const testBoolValue = true;
    const onChangeStringMock = jest.fn();
    const onChangeBoolMock = jest.fn();

    // Clean up after each test
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('renders with the provided field name and values', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
            />
        );

        const tooltip = screen.getByTestId('mui-tooltip');
        expect(tooltip).toBeInTheDocument();

        const textInputField = screen.getByTestId('text-input-field');
        expect(textInputField).toBeInTheDocument();
        expect(textInputField).toHaveAttribute('data-field', testField);
        expect(textInputField).toHaveAttribute('data-value', testStringValue);
        expect(textInputField).toHaveAttribute('data-full-width', 'true');

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle).toBeInTheDocument();
        expect(toggle).toHaveAttribute('data-toggled', 'true');
        expect(toggle).toHaveAttribute('data-label-right', 'true');
    });

    it('calls onChangeString when the text input changes', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
            />
        );

        // Target the actual input element inside the wrapper
        const textInput = screen.getByTestId('text-input');
        const newValue = 'New Value';

        // Simulate input change using fireEvent
        fireEvent.change(textInput, { target: { value: newValue } });

        // Check if onChangeString was called with the new value
        expect(onChangeStringMock).toHaveBeenCalledWith(newValue);
    });

    it('calls onChangeBool when the toggle is clicked', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
            />
        );

        const toggle = screen.getByTestId('nrf-toggle');

        // Click the toggle
        toggle.click();

        // Check if onChangeBool was called with the new value
        expect(onChangeBoolMock).toHaveBeenCalledWith(false);
    });

    it('displays the provided tooltip', () => {
        const testTooltip = 'Test tooltip';
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
                tooltip={testTooltip}
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
        expect(tooltipBox.textContent).toBe(testTooltip);
    });

    it('uses the provided boolLabel for the toggle', () => {
        const testBoolLabel = 'Test Bool Label';
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
                boolLabel={testBoolLabel}
            />
        );

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle.textContent).toBe(testBoolLabel);
    });

    it('respects the required prop', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
                required
            />
        );

        const textInputField = screen.getByTestId('text-input-field');
        expect(textInputField).toHaveAttribute('data-required', 'true');
    });

    it('respects the disabled prop', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
                disabled
            />
        );

        const textInputField = screen.getByTestId('text-input-field');
        expect(textInputField).toHaveAttribute('data-disabled', 'true');

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle).toHaveAttribute('data-disabled', 'true');
    });

    it('handles HexString values', () => {
        const hexValue = new HexString(0x1234);
        render(
            <InputAndBoolField
                field={testField}
                stringValue={hexValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
            />
        );

        const textInputField = screen.getByTestId('text-input-field');
        expect(textInputField).toHaveAttribute(
            'data-value',
            hexValue.toString()
        );
    });

    it('passes the useNrfconnect prop to TextInputField', () => {
        render(
            <InputAndBoolField
                field={testField}
                stringValue={testStringValue}
                boolValue={testBoolValue}
                onChangeString={onChangeStringMock}
                onChangeBool={onChangeBoolMock}
                useNrfconnect
            />
        );

        const textInputField = screen.getByTestId('text-input-field');
        expect(textInputField).toHaveAttribute('data-use-nrfconnect', 'true');
    });
});
