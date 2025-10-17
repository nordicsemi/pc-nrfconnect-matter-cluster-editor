/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { HexString } from '../src/app/defines';
import {
    formatValidationErrors,
    validateClusterFile,
} from '../src/app/SidePanel/FileValidation';

describe('FileValidation', () => {
    describe('validateClusterFile', () => {
        it('should pass validation for a file with valid cluster', () => {
            const file = {
                cluster: [
                    {
                        name: 'TestCluster',
                        code: new HexString(0x1234),
                        define: 'TEST_CLUSTER',
                        domain: 'General',
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.hasMultipleClusters).toBe(false);
            expect(result.clusters).toHaveLength(1);
        });

        it('should pass validation for a file with only device type (no cluster)', () => {
            const file = {
                deviceType: {
                    name: 'test-device',
                    typeName: 'Test Device',
                    domain: 'CHIP',
                    deviceId: {
                        $: { editable: false },
                        _: new HexString(0x001),
                    },
                    profileId: {
                        $: { editable: false },
                        _: new HexString(0x0fff),
                    },
                    class: 'Simple',
                    scope: 'Endpoint',
                    clusters: { $: { lockOthers: true } },
                },
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.clusters).toHaveLength(0);
            expect(result.deviceTypes).toHaveLength(1);
        });

        it('should fail validation for a file with neither cluster nor device type', () => {
            const file = {};

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('cluster/deviceType');
            expect(result.errors[0].message).toContain(
                'at least one cluster or one device type'
            );
        });

        it('should detect multiple clusters', () => {
            const file = {
                cluster: [
                    {
                        name: 'Cluster1',
                        code: new HexString(0x1234),
                        define: 'CLUSTER_1',
                        domain: 'General',
                    },
                    {
                        name: 'Cluster2',
                        code: new HexString(0x5678),
                        define: 'CLUSTER_2',
                        domain: 'General',
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(true);
            expect(result.hasMultipleClusters).toBe(true);
            expect(result.clusters).toHaveLength(2);
        });

        it('should detect multiple device types', () => {
            const file = {
                cluster: [
                    {
                        name: 'TestCluster',
                        code: new HexString(0x1234),
                        define: 'TEST_CLUSTER',
                        domain: 'General',
                    },
                ],
                deviceType: [
                    {
                        name: 'device-1',
                        typeName: 'Device 1',
                        domain: 'CHIP',
                        deviceId: {
                            $: { editable: false },
                            _: new HexString(0x001),
                        },
                        profileId: {
                            $: { editable: false },
                            _: new HexString(0x0fff),
                        },
                        class: 'Simple',
                        scope: 'Endpoint',
                        clusters: { $: { lockOthers: true } },
                    },
                    {
                        name: 'device-2',
                        typeName: 'Device 2',
                        domain: 'CHIP',
                        deviceId: {
                            $: { editable: false },
                            _: new HexString(0x002),
                        },
                        profileId: {
                            $: { editable: false },
                            _: new HexString(0x0fff),
                        },
                        class: 'Simple',
                        scope: 'Endpoint',
                        clusters: { $: { lockOthers: false } },
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(true);
            expect(result.hasMultipleDeviceTypes).toBe(true);
            expect(result.deviceTypes).toHaveLength(2);
        });

        it('should fail validation when cluster is missing required fields', () => {
            const file = {
                cluster: [
                    {
                        name: '',
                        code: undefined,
                        define: '',
                        domain: '',
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.field === 'name')).toBe(true);
            expect(result.errors.some(e => e.field === 'code')).toBe(true);
            expect(result.errors.some(e => e.field === 'define')).toBe(true);
            expect(result.errors.some(e => e.field === 'domain')).toBe(true);
        });

        it('should fail validation when device type is missing required fields', () => {
            const file = {
                deviceType: {
                    name: '',
                    typeName: '',
                    domain: '',
                    deviceId: undefined,
                    profileId: undefined,
                    class: '',
                    scope: '',
                },
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(e => e.field === 'name')).toBe(true);
            expect(result.errors.some(e => e.field === 'typeName')).toBe(true);
            expect(result.errors.some(e => e.field === 'domain')).toBe(true);
            expect(result.errors.some(e => e.field === 'deviceId')).toBe(true);
            expect(result.errors.some(e => e.field === 'profileId')).toBe(true);
            expect(result.errors.some(e => e.field === 'class')).toBe(true);
            expect(result.errors.some(e => e.field === 'scope')).toBe(true);
        });

        it('should validate attributes within a cluster', () => {
            const file = {
                cluster: [
                    {
                        name: 'TestCluster',
                        code: new HexString(0x1234),
                        define: 'TEST_CLUSTER',
                        domain: 'General',
                        attribute: [
                            {
                                $: {
                                    code: undefined, // Missing code
                                    type: '',
                                    side: '',
                                },
                            },
                        ],
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    e => e.path.includes('attribute') && e.field === 'code'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('attribute') && e.field === 'type'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('attribute') && e.field === 'side'
                )
            ).toBe(true);
        });

        it('should validate commands within a cluster', () => {
            const file = {
                cluster: [
                    {
                        name: 'TestCluster',
                        code: new HexString(0x1234),
                        define: 'TEST_CLUSTER',
                        domain: 'General',
                        command: [
                            {
                                $: {
                                    code: undefined,
                                    name: '',
                                    source: '',
                                },
                            },
                        ],
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    e => e.path.includes('command') && e.field === 'code'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('command') && e.field === 'name'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('command') && e.field === 'source'
                )
            ).toBe(true);
        });

        it('should validate events within a cluster', () => {
            const file = {
                cluster: [
                    {
                        name: 'TestCluster',
                        code: new HexString(0x1234),
                        define: 'TEST_CLUSTER',
                        domain: 'General',
                        event: [
                            {
                                $: {
                                    code: undefined,
                                    name: '',
                                    priority: '',
                                },
                            },
                        ],
                    },
                ],
            };

            const result = validateClusterFile(file as any);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    e => e.path.includes('event') && e.field === 'code'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('event') && e.field === 'name'
                )
            ).toBe(true);
            expect(
                result.errors.some(
                    e => e.path.includes('event') && e.field === 'priority'
                )
            ).toBe(true);
        });
    });

    describe('formatValidationErrors', () => {
        it('should return empty string when no errors', () => {
            const formatted = formatValidationErrors([]);
            expect(formatted).toBe('');
        });

        it('should format validation errors correctly', () => {
            const errors = [
                {
                    path: 'cluster[0]',
                    field: 'name',
                },
                {
                    path: 'cluster[0]',
                    field: 'code',
                },
            ];

            const formatted = formatValidationErrors(errors);

            expect(formatted).toContain(
                'The following required fields are missing or invalid:'
            );
            expect(formatted).toContain(
                'cluster[0] name is not found in the XML file'
            );
            expect(formatted).toContain(
                'cluster[0] code is not found in the XML file'
            );
        });
    });
});
