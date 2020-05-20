import * as marked from 'marked';
import { translate } from '../../../locales';
import * as utils from '../../../lib/utils';
import { getLogger } from '../../../modules/log';
import { CommandOptions } from '../../../types';

const logger = getLogger(module);

export const create = async ({ bodyText = '', roomName, taskTracker }: CommandOptions): Promise<string | undefined> => {
    try {
        const [issueType, ...wordsNameNewIssue] = bodyText.split(' ');
        const summary = wordsNameNewIssue.join(' ');
        const projectKey = utils.getProjectKeyFromIssueKey(roomName);
        const { id: projectId, issueTypes, style: styleProject } = await taskTracker.getProject(projectKey);
        const namesIssueTypeInProject = issueTypes.map(({ name }) => name);

        // check characters from command
        if (!bodyText || !issueType || !namesIssueTypeInProject.includes(issueType)) {
            return utils.ignoreKeysInProject(projectKey, namesIssueTypeInProject);
        }
        if (!summary) {
            return translate('issueNameExist');
        }
        if (summary.length > 255 || summary.includes('\n')) {
            return translate('issueNameTooLong');
        }
        const type = issueTypes.find(el => (el.name = issueType))!;
        const issue = await taskTracker.getIssue(roomName);
        const isEpic = utils.isEpic({ issue });
        if (isEpic && type?.subtask) {
            return translate('epicShouldNotHaveSubtask');
        }

        // create issue, for sub-task and epic next-gen also will be created link
        const { key: newIssueKey } = await taskTracker.createIssue({
            summary,
            issueTypeId: type.id,
            projectId,
            parentId: roomName,
            isEpic,
            isSubtask: type?.subtask,
            styleProject,
        });
        if (!isEpic && !type?.subtask) {
            await taskTracker.createIssueLink(newIssueKey, roomName);
            return;
        }
        if (styleProject === 'classic' && isEpic) {
            await taskTracker.createEpicLinkClassic(newIssueKey, roomName);
            return;
        }
        const viewUrl = utils.getViewUrl(newIssueKey);

        return marked(translate('newTaskWasCreated', { summary, newIssueKey, viewUrl }));
    } catch (err) {
        logger.error(err);
    }
};
