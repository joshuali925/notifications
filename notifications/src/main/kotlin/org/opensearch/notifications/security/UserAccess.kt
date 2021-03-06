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
 *
 */
package org.opensearch.notifications.security

import com.amazon.opendistroforelasticsearch.commons.authuser.User

interface UserAccess {
    /**
     * Validate User if eligible to do operation
     * If filterBy == NoFilter
     *  -> No validation
     * If filterBy == User
     *  -> User name should be present
     * If filterBy == Roles
     *  -> roles should be present
     * If filterBy == BackendRoles
     *  -> backend roles should be present
     */
    fun validateUser(user: User?)

    /**
     * Get tenant info from user object.
     */
    fun getUserTenant(user: User?): String

    /**
     * Get all user access info from user object.
     */
    fun getAllAccessInfo(user: User?): List<String>

    /**
     * Get access info for search filtering
     */
    fun getSearchAccessInfo(user: User?): List<String>

    /**
     * validate if user has access based on given access list
     */
    fun doesUserHasAccess(user: User?, tenant: String, access: List<String>): Boolean

    /**
     * Check if user has all info access.
     */
    fun hasAllInfoAccess(user: User?): Boolean
}
