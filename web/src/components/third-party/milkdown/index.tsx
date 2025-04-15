import { defaultValueCtx, Editor, rootCtx } from '@milkdown/kit/core';
import type { FC } from 'react';

import { Milkdown, useEditor } from '@milkdown/react'
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { nord } from '@milkdown/theme-nord';
import { SlashProvider } from "@milkdown/kit/plugin/slash";
import { TooltipPlugin } from "@milkdown/kit/plugin/tooltip";
import { emoji } from "@milkdown/plugin-emoji";
import { gfm } from "@milkdown/kit/preset/gfm";
import { clipboard } from "@milkdown/kit/plugin/clipboard";
import { slashPluginView } from "./script"

const markdown =
    `# Milkdown React Commonmark

> You're scared of a world where you're needed.

This is a demo for using Milkdown with **React**.`


export const MilkdownEditor: FC = () => {

    useEditor((root) => {
        return Editor
            .make()
            .config(ctx => {
                ctx.set(rootCtx, root)
                ctx.set(defaultValueCtx, markdown)
            })
            .config(nord)
            .use(commonmark)
            .use(emoji)
            .use(gfm)
            .use(clipboard)
    }, [])

    return <Milkdown />
}
