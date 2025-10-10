/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import 'regenerator-runtime/runtime';

import React from 'react';
import {
    App,
    render,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import AttributesTable from './app/Attributes/Attributes';
import ClusterPage from './app/Cluster/Cluster';
import ClusterName from './app/Cluster/ClusterName';
import CommandsTable from './app/Commands/Commands';
import DeviceType from './app/DeviceType/DeviceType';
import EnumTable from './app/Enums/Enums';
import EventsTable from './app/Events/Events';
import SidePanel from './app/SidePanel/SidePanel';
import StructTable from './app/Structures/Structs';

import '../resources/css/index.scss';

const reducer = undefined;

telemetry.enableTelemetry();

render(
    <App
        appReducer={reducer}
        // In this application we do not use device selector,
        // so we can use this field to display an editable cluster name.
        deviceSelect={<ClusterName />}
        sidePanel={<SidePanel />}
        showLogByDefault={false}
        panes={[
            { name: 'Cluster', Main: ClusterPage },
            { name: 'Commands', Main: CommandsTable },
            { name: 'Attributes', Main: AttributesTable },
            { name: 'Events', Main: EventsTable },
            { name: 'Structures', Main: StructTable },
            { name: 'Enums', Main: EnumTable },
            { name: 'Device Type', Main: DeviceType },
        ]}
    />
);
