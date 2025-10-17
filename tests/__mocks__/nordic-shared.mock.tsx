/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ReactNode } from 'react';

interface ToggleProps {
    isToggled: boolean;
    onToggle: (toggled: boolean) => void;
    label?: React.ReactNode;
    labelRight?: boolean;
    disabled?: boolean;
}

interface ButtonProps {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
}

interface InlineInputProps {
    value: string;
    onChange: (value: string) => void;
    minSize?: number;
    disabled?: boolean;
    className?: string;
    isValid?: (value: unknown) => boolean;
}

interface DialogProps {
    isVisible: boolean;
    onHide: () => void;
    size?: string;
    children: React.ReactNode;
}

interface InfoDialogProps {
    children: React.ReactNode;
    isVisible: boolean;
    onHide: () => void;
    title: string;
}

interface DropdownProps {
    items: Array<{ value: string; label: string }>;
    onSelect: (item: { value: string; label: string }) => void;
    selectedItem?: { value: string; label: string };
    transparentButtonBg?: boolean;
    disabled?: boolean;
}

jest.mock('@nordicsemiconductor/pc-nrfconnect-shared', () => ({
    Toggle: ({
        isToggled,
        onToggle,
        label,
        labelRight,
        disabled,
    }: ToggleProps) => (
        <div
            data-testid="nrf-toggle"
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
    Button: ({ children, onClick, variant, size, disabled }: ButtonProps) => (
        <button
            onClick={onClick}
            data-variant={variant}
            data-size={size}
            disabled={disabled}
            data-testid="nrf-button"
            type="button"
        >
            {children}
        </button>
    ),
    InlineInput: ({
        value,
        onChange,
        minSize,
        disabled,
        isValid,
        className,
    }: InlineInputProps) => (
        <input
            data-testid="nrf-inline-input"
            type="text"
            value={value}
            onChange={e => onChange && onChange(e.target.value)}
            data-min-size={minSize}
            data-disabled={disabled ? 'true' : 'false'}
            data-is-valid={
                typeof isValid === 'function'
                    ? String(isValid(value))
                    : undefined
            }
            className={className}
        />
    ),
    Dropdown: ({
        items,
        onSelect,
        selectedItem,
        transparentButtonBg,
        disabled,
    }: DropdownProps) => (
        <div
            data-testid="nrf-dropdown"
            data-transparent-bg={transparentButtonBg ? 'true' : 'false'}
            data-items={JSON.stringify(items)}
            data-selected-item={selectedItem?.label}
            data-disabled={disabled ? 'true' : 'false'}
        >
            <select
                value={selectedItem?.value}
                onChange={e => {
                    const item = items.find(
                        (i: any) => i.value === e.target.value
                    );
                    onSelect(item || { value: '', label: '' });
                }}
                data-testid="nrf-dropdown-select"
            >
                {items.map((item: any) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    ),
    Dialog: Object.assign(
        ({ children, size, isVisible, onHide }: DialogProps) => (
            <div
                data-testid="nrf-dialog"
                data-visible={isVisible ? 'true' : 'false'}
                data-size={size}
            >
                {isVisible && (
                    <>
                        <button
                            data-testid="dialog-close"
                            onClick={onHide}
                            type="button"
                        >
                            Close
                        </button>
                        {children}
                    </>
                )}
            </div>
        ),
        {
            Header: ({ title }: { title: string }) => (
                <div data-testid="dialog-header">{title}</div>
            ),
            Body: ({ children }: { children: ReactNode }) => (
                <div data-testid="dialog-body">{children}</div>
            ),
            Footer: ({ children }: { children: ReactNode }) => (
                <div data-testid="dialog-footer">{children}</div>
            ),
        }
    ),
    ErrorDialog: ({ children, isVisible, onHide, title }: InfoDialogProps) =>
        isVisible ? (
            <div data-testid="error-dialog" data-title={title}>
                {children}
                <button
                    type="button"
                    data-testid="error-dialog-close-button"
                    onClick={onHide}
                >
                    Close
                </button>
            </div>
        ) : null,
    InfoDialog: ({ children, isVisible, onHide, title }: InfoDialogProps) =>
        isVisible ? (
            <div data-testid="shared-info-dialog" data-title={title}>
                {children}
                <button
                    type="button"
                    data-testid="info-dialog-close-button"
                    onClick={onHide}
                >
                    Close
                </button>
            </div>
        ) : null,
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    },
    telemetry: {
        sendEvent: jest.fn(),
        sendErrorReport: jest.fn(),
        enableTelemetry: jest.fn(),
    },
}));
