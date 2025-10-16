/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    DialogButton,
    InfoDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { ListItem } from '../../common/List';
import { ValidationError } from './FileValidation';

interface ValidationErrorsDialogProps {
    isVisible: boolean;
    onHide: () => void;
    errors: ValidationError[];
}

/**
 * Dialog component for displaying file validation errors.
 *
 * This component presents validation errors in a structured, easy-to-read format
 * with each error showing the path, field, and a descriptive message.
 *
 * @function ValidationErrorsDialog
 * @param {ValidationErrorsDialogProps} props - Component props
 * @param {boolean} props.isVisible - Whether the dialog is visible
 * @param {function} props.onHide - Callback when dialog is closed
 * @param {ValidationError[]} props.errors - Array of validation errors to display
 * @returns {JSX.Element} - The rendered validation errors dialog
 *
 */
export const ValidationErrorsDialog = ({
    isVisible,
    onHide,
    errors,
}: ValidationErrorsDialogProps) => (
    <InfoDialog
        isVisible={isVisible}
        onHide={onHide}
        title="Validation Errors"
        footer={<DialogButton onClick={onHide}>Close</DialogButton>}
    >
        <div style={{ marginBottom: '10px' }}>
            The following required fields are missing or invalid:
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
            {errors.map(error => {
                const uniqueKey = `${error.path}-${error.field}-${error.message}`;
                return (
                    <ListItem
                        key={uniqueKey}
                        onSelect={() => {}}
                        selected={false}
                        item={
                            <div>
                                {error.path} {error.field}{' '}
                                {error.message
                                    ? `: ${error.message}`
                                    : 'is not found in the XML file'}
                            </div>
                        }
                    />
                );
            })}
        </div>
    </InfoDialog>
);
