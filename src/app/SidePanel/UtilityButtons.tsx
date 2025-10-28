/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    Button,
    InfoDialog,
    logger,
    Overlay,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { resetClusterFileState } from './StateReset';

/**
 * The UtilityButtons component provides utility controls for the Matter Cluster Editor.
 *
 * This component offers utility operations including:
 * - Clearing all loaded data and resetting the editor to its initial state
 *
 * The component integrates with:
 * - StateReset module to manage state clearing operations
 * - Telemetry for logging user actions
 *
 * @returns {JSX.Element} The rendered UtilityButtons component
 */
const UtilityButtons = () => {
    const [clearConfirmOpen, setClearConfirmOpen] = React.useState(false);

    const handleClearAll = () => {
        resetClusterFileState();
        setClearConfirmOpen(false);
        logger.info('Cleared all state');
        telemetry.sendEvent('Cleared all cluster state');
    };

    return (
        <div>
            <Overlay
                tooltipId="clear-all-tooltip"
                placement="right"
                tooltipChildren={
                    <div>
                        Clear all loaded data and reset the editor to its
                        initial state. This action cannot be undone.
                    </div>
                }
            >
                <Button
                    variant="primary"
                    onClick={() => setClearConfirmOpen(true)}
                    className="w-100"
                >
                    Clear all
                </Button>
            </Overlay>
            <InfoDialog
                isVisible={clearConfirmOpen}
                onHide={() => setClearConfirmOpen(false)}
                title="Clear all Data"
                footer={
                    <div className="tw-flex tw-justify-end tw-gap-2">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => setClearConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleClearAll}
                            size="lg"
                            className="tw-bg-red-600"
                        >
                            Clear all
                        </Button>
                    </div>
                }
            >
                <div className="tw-flex tw-flex-col tw-gap-4">
                    <p>
                        Are you sure you want to clear all loaded data? This
                        will reset the editor to its initial state and clear all
                        loaded data.
                    </p>
                    <p className="tw-font-semibold tw-text-red-600">
                        This action cannot be undone.
                    </p>
                </div>
            </InfoDialog>
        </div>
    );
};

export default UtilityButtons;
