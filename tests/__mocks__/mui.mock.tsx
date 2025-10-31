/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { ReactNode } from 'react';

interface DialogContentProps {
    children: React.ReactNode;
}

interface DialogContentTextProps {
    children: React.ReactNode;
    variant?: string;
}

interface DialogActionsProps {
    children: React.ReactNode;
}

interface BoxProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
}

interface PaperProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
    component?: React.ElementType;
}

interface TypographyProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
    variant?: string;
    gutterBottom?: boolean;
    component?: string;
    noWrap?: boolean;
}

interface CollapseProps {
    children: ReactNode;
    in: boolean;
}

interface IconButtonProps {
    children: ReactNode;
    onClick: () => void;
    'aria-label'?: string;
}

interface PopoverProps {
    children: ReactNode;
    open: boolean;
}

interface TableCellProps {
    children: ReactNode;
    align?: 'left' | 'center' | 'right';
    colSpan?: number;
    style?: React.CSSProperties;
    sx?: Record<string, unknown>;
}

interface TableRowProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
}

interface TableProps {
    children: ReactNode;
    'aria-label'?: string;
}

interface TableContainerProps {
    children: ReactNode;
    component?: React.ElementType;
}

interface TableBodyProps {
    children: ReactNode;
}

interface TableHeadProps {
    children: ReactNode;
}

interface FormControlProps {
    children: ReactNode;
    fullWidth?: boolean;
    size?: string;
    className?: string;
}

interface MenuProps {
    children: ReactNode;
    open: boolean;
    onClose?: () => void;
}

interface MenuItemProps {
    children: ReactNode;
    onClick?: () => void;
}

interface TextFieldProps {
    required?: boolean;
    label?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    size?: string;
    fullWidth?: boolean;
}

interface TooltipProps {
    children: ReactNode;
    title: ReactNode;
    arrow?: boolean;
    placement?: string;
}

interface FormControlLabelProps {
    required?: boolean;
    control: React.ReactElement;
    label?: React.ReactNode;
    sx?: Record<string, unknown>;
}

interface Grid2Props {
    children: React.ReactNode;
    container?: boolean;
    spacing?: number;
}

interface IconButtonProps {
    children: React.ReactNode;
    color?: string;
    edge?: string;
    'aria-label'?: string;
    onClick: () => void;
}

interface CardProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
    variant?: string;
    elevation?: number;
}

interface CardHeaderProps {
    title?: ReactNode;
    subheader?: ReactNode;
    action?: ReactNode;
    sx?: Record<string, unknown>;
}

interface CardContentProps {
    children: ReactNode;
    sx?: Record<string, unknown>;
}

