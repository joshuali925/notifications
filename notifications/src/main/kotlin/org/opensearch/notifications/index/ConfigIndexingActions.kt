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

package org.opensearch.notifications.index

import com.amazon.opendistroforelasticsearch.commons.authuser.User
import org.opensearch.OpenSearchStatusException
import org.opensearch.common.Strings
import org.opensearch.commons.notifications.action.CreateNotificationConfigRequest
import org.opensearch.commons.notifications.action.CreateNotificationConfigResponse
import org.opensearch.commons.notifications.action.DeleteNotificationConfigRequest
import org.opensearch.commons.notifications.action.DeleteNotificationConfigResponse
import org.opensearch.commons.notifications.action.GetNotificationConfigRequest
import org.opensearch.commons.notifications.action.GetNotificationConfigResponse
import org.opensearch.commons.notifications.action.UpdateNotificationConfigRequest
import org.opensearch.commons.notifications.action.UpdateNotificationConfigResponse
import org.opensearch.commons.notifications.model.Chime
import org.opensearch.commons.notifications.model.ConfigType
import org.opensearch.commons.notifications.model.Email
import org.opensearch.commons.notifications.model.EmailGroup
import org.opensearch.commons.notifications.model.Feature
import org.opensearch.commons.notifications.model.NotificationConfig
import org.opensearch.commons.notifications.model.NotificationConfigInfo
import org.opensearch.commons.notifications.model.NotificationConfigSearchResult
import org.opensearch.commons.notifications.model.Slack
import org.opensearch.commons.notifications.model.SmtpAccount
import org.opensearch.commons.notifications.model.Webhook
import org.opensearch.commons.utils.logger
import org.opensearch.notifications.NotificationPlugin.Companion.LOG_PREFIX
import org.opensearch.notifications.model.DocMetadata
import org.opensearch.notifications.model.NotificationConfigDoc
import org.opensearch.notifications.security.UserAccess
import org.opensearch.notifications.security.UserAccessManager
import org.opensearch.rest.RestStatus
import java.time.Instant
import java.util.EnumSet

/**
 * NotificationConfig indexing operation actions.
 */
@Suppress("TooManyFunctions")
object ConfigIndexingActions {
    private val log by logger(ConfigIndexingActions::class.java)

    private lateinit var operations: ConfigOperations
    private lateinit var userAccess: UserAccess

    fun initialize(operations: ConfigOperations, userAccess: UserAccess) {
        this.operations = operations
        this.userAccess = userAccess
    }

    private fun validateSlackConfig(slack: Slack, user: User?) {
        // TODO: URL validation with rules
    }

    private fun validateChimeConfig(chime: Chime, user: User?) {
        // TODO: URL validation with rules
    }

    private fun validateWebhookConfig(webhook: Webhook, user: User?) {
        // TODO: URL validation with rules
    }

    private fun validateEmailConfig(email: Email, features: EnumSet<Feature>, user: User?) {
        if (email.emailGroupIds.contains(email.emailAccountID)) {
            throw OpenSearchStatusException(
                "Config IDs ${email.emailAccountID} is in both emailAccountID and emailGroupIds",
                RestStatus.BAD_REQUEST
            )
        }
        val configIds = setOf(email.emailAccountID).union(email.emailGroupIds)
        val configDocs = operations.getNotificationConfigs(configIds)
        if (configDocs.size != configIds.size) {
            val availableIds = configDocs.map { it.docInfo.id }.toSet()
            throw OpenSearchStatusException(
                "Config IDs not found:${configIds.filterNot { availableIds.contains(it) }}",
                RestStatus.NOT_FOUND
            )
        }
        configDocs.forEach {
            // Validate that the config type matches the data
            when (it.configDoc.config.configType) {
                ConfigType.EMAIL_GROUP -> if (it.docInfo.id == email.emailAccountID) {
                    // Email Group ID is specified as Email Account ID
                    throw OpenSearchStatusException(
                        "configId ${it.docInfo.id} is not a valid email account ID",
                        RestStatus.NOT_ACCEPTABLE
                    )
                }
                ConfigType.SMTP_ACCOUNT -> if (it.docInfo.id != email.emailAccountID) {
                    // Email Account ID is specified as Email Group ID
                    throw OpenSearchStatusException(
                        "configId ${it.docInfo.id} is not a valid email group ID",
                        RestStatus.NOT_ACCEPTABLE
                    )
                }
                else -> {
                    // Config ID is neither Email Group ID or valid Email Account ID
                    throw OpenSearchStatusException(
                        "configId ${it.docInfo.id} is not a valid email group ID or email account ID",
                        RestStatus.NOT_ACCEPTABLE
                    )
                }
            }
            // Validate that the user has access to underlying configurations as well.
            val currentMetadata = it.configDoc.metadata
            if (!UserAccessManager.doesUserHasAccess(user, currentMetadata.tenant, currentMetadata.access)) {
                throw OpenSearchStatusException(
                    "Permission denied for NotificationConfig ${it.docInfo.id}",
                    RestStatus.FORBIDDEN
                )
            }

            // Validate the features enabled are included in all underlying configurations as well.
            if (!it.configDoc.config.features.containsAll(features)) {
                val missingFeatures = features.filterNot { item ->
                    it.configDoc.config.features.contains(item)
                }
                throw OpenSearchStatusException(
                    "Some Features not available in NotificationConfig ${it.docInfo.id}:$missingFeatures",
                    RestStatus.FORBIDDEN
                )
            }
        }
    }

