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
  MOCK_CHANNELS,
  MOCK_GET_HISTOGRAM,
  MOCK_NOTIFICATIONS,
  MOCK_RECIPIENT_GROUPS,
  MOCK_SENDERS,
} from './mockData';

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
    const response = await this.httpClient.get(`..${NODE_API.GET_CHANNELS}`, {
      query: queryObject,
    });
    return {
      items: response.config_list || [],
      total: response.total_hits || 0,
    };
  };

  getChannel = async (id: string) => {
    return MOCK_CHANNELS[parseInt(id)];
  };

  getSenders = async (queryObject: object) => {
    return MOCK_SENDERS;
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
