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

import { HttpSetup } from '../../../../src/core/public';
import { NODE_API } from '../../common';
import { ChannelItemType, NotificationItem } from '../../models/interfaces';
import {
  MOCK_GET_HISTOGRAM,
  MOCK_NOTIFICATIONS,
  MOCK_RECIPIENT_GROUPS,
  MOCK_SENDERS,
} from './mockData';
import {
  configListToChannels,
  configListToSenders,
  configToChannel,
} from './utils/helper';

export interface GetNotificationsResponse {
  totalNotifications: number;
  notifications: NotificationItem[];
}

export default class NotificationService {
  httpClient: HttpSetup;

  constructor(httpClient: HttpSetup) {
    this.httpClient = httpClient;
  }

  getNotifications = async (queryObject: object): Promise<any> => {
    return MOCK_NOTIFICATIONS;
  };

  getHistogram = async (queryObject: object) => {
    return MOCK_GET_HISTOGRAM();
  };

  getChannels = async (
    queryObject: object
  ): Promise<{ items: ChannelItemType[]; total: number }> => {
    const response = await this.httpClient.get(NODE_API.GET_CONFIGS, {
      query: queryObject,
    });
    return {
      items: configListToChannels(response.config_list),
      total: response.total_hits || 0,
    };
  };

  createChannel = async (config: any) => {
    const response = await this.httpClient.post(NODE_API.CREATE_CHANNEL, {
      body: JSON.stringify({ config: config }),
    });
    return response;
  };

  updateChannel = async (id: string, config: ChannelItemType) => {
    const response = await this.httpClient.put(
      `${NODE_API.UPDATE_CHANNEL}/${id}`,
      {
        body: JSON.stringify({ config: config }),
      }
    );
    return response;
  };

  deleteConfigs = async (ids: string[]) => {
    const response = await this.httpClient.delete(NODE_API.DELETE_CONFIGS, {
      query: {
        config_id_list: ids,
      },
    });
    return response;
  };

  getChannel = async (id: string) => {
    const response = await this.httpClient.get(`${NODE_API.GET_CONFIG}/${id}`);
    return configToChannel(response.config_list[0]);
  };

  getSenders = async (queryObject: object) => {
    console.log('queryObject', queryObject);
    const response = await this.httpClient.get(NODE_API.GET_CONFIGS, {
      query: queryObject,
    });
    console.log('response', response);
    return {
      items: configListToSenders(response.config_list),
      total: response.total_hits || 0,
    };
  };

  getSender = async (id: string) => {
    return MOCK_SENDERS[parseInt(id)];
  };

  getRecipientGroups = async (queryObject: object) => {
    return MOCK_RECIPIENT_GROUPS;
  };

  getRecipientGroup = async (id: string) => {
    return MOCK_RECIPIENT_GROUPS[parseInt(id)];
  };
}
