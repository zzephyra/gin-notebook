import { MarkdownPlugin } from '@udecode/plate-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';

export const markdownPlugin = MarkdownPlugin.configure({
    options: {
        remarkPlugins: [remarkMath, remarkGfm, remarkMdx],
        rules: {
            date: {
                deserialize(mdastNode) {
                    if (mdastNode.children?.[0] && 'value' in mdastNode.children[0]) {
                        return {
                            children: [{ text: '', type: 'text' }],
                            date: mdastNode.children[0].value,
                            type: 'date',
                        };
                    }

                    // Fallback
                    return {
                        children: [{ text: '', type: 'text' }],
                        date: '',
                        type: 'date',
                    };
                },
                serialize: (slateNode) => {
                    return {
                        attributes: [],
                        children: [{ type: 'text', value: slateNode.date || '1999-01-01' }],
                        name: 'date',
                        type: 'mdxJsxTextElement',
                    };
                },
            },
        },
    },
});
