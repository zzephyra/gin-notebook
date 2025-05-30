import RichTextEditor from 'reactjs-tiptap-editor';
import { BaseKit, FontFamily, Table, CodeBlock, ImportWord, Drawer, ExportWord, Twitter, Mention, Mermaid, Attachment, ImageGif, TextDirection, Excalidraw, TableOfContents, TaskList, Strike, Underline, Katex, Video, SearchAndReplace, TextAlign, Indent, Italic, LineHeight, OrderedList, SlashCommand, MoreMark, Link, HorizontalRule, Image, History, Highlight, Emoji, Heading, ExportPdf, FormatPainter, Blockquote, Bold, Clear, FontSize, BulletList } from 'reactjs-tiptap-editor/extension-bundle';
import 'reactjs-tiptap-editor/style.css';
import "./style.css"
import 'react-image-crop/dist/ReactCrop.css';
import 'katex/dist/katex.min.css';
import 'easydrawer/styles.css';


const extensions = [
  // 1. 基础/核心
  BaseKit.configure({
    placeholder: { showOnlyCurrent: true },
  }),
  History,

  // 2. 常用编辑/命令
  SlashCommand,
  SearchAndReplace,
  Clear,
  FormatPainter,

  // 3. 文本样式
  Bold,
  Italic,
  Underline,
  Strike,
  Highlight,
  Link,
  Mention,
  Emoji,
  MoreMark,
  CodeBlock,
  Blockquote,

  // 4. 段落样式
  Heading,
  TextAlign,
  TextDirection,
  Indent,
  LineHeight,
  FontFamily,
  FontSize,

  // 5. 列表/块级功能
  BulletList,
  OrderedList,
  TaskList,
  HorizontalRule,
  Table,

  // 6. 进阶/插件
  Mermaid,
  Excalidraw,
  Katex,

  // 7. 媒体/嵌入
  ImageGif,
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 100);
      });
    },
    maxSize: 10 * 1024 * 1024,
  }),
  Video,
  Twitter,
  Attachment,
  Drawer,

  // 8. TOC/导入导出等
  TableOfContents,
  ImportWord,
  ExportWord,
  ExportPdf,
];


export default function Tiptap({ content, onChangeContent }: { content: string; onChangeContent: (content: string) => void }) {
  return (
    <>
      <RichTextEditor
        output="html"
        content={content}
        onChangeContent={onChangeContent}
        extensions={extensions}
        hideToolbar={false}
      />
    </>
  );
}
