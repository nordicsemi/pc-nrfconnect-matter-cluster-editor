/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import './__mocks__/mui.mock';
import './__mocks__/nordic-shared.mock';
import '@testing-library/jest-dom';

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

// Import the component
import InnerButton from '../src/app/Components/Edit/InnerButton';

/**
 * @jest-environment jsdom
 */

describe('InnerButton component', () => {
    // Setup test variables
    const testLabel = 'Test Button';
    const testBadgeContent = 5;
    const onClickMock = jest.fn();

    // Clean up after each test
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('renders with the provided label and badge content', () => {
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={testBadgeContent}
            />
        );

        const badge = screen.getByTestId('mui-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute(
            'data-badge-content',
            testBadgeContent.toString()
        );
        expect(badge).toHaveAttribute('data-color', 'secondary'); // Default color

        const button = screen.getByTestId('nrf-button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('data-variant', 'info');
        expect(button).toHaveAttribute('data-size', 'xl');
        expect(button.textContent).toBe(testLabel);
    });

    it('calls onClick when the button is clicked', () => {
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={testBadgeContent}
            />
        );

        const button = screen.getByTestId('nrf-button');

        // Click the button
        button.click();

        // Check if onClick was called
        expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('applies the provided color to the badge', () => {
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={testBadgeContent}
                color="primary"
            />
        );

        const badge = screen.getByTestId('mui-badge');
        expect(badge).toHaveAttribute('data-color', 'primary');
    });

    it('displays the provided tooltip', () => {
        const testTooltip = 'Test tooltip';
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={testBadgeContent}
                tooltip={testTooltip}
            />
        );

        const tooltip = screen.getByTestId('mui-tooltip');
        expect(tooltip).toBeInTheDocument();

        const tooltipTitle = screen.getByTestId('mui-tooltip-title');
        expect(tooltipTitle).toBeInTheDocument();
        expect(tooltipTitle.textContent).toBe(testTooltip);
    });

    it('renders with zero badge content', () => {
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={0}
            />
        );

        const badge = screen.getByTestId('mui-badge');
        expect(badge).toHaveAttribute('data-badge-content', '0');
    });

    it('wraps content in Box with correct styling', () => {
        render(
            <InnerButton
                onClick={onClickMock}
                label={testLabel}
                badgeContent={testBadgeContent}
            />
        );

        const box = screen.getByTestId('mui-box');
        expect(box).toBeInTheDocument();

        // Check if box has correct styling props
        const sxProp = JSON.parse(box.getAttribute('data-sx') || '{}');
        expect(sxProp).toHaveProperty('display', 'flex');
        expect(sxProp).toHaveProperty('justifyContent', 'center');
        expect(sxProp).toHaveProperty('gap', 8);
    });
});
