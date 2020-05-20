import { translate } from '../../../locales';
import * as utils from '../../../lib/utils';

const getCommandAction = (val, collection) => {
    const numberVal = Number(val);
    if (Number.isInteger(numberVal)) {
        return collection[numberVal - 1];
    }

    return collection.find(el => el.name.toLowerCase() === val.toLowerCase());
};

export const prio = async ({ bodyText, roomName, taskTracker }) => {
    const allPriorities = await taskTracker.getIssuePriorities(roomName);
    if (!allPriorities) {
        return translate('notPrio');
    }

    if (!bodyText) {
        return utils.getCommandList(allPriorities);
    }

    const priority = getCommandAction(bodyText, allPriorities);

    if (!priority) {
        return translate('notFoundPrio', { bodyText });
    }

    await taskTracker.updateIssuePriority(roomName, priority.id);

    return translate('setPriority', priority);
};