    private fun validateSmtpAccountConfig(smtpAccount: SmtpAccount, user: User?) {
        // TODO: host validation with rules
    }

    private fun validateEmailGroupConfig(emailGroup: EmailGroup, user: User?) {
        // No extra validation required. All email IDs are validated as part of model validation.
    }

    private fun validateConfig(config: NotificationConfig, user: User?) {
        when (config.configType) {
            ConfigType.NONE -> throw OpenSearchStatusException(
                "NotificationConfig with type NONE is not acceptable",
                RestStatus.NOT_ACCEPTABLE
            )
            ConfigType.SLACK -> validateSlackConfig(config.configData as Slack, user)
            ConfigType.CHIME -> validateChimeConfig(config.configData as Chime, user)
            ConfigType.WEBHOOK -> validateWebhookConfig(config.configData as Webhook, user)
            ConfigType.EMAIL -> validateEmailConfig(config.configData as Email, config.features, user)
            ConfigType.SMTP_ACCOUNT -> validateSmtpAccountConfig(config.configData as SmtpAccount, user)
            ConfigType.EMAIL_GROUP -> validateEmailGroupConfig(config.configData as EmailGroup, user)
        }
    }

    /**
     * Create new NotificationConfig
     * @param request [CreateNotificationConfigRequest] object
     * @param user the user info object
     * @return [CreateNotificationConfigResponse]
     */
    fun create(request: CreateNotificationConfigRequest, user: User?): CreateNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-create")
        UserAccessManager.validateUser(user)
        validateConfig(request.notificationConfig, user)
        val currentTime = Instant.now()
        val metadata = DocMetadata(
            currentTime,
            currentTime,
            UserAccessManager.getUserTenant(user),
            UserAccessManager.getAllAccessInfo(user)
        )
        val configDoc = NotificationConfigDoc(metadata, request.notificationConfig)
        val docId = operations.createNotificationConfig(configDoc, request.configId)
        docId ?: throw OpenSearchStatusException(
            "NotificationConfig Creation failed",
            RestStatus.INTERNAL_SERVER_ERROR
        )
        return CreateNotificationConfigResponse(docId)
    }

    /**
     * Update NotificationConfig
     * @param request [UpdateNotificationConfigRequest] object
     * @param user the user info object
     * @return [UpdateNotificationConfigResponse]
     */
    fun update(request: UpdateNotificationConfigRequest, user: User?): UpdateNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-update ${request.configId}")
        UserAccessManager.validateUser(user)
        validateConfig(request.notificationConfig, user)
        val currentConfigDoc = operations.getNotificationConfig(request.configId)
        currentConfigDoc
            ?: run {
                throw OpenSearchStatusException(
                    "NotificationConfig ${request.configId} not found",
                    RestStatus.NOT_FOUND
                )
            }

        val currentMetadata = currentConfigDoc.configDoc.metadata
        if (!UserAccessManager.doesUserHasAccess(user, currentMetadata.tenant, currentMetadata.access)) {
            throw OpenSearchStatusException(
                "Permission denied for NotificationConfig ${request.configId}",
                RestStatus.FORBIDDEN
            )
        }
        val newMetadata = currentMetadata.copy(lastUpdateTime = Instant.now())
        val newConfigData = NotificationConfigDoc(newMetadata, request.notificationConfig)
        if (!operations.updateNotificationConfig(request.configId, newConfigData)) {
            throw OpenSearchStatusException("NotificationConfig Update failed", RestStatus.INTERNAL_SERVER_ERROR)
        }
        return UpdateNotificationConfigResponse(request.configId)
    }

    /**
     * Get NotificationConfig info
     * @param request [GetNotificationConfigRequest] object
     * @param user the user info object
     * @return [GetNotificationConfigResponse]
     */
    fun get(request: GetNotificationConfigRequest, user: User?): GetNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-get $request")
        UserAccessManager.validateUser(user)
        return if (request.configId == null || Strings.isEmpty(request.configId)) {
            getAll(request, user)
        } else {
            info(request.configId, user)
        }
    }

    /**
     * Get NotificationConfig info
     * @param configId config id
     * @param user the user info object
     * @return [GetNotificationConfigResponse]
     */
    private fun info(configId: String, user: User?): GetNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-info $configId")
        val configDoc = operations.getNotificationConfig(configId)
        configDoc
            ?: run {
                throw OpenSearchStatusException("NotificationConfig $configId not found", RestStatus.NOT_FOUND)
            }
        val metadata = configDoc.configDoc.metadata
        if (!UserAccessManager.doesUserHasAccess(user, metadata.tenant, metadata.access)) {
            throw OpenSearchStatusException("Permission denied for NotificationConfig $configId", RestStatus.FORBIDDEN)
        }
        val configInfo = NotificationConfigInfo(
            configId,
            metadata.lastUpdateTime,
            metadata.createdTime,
            metadata.tenant,
            configDoc.configDoc.config
        )
        return GetNotificationConfigResponse(NotificationConfigSearchResult(configInfo))
    }

    /**
     * Get all NotificationConfig matching the criteria
     * @param request [GetNotificationConfigRequest] object
     * @param user the user info object
     * @return [GetNotificationConfigResponse]
     */
    private fun getAll(request: GetNotificationConfigRequest, user: User?): GetNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-getAll")
        val searchResult = operations.getAllNotificationConfigs(
            UserAccessManager.getUserTenant(user),
            UserAccessManager.getSearchAccessInfo(user),
            request
        )
        return GetNotificationConfigResponse(searchResult)
    }

    /**
     * Delete NotificationConfig
     * @param operations [ConfigOperations] object
     * @param configId NotificationConfig object id
     * @param user the user info object
     * @return [DeleteNotificationConfigResponse]
     */
    private fun delete(configId: String, user: User?): DeleteNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-delete $configId")
        UserAccessManager.validateUser(user)
        val currentConfigDoc = operations.getNotificationConfig(configId)
        currentConfigDoc
            ?: run {
                throw OpenSearchStatusException(
                    "NotificationConfig $configId not found",
                    RestStatus.NOT_FOUND
                )
            }

        val currentMetadata = currentConfigDoc.configDoc.metadata
        if (!UserAccessManager.doesUserHasAccess(user, currentMetadata.tenant, currentMetadata.access)) {
            throw OpenSearchStatusException(
                "Permission denied for NotificationConfig $configId",
                RestStatus.FORBIDDEN
            )
        }
        if (!operations.deleteNotificationConfig(configId)) {
            throw OpenSearchStatusException(
                "NotificationConfig $configId delete failed",
                RestStatus.REQUEST_TIMEOUT
            )
        }
        return DeleteNotificationConfigResponse(mapOf(Pair(configId, RestStatus.OK)))
    }

    /**
     * Delete NotificationConfig
     * @param configIds NotificationConfig object ids
     * @param user the user info object
     * @return [DeleteNotificationConfigResponse]
     */
    private fun delete(configIds: Set<String>, user: User?): DeleteNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-delete $configIds")
        UserAccessManager.validateUser(user)
        val configDocs = operations.getNotificationConfigs(configIds)
        if (configDocs.size != configIds.size) {
            val mutableSet = configIds.toMutableSet()
            configDocs.forEach { mutableSet.remove(it.docInfo.id) }
            throw OpenSearchStatusException(
                "NotificationConfig $configDocs not found",
                RestStatus.NOT_FOUND
            )
        }
        configDocs.forEach {
            val currentMetadata = it.configDoc.metadata
            if (!UserAccessManager.doesUserHasAccess(user, currentMetadata.tenant, currentMetadata.access)) {
                throw OpenSearchStatusException(
                    "Permission denied for NotificationConfig ${it.docInfo.id}",
                    RestStatus.FORBIDDEN
                )
            }
        }
        val deleteStatus = operations.deleteNotificationConfigs(configIds)
        return DeleteNotificationConfigResponse(deleteStatus)
    }

    /**
     * Delete NotificationConfig
     * @param request [DeleteNotificationConfigRequest] object
     * @param user the user info object
     * @return [DeleteNotificationConfigResponse]
     */
    fun delete(request: DeleteNotificationConfigRequest, user: User?): DeleteNotificationConfigResponse {
        log.info("$LOG_PREFIX:NotificationConfig-delete ${request.configIds}")
        return if (request.configIds.size == 1) {
            delete(request.configIds.first(), user)
        } else {
            delete(request.configIds, user)
        }
    }
}
