/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';

import ClusterFile from '../Components/ClusterFile';
import eventEmitter from '../Components/EventEmitter';
import PageCard from '../Components/PageCard';
import { defaultXMLCluster } from '../defaults';
import { XMLCluster } from '../defines';
import { matterDomains } from '../matterTypes';

/**
 * Implementation of the `ClusterPage` component dedicated to `XMLCluster`.
 *
 * The ClusterPage component is a central UI element in the Matter Manufacturer Cluster Editor
 * that displays and manages Matter cluster definitions. It presents cluster data from the loaded
 * XML cluster file in a structured format, allowing users to view, add, edit, and delete clusters.
 *
 * This component serves as the main interface for cluster management in the application:
 * - It loads cluster data from the current XML cluster file
 * - It renders clusters in a table showing key properties (name, domain, code, etc.)
 * - It enables users to expand rows to see detailed cluster information
 * - It provides functionality to edit existing clusters or create new ones
 * - It handles synchronization between UI state and the XML data structure
 *
 * Component hierarchy:
 * - Uses the generic Component wrapper to provide table functionality
 * - Uses ClusterDetails component to render expanded details for clusters
 * - Uses ClusterEdit component for editing cluster data
 * - Interacts with ClusterFile singleton to access and modify the current XML data
 *
 * The component manages XML data synchronization, ensuring that text fields like description
 * and name are kept in sync across different representation properties in the XML structure.
 *
 * @param {Object} props - The input props for the component.
 * @param {XMLCluster} props.element - The XML cluster element to be edited.
 * @param {function} props.onSave - Callback function to handle saving the cluster changes.
 * @param {function} props.onCancel - Callback function to handle canceling the edit.
 * @param {boolean} props.open - Boolean flag to indicate if the edit box is open.
 * @returns {JSX.Element} The rendered `ClusterPage` component.
 */
const ClusterPage: React.FC = () => {
    const [localCluster, setLocalCluster] =
        React.useState<XMLCluster>(defaultXMLCluster);

    const externalNameChange = React.useRef(false);

    React.useEffect(() => {
        const loadClusterData = () => {
            if (!ClusterFile.XMLCurrentInstance.cluster) {
                return;
            }
            if (ClusterFile.XMLCurrentInstance.cluster) {
                setLocalCluster(ClusterFile.XMLCurrentInstance.cluster);
            }
            eventEmitter.emit(
                'clusterEditNameChanged',
                ClusterFile.XMLCurrentInstance.cluster.name
            );
        };

        eventEmitter.on('xmlInstanceChanged', loadClusterData);
        return () => {
            eventEmitter.off('xmlInstanceChanged', loadClusterData);
        };
    });

    React.useEffect(() => {
        const saveClusterData = () => {
            ClusterFile.XMLCurrentInstance.cluster = localCluster;
        };

        eventEmitter.on('xmlInstanceSave', saveClusterData);
        return () => {
            eventEmitter.off('xmlInstanceSave', saveClusterData);
        };
    });

    React.useEffect(() => {
        eventEmitter.on('clusterNameBarChanged', name => {
            if (localCluster.name !== name) {
                externalNameChange.current = true;
                setLocalCluster({ ...localCluster, name });
            }
        });
        return () => {
            eventEmitter.off('clusterNameBarChanged', name => {
                setLocalCluster({ ...localCluster, name });
            });
        };
    });

    const tooltips: { [key: string]: string } = {
        domain: 'The domain that cluster belongs to. The domain is a group of clusters that share a common purpose, for example, General, Lighting, or HVAC.',
        name: 'The name of the cluster. It shall be unique across all available clusters in the data model.',
        code: 'The code of the cluster. It shall be unique across all available clusters in the data model. The code is 32-bit combination of the manufacturer code and cluster ID. The most significant 16 bits are the manufacturer code (range test codes is 0xFFF1 - 0xFFF4). \n The least significant 16 bits are the cluster ID within 0xFC00 - 0xFFFE range.',
        define: 'The C-language define representing the cluster in the C-code. It shall be written using only capital letters and underscores, for example YOUR_CLUSTER_NAME.',
        description:
            'The cluster description that explains the purpose of the cluster and its use cases.',
    };

    const handleFieldTooltip = (field: string) => tooltips[field] || '';

    const handleOptional = (field: string) => {
        if (field === 'description') {
            return true;
        }
        return false;
    };

    const handleClusterChange = (value: XMLCluster) => {
        if (externalNameChange.current) {
            externalNameChange.current = false;
            return;
        }
        if (value.name !== localCluster.name) {
            setLocalCluster(value);
            // Also update the ClusterFile's current instance so changes are preserved
            ClusterFile.XMLCurrentInstance.cluster = value;
            eventEmitter.emit('clusterEditNameChanged', value.name);
            return;
        }
        setLocalCluster(value);
        // Also update the ClusterFile's current instance so changes are preserved
        ClusterFile.XMLCurrentInstance.cluster = value;
    };

    return (
        <PageCard
            title={localCluster.name || 'Cluster'}
            data={localCluster}
            isOptionalCallback={handleOptional}
            isDisabledCallback={() => false}
            tooltipCallback={handleFieldTooltip}
            treatAsHex={(field: string) => field === 'code'}
            useNrfconnect
            typeFields={{
                domain: matterDomains,
            }}
            onChange={handleClusterChange}
        />
    );
};

export default ClusterPage;
