/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

export const PLUGIN_ID = 'notificationsDashboards';
export const PLUGIN_NAME = 'notifications-dashboards';

export enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

const NODE_API_BASE_PATH = '/api/notifications';
export const NODE_API = Object.freeze({
  GET_CHANNELS: `${NODE_API_BASE_PATH}/configs`,
});

// TODO change to _plugins when backend updates
const OPENSEARCH_API_BASE_PATH = '/_opensearch/_notifications'
export const OPENSEARCH_API = Object.freeze({
  CONFIGS: `${OPENSEARCH_API_BASE_PATH}/configs`
})

export const REQUEST = Object.freeze({
  PUT: 'PUT',
  DELETE: 'DELETE',
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD',
});