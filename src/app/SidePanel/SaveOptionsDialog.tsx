/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    Button,
    DialogButton,
    InfoDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

interface SaveOptionsDialogProps {
    isVisible: boolean;
    onHide: () => void;
    onSaveEditedOnly: () => void;
    onSaveWithOriginals: () => void;
    itemType: 'cluster' | 'deviceType' | 'clusterExtension';
}

/**
 * Dialog component for choosing save strategy when file has multiple items.
 *
 * When a file contains multiple clusters, device types, or cluster extensions
 * and the user has edited only one of them, this dialog allows them to choose
 * whether to save only the edited item or save all items from the original
 * file with their edits.
 *
 * @function SaveOptionsDialog
 * @param {SaveOptionsDialogProps} props - Component props
 * @param {boolean} props.isVisible - Whether the dialog is visible
 * @param {function} props.onHide - Callback when dialog is closed
 * @param {function} props.onSaveEditedOnly - Callback when user chooses to save only edited item
 * @param {function} props.onSaveWithOriginals - Callback when user chooses to save all original items with edits
 * @param {string} props.itemType - Type of items ('cluster', 'deviceType', or 'clusterExtension')
 * @returns {JSX.Element} - The rendered save options dialog
 */
export const SaveOptionsDialog = ({
    isVisible,
    onHide,
    onSaveEditedOnly,
    onSaveWithOriginals,
    itemType,
}: SaveOptionsDialogProps) => {
    let itemTypeLabel: string;
    let itemTypePlural: string;

    switch (itemType) {
        case 'cluster':
            itemTypeLabel = 'cluster';
            itemTypePlural = 'clusters';
            break;
        case 'deviceType':
            itemTypeLabel = 'device type';
            itemTypePlural = 'device types';
            break;
        default:
            itemTypeLabel = 'cluster extension';
            itemTypePlural = 'cluster extensions';
            break;
    }

    return (
        <InfoDialog
            isVisible={isVisible}
            onHide={onHide}
            title="Save Options"
            footer={<DialogButton onClick={onHide}>Cancel</DialogButton>}
        >
            <div className="tw-flex tw-flex-col tw-gap-6">
                <div className="tw-text-sm">
                    This file originally contained multiple {itemTypePlural}.
                    How would you like to save?
                </div>

                <div className="tw-flex tw-flex-col tw-gap-3">
                    <Button
                        variant="secondary"
                        onClick={onSaveEditedOnly}
                        className="tw-w-full"
                    >
                        Save only the edited {itemTypeLabel}
                    </Button>

                    <Button
                        variant="primary"
                        onClick={onSaveWithOriginals}
                        className="tw-w-full"
                    >
                        Save all data from original file with your edits
                    </Button>
                </div>
            </div>
        </InfoDialog>
    );
};
