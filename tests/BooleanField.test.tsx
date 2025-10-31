/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import './__mocks__/mui.mock';
import './__mocks__/nordic-shared.mock';
import '@testing-library/jest-dom';

import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';

// Import the component
import BooleanField from '../src/app/Components/Edit/BooleanField';

// Mock MUI components
jest.mock('@mui/material', () => ({
    Box: ({ children, sx }: any) => (
        <div data-testid="mui-box" data-sx={JSON.stringify(sx)}>
            {children}
        </div>
    ),
    FormControlLabel: ({ required, control, label, sx }: any) => (
        <label
            data-testid="form-control-label"
            data-required={required ? 'true' : 'false'}
            data-sx={JSON.stringify(sx)}
            htmlFor="boolean-field-control"
        >
            {React.cloneElement(control, { id: 'boolean-field-control' })}
            {label}
        </label>
    ),
    Tooltip: ({ children, title }: any) => (
        <div data-testid="tooltip" data-title={title}>
            {children}
        </div>
    ),
    Typography: ({ children, variant, sx, noWrap }: any) => (
        <span
            data-testid="typography"
            data-variant={variant}
            data-no-wrap={noWrap ? 'true' : 'false'}
            data-sx={JSON.stringify(sx)}
        >
            {children}
        </span>
    ),
}));

// Mock the Toggle component
jest.mock('@nordicsemiconductor/pc-nrfconnect-shared', () => ({
    Toggle: ({ isToggled, onToggle, label, labelRight, disabled }: any) => (
        <div
            data-testid="toggle"
            data-toggled={isToggled ? 'true' : 'false'}
            data-label-right={labelRight ? 'true' : 'false'}
            data-disabled={disabled ? 'true' : 'false'}
            onClick={() => onToggle(!isToggled)}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onToggle(!isToggled);
                }
            }}
            role="switch"
            aria-checked={isToggled}
            tabIndex={0}
        >
            {label}
        </div>
    ),
}));

/**
 * @jest-environment jsdom
 */

describe('BooleanField component', () => {
    // Setup test variables
    const testField = 'Test Field';
    const onChangeMock = jest.fn();

    // Clean up after each test
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('renders with the provided field name and value', () => {
        render(
            <BooleanField
                field={testField}
                value
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
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

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle).toBeInTheDocument();
        expect(toggle).toHaveAttribute('data-toggled', 'true');
        expect(toggle).toHaveAttribute('data-disabled', 'false');
    });

    it('calls onChange when the toggle is clicked', () => {
        render(
            <BooleanField
                field={testField}
                value={false}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
            />
        );

        const toggle = screen.getByTestId('nrf-toggle');

        // Click the toggle
        act(() => {
            toggle.click();
        });

        // Check if onChange was called with the new value
        expect(onChangeMock).toHaveBeenCalledWith(true);
    });

    it('respects the disabled prop', () => {
        render(
            <BooleanField
                field={testField}
                value={false}
                required={false}
                disabled
                tooltip="Test tooltip"
                onChange={onChangeMock}
            />
        );

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle).toHaveAttribute('data-disabled', 'true');
    });

    it('displays the required indicator when required is true', () => {
        render(
            <BooleanField
                field={testField}
                value={false}
                required
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
            />
        );

        const formControlLabel = screen.getByTestId('mui-form-control-label');
        expect(formControlLabel).toHaveAttribute('data-required', 'true');
    });

    it('renders with left label when leftLabel is true', () => {
        render(
            <BooleanField
                field={testField}
                value={false}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                leftLabel
            />
        );

        const typography = screen.getByTestId('mui-typography');
        expect(typography).toBeInTheDocument();
        expect(typography.textContent).toBe(`${testField}:`);
    });

    it('renders with right label when leftLabel is false', () => {
        render(
            <BooleanField
                field={testField}
                value={false}
                required={false}
                disabled={false}
                tooltip="Test tooltip"
                onChange={onChangeMock}
                leftLabel={false}
            />
        );

        const toggle = screen.getByTestId('nrf-toggle');
        expect(toggle).toHaveAttribute('data-label-right', 'true');
    });
});
