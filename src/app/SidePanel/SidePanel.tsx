/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Group, SidePanel } from '@nordicsemiconductor/pc-nrfconnect-shared';

import OpenSavePanelButtons from './Buttons';
import ExtensionButtons from './ExtensionButtons';
import UtilityButtons from './UtilityButtons';

/**
 * The SidePanel component provides the main file management interface for the Matter
 * Manufacturer Cluster Editor application.
 *
 * This component organizes file operations into three main sections:
 * 1. XML Cluster file operations, for working with standard Matter cluster definitions
 * 2. XML Cluster extension file operations, for working with extension/custom cluster definitions
 * 3. Utility operations, for clearing state and other utility functions
 *
 * These operations include opening files, saving files, creating new files, and exporting files
 * in formats suitable for Matter implementation. The side panel is a critical part of the
 * application's workflow, enabling users to manage the XML files that define Matter clusters.
 *
 * Component hierarchy:
 * - Uses the SidePanel and Group components from pc-nrfconnect-shared
 * - Contains OpenSavePanelButtons for standard cluster file operations
 * - Contains ExtensionButtons for extension cluster file operations
 * - Contains UtilityButtons for utility operations like clearing state
 *
 * The side panel is always visible in the application layout, providing consistent
 * access to file operations regardless of which editor tab is active.
 *
 * @returns {JSX.Element} The rendered SidePanel component
 */
export default () => (
    <SidePanel>
        <Group heading="XML Cluster file">
            <OpenSavePanelButtons />
        </Group>
        <Group heading="XML Cluster extension file">
            <ExtensionButtons />
        </Group>
        <Group heading="Utility">
            <UtilityButtons />
        </Group>
    </SidePanel>
);
