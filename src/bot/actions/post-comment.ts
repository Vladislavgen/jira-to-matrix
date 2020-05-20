import * as R from 'ramda';
import { getLogger } from '../../modules/log';
import { fromString } from 'html-to-text';
import { PostCommentActions, RenderedIssue, Comment } from '../../types';

const logger = getLogger(module);

const getCommentHTMLBody = (headerText, commentBody) => `${headerText}: <br>${commentBody}`;

const getCommentBody = (issue: RenderedIssue, comment) => {
    const comments: Comment[] = R.path(['renderedFields', 'comment', 'comments'], issue) as Comment[];

    const result = R.propOr(comment.body, 'body', R.find(R.propEq('id', comment.id), comments));

    return result;
};

export const postComment = async ({
    chatApi,
    issueID,
    headerText,
    comment,
    author,
    taskTracker,
}: PostCommentActions) => {
    try {
        if (!issueID) {
            logger.warn('No IssueId for posting comment. No way to define params for posting comment');
            return;
        }
        const issue = await taskTracker.getIssueFormatted(issueID);
        const roomId = await chatApi.getRoomId(issue.key);

        const commentBody = getCommentBody(issue, comment);
        const htmlBody = getCommentHTMLBody(headerText, commentBody);
        const body = fromString(htmlBody);
        await chatApi.sendHtmlMessage(roomId, body, htmlBody);
        logger.debug(`Posted comment ${commentBody} to ${issue.key} from ${author}\n`);

        return true;
    } catch (err) {
        throw ['Error in Post comment', err].join('\n');
    }
};
