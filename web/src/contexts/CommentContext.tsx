import { createContext, useContext } from 'react';
import { TaskCommentsController } from '@/hooks/useComments';

const CommentActionsContext = createContext<TaskCommentsController | null>(null);

export const CommentActionsProvider = CommentActionsContext.Provider;

export function useCommentActions() {
    const ctx = useContext(CommentActionsContext);
    if (!ctx) throw new Error('useCommentActions must be used within CommentActionsProvider');
    return ctx;
}

