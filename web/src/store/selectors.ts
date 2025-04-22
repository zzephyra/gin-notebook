// selectors.ts
import { RootState } from '@/store';
import { notesAdapter } from './features/workspace';

// 这一行最关键：拿到一套现成的 selectAll、selectById 等函数
export const notesSelectors = notesAdapter.getSelectors(
  (state: RootState) => state.workspace.noteList
);