// Export mock MUI components
jest.mock('@mui/material', () => ({
    Box: ({ children, sx }: BoxProps) => (
        <div data-testid="mui-box" data-sx={JSON.stringify(sx)}>
            {children}
        </div>
    ),
    Paper: ({ children, sx, component }: PaperProps) => (
        <div
            data-testid="mui-paper"
            data-sx={JSON.stringify(sx)}
            data-component={component?.toString()}
        >
            {children}
        </div>
    ),
    Card: ({ children, sx, variant, elevation }: CardProps) => (
        <div
            data-testid="mui-card"
            data-sx={JSON.stringify(sx)}
            data-variant={variant}
            data-elevation={elevation}
        >
            {children}
        </div>
    ),
    CardHeader: ({ title, subheader, action, sx }: CardHeaderProps) => (
        <div data-testid="mui-card-header" data-sx={JSON.stringify(sx)}>
            {title && <div data-testid="mui-card-header-title">{title}</div>}
            {subheader && (
                <div data-testid="mui-card-header-subheader">{subheader}</div>
            )}
            {action && <div data-testid="mui-card-header-action">{action}</div>}
        </div>
    ),
    CardContent: ({ children, sx }: CardContentProps) => (
        <div data-testid="mui-card-content" data-sx={JSON.stringify(sx)}>
            {children}
        </div>
    ),
    DialogActions: ({ children }: DialogActionsProps) => (
        <div data-testid="mui-dialog-actions">{children}</div>
    ),
    DialogContent: ({ children }: DialogContentProps) => (
        <div data-testid="mui-dialog-content">{children}</div>
    ),
    DialogContentText: ({ children, variant }: DialogContentTextProps) => (
        <div data-testid="mui-dialog-content-text" data-variant={variant}>
            {children}
        </div>
    ),
    SelectChangeEvent: jest.fn(),
    InputLabel: ({ children }: any) => (
        <label data-testid="mui-input-label" htmlFor="dropdown-field">
            {children}
        </label>
    ),
    Typography: ({
        children,
        variant,
        gutterBottom,
        component,
        sx,
        noWrap,
    }: TypographyProps) => (
        <div
            data-testid="mui-typography"
            data-variant={variant}
            data-gutter_bottom={gutterBottom ? 'true' : 'false'}
            data-component={component}
            data-sx={JSON.stringify(sx)}
            data-no-wrap={noWrap ? 'true' : 'false'}
        >
            {children}
        </div>
    ),
    Collapse: ({ children, in: isOpen }: CollapseProps) =>
        isOpen ? children : null,
    IconButton: ({
        children,
        color,
        edge,
        'aria-label': ariaLabel,
        onClick,
    }: IconButtonProps) => (
        <button
            type="button"
            data-testid="mui-icon-button"
            data-color={color}
            data-edge={edge}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    ),
    Popover: ({ children, open }: PopoverProps) =>
        open ? (
            <span data-testid="popover" style={{ display: 'contents' }}>
                {children}
            </span>
        ) : null,
    TableCell: ({ children, align, colSpan, style, sx }: TableCellProps) => (
        <td
            data-align={align}
            data-colspan={colSpan}
            data-sx={JSON.stringify(sx)}
            style={style}
            data-testid="mui-table-cell"
        >
            {children}
        </td>
    ),
    List: ({ children }: any) => <ul data-testid="mui-list">{children}</ul>,
    ListItem: ({ children, className }: any) => (
        <li data-testid="mui-list-item" className={className}>
            {children}
        </li>
    ),
    TableRow: ({ children, sx }: TableRowProps) => (
        <tr data-sx={JSON.stringify(sx)} data-testid="mui-table-row">
            {children}
        </tr>
    ),
    Table: ({ children, 'aria-label': ariaLabel }: TableProps) => (
        <table data-testid="mui-table" aria-label={ariaLabel}>
            {children}
        </table>
    ),
    Badge: ({ children, badgeContent, color }: any) => (
        <div
            data-testid="mui-badge"
            data-badge-content={badgeContent}
            data-color={color}
        >
            {children}
        </div>
    ),
    TableContainer: ({ children, component }: TableContainerProps) => (
        <div
            data-testid="mui-table-container"
            data-component={component?.toString()}
        >
            {children}
        </div>
    ),
    TableHead: ({ children }: TableHeadProps) => (
        <thead data-testid="mui-table-head">{children}</thead>
    ),
    TableBody: ({ children }: TableBodyProps) => (
        <tbody data-testid="mui-table-body">{children}</tbody>
    ),
    FormControl: ({
        children,
        fullWidth,
        size,
        className,
    }: FormControlProps) => (
        <div
            data-testid="mui-form-control"
            data-full-width={fullWidth ? 'true' : 'false'}
            data-size={size}
            className={className}
        >
            {children}
        </div>
    ),
    Menu: ({ children, open, onClose }: MenuProps) => (
        <div
            data-testid="mui-menu"
            data-open={open ? 'true' : 'false'}
            onClick={onClose}
            onKeyDown={e => {
                if (e.key === 'Escape') {
                    onClose?.();
                }
            }}
            role="menu"
            tabIndex={0}
        >
            {children}
        </div>
    ),
    MenuItem: ({ children, onClick, value }: any) => (
        <div
            data-testid="mui-menu-item"
            data-value={value}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick?.();
                }
            }}
            role="menuitem"
            tabIndex={0}
        >
            {children}
        </div>
    ),
    Grid2: ({ children, container, spacing }: Grid2Props) => (
        <div
            data-testid="mui-grid2"
            data-container={container ? 'true' : 'false'}
            data-spacing={spacing}
        >
            {children}
        </div>
    ),
    TextField: ({
        required,
        label,
        value,
        onChange,
        disabled,
        size,
        fullWidth,
    }: TextFieldProps) => (
        <input
            data-testid="mui-text-field"
            data-required={required ? 'true' : 'false'}
            data-label={label}
            data-size={size}
            data-full-width={fullWidth ? 'true' : 'false'}
            value={value}
            onChange={onChange}
            disabled={disabled}
            data-disabled={disabled ? 'true' : 'false'}
        />
    ),
    Select: ({
        children,
        required,
        label,
        value,
        onChange,
        disabled,
        size,
    }: any) => (
        <div
            data-testid="mui-select"
            data-required={required ? 'true' : 'false'}
            data-label={label}
            data-value={value}
            data-disabled={disabled ? 'true' : 'false'}
            data-size={size}
        >
            <input
                type="text"
                value={value || ''}
                onChange={e =>
                    onChange?.({ target: { value: e.target.value } })
                }
                data-testid="mui-select-input"
            />
            <div data-testid="mui-select-children">{children}</div>
        </div>
    ),
    Tooltip: ({ children, title, arrow, placement }: TooltipProps) => (
        <div
            data-testid="mui-tooltip"
            data-arrow={arrow ? 'true' : 'false'}
            data-placement={placement}
        >
            <div data-testid="mui-tooltip-title">{title}</div>
            {children}
        </div>
    ),
    FormControlLabel: ({
        required,
        control,
        label,
        sx,
    }: FormControlLabelProps) => (
        <label
            data-testid="mui-form-control-label"
            data-required={required ? 'true' : 'false'}
            data-sx={JSON.stringify(sx)}
            htmlFor="boolean-field-control"
        >
            {React.cloneElement(control, { id: 'boolean-field-control' })}
            {label}
        </label>
    ),
    styled:
        (Component: any) =>
        (styleProps: any) =>
        // Return a new component function
        ({ children, ...props }: any) =>
            (
                <Component data-testid="styled-component" {...props}>
                    {children}
                </Component>
            ),
}));
