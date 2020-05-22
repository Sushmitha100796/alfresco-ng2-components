/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { RepoApi } from '../repo-api';
import { Logger } from '../../../core/utils/logger';
import { ApiUtil } from '../../../core/structure/api.util';
import { SharedlinksApi as AdfSharedlinksApi, SharedLinkEntry, SharedLinkPaging } from '@alfresco/js-api';

export class SharedLinksApi extends RepoApi {
    sharedlinksApi = new AdfSharedlinksApi(this.alfrescoJsApi);

    constructor(username?: string, password?: string) {
      super(username, password);
    }

    async shareFileById(id: string, expireDate?: Date): Promise<SharedLinkEntry|null> {
      try {
        await this.apiAuth();
        const data = {
          nodeId: id,
          expiresAt: expireDate
        };
        return await this.sharedlinksApi.createSharedLink(data);
      } catch (error) {
        this.handleError(`${this.constructor.name} ${this.shareFileById.name}`, error);
        return null;
      }
    }

    async shareFilesByIds(ids: string[]) {
      try {
        return await ids.reduce(async (previous: any, current: any) => {
          await previous;
          return this.shareFileById(current);
        }, Promise.resolve());
      } catch (error) {
        this.handleError(`${this.constructor.name} ${this.shareFilesByIds.name}`, error);
      }
    }

    async getSharedIdOfNode(name: string) {
      try {
        const sharedLinks = (await this.getSharedLinks()).list.entries;
        const found = sharedLinks.find(sharedLink => sharedLink.entry.name === name);
        return (found || { entry: { id: null } }).entry.id;
      } catch (error) {
        this.handleError(`${this.constructor.name} ${this.getSharedIdOfNode.name}`, error);
        return null;
      }
    }

    async unshareFile(name: string) {
      try {
        const id = await this.getSharedIdOfNode(name);
        return await this.sharedlinksApi.deleteSharedLink(id);
      } catch (error) {
        this.handleError(`${this.constructor.name} ${this.unshareFile.name}`, error);
      }
    }

    async getSharedLinks() {
      try {
        await this.apiAuth();
        return await this.sharedlinksApi.listSharedLinks();
      } catch (error) {
        this.handleError(`${this.constructor.name} ${this.getSharedLinks.name}`, error);
        return null;
      }
    }

    async waitForApi(data: { expect: number }) {
      try {
        const sharedFiles = async () => {
          const totalItems = (await this.getSharedLinks()).list.pagination.totalItems;
          if ( totalItems !== data.expect ) {
              return Promise.reject(totalItems);
          } else {
              return Promise.resolve(totalItems);
          }
        };

        return await ApiUtil.retryCall(sharedFiles);
      } catch (error) {
        Logger.error(`${this.constructor.name} ${this.waitForApi.name} catch: `);
        Logger.error(`\tExpected: ${data.expect} items, but found ${error}`);
      }
    }

    async waitForSharedLink(nodeId: string) {
        const predicate = (sharedLinkPaging: SharedLinkPaging) => {
            const sharedLink = sharedLinkPaging.list.entries.find((sharedLinkEntry: SharedLinkEntry) => {
                return sharedLinkEntry.entry.nodeId === nodeId;
            });

            return sharedLink !== null;
        };

        const apiCall = async () => {
            return this.getSharedLinks();
        };

        return ApiUtil.waitForApi(apiCall, predicate, 10, 2000);
    }
}
