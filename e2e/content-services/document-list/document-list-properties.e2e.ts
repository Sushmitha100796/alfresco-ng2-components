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

import { ApiService, DropActions, LoginSSOPage, UploadActions } from '@alfresco/adf-testing';
import { ContentServicesPage } from '../../pages/adf/content-services.page';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';
import { browser } from 'protractor';
import { FileModel } from '../../models/ACS/file.model';
import { UsersActions } from '../../actions/users.actions';

describe('Document List Component - Properties', () => {

    const loginPage = new LoginSSOPage();
    const contentServicesPage = new ContentServicesPage();
    const navigationBar = new NavigationBarPage();

    let subFolder, parentFolder;
    const apiService = new ApiService();
    const uploadActions = new UploadActions(apiService);
    let acsUser = null;
    const usersActions = new UsersActions(apiService);

    const pngFile = new FileModel({
        name: browser.params.resources.Files.ADF_DOCUMENTS.PNG.file_name,
        location: browser.params.resources.Files.ADF_DOCUMENTS.PNG.file_location
    });

    describe('Allow drop files property', () => {
        beforeEach(async () => {
            await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

            acsUser = await usersActions.createUser();

            await apiService.getInstance().login(acsUser.email, acsUser.password);

            parentFolder = await uploadActions.createFolder('parentFolder', '-my-');

            subFolder = await uploadActions.createFolder('subFolder', parentFolder.entry.id);

            await loginPage.login(acsUser.email, acsUser.password);
        });

        afterEach(async () => {
            await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            await uploadActions.deleteFileOrFolder(subFolder.entry.id);
            await uploadActions.deleteFileOrFolder(parentFolder.entry.id);
        });

        it('[C299154] Should disallow upload content on a folder row if allowDropFiles is false', async () => {
            await navigationBar.clickContentServicesButton();
            await contentServicesPage.doubleClickRow(parentFolder.entry.name);

            await contentServicesPage.disableDropFilesInAFolder();

            const dragAndDropArea = contentServicesPage.getRowByName(subFolder.entry.name);

            const dragAndDrop = new DropActions();
            await dragAndDrop.dropFile(dragAndDropArea, pngFile.location);
            await contentServicesPage.checkContentIsDisplayed(pngFile.name);
            await contentServicesPage.doubleClickRow(subFolder.entry.name);
            await contentServicesPage.checkEmptyFolderTextToBe('This folder is empty');
        });

        it('[C91319] Should allow upload content on a folder row if allowDropFiles is true', async () => {
            await navigationBar.clickContentServicesButton();
            await contentServicesPage.doubleClickRow(parentFolder.entry.name);

            await contentServicesPage.enableDropFilesInAFolder();

            const dragAndDropArea = contentServicesPage.getRowByName(subFolder.entry.name);

            const dragAndDrop = new DropActions();
            await dragAndDrop.dropFile(dragAndDropArea, pngFile.location);

            await contentServicesPage.checkContentIsNotDisplayed(pngFile.name);
            await contentServicesPage.doubleClickRow(subFolder.entry.name);
            await contentServicesPage.checkContentIsDisplayed(pngFile.name);
        });
    });
});
