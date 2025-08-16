import { useRef, forwardRef, useImperativeHandle, useState, useLayoutEffect, useEffect, useMemo } from "react";
import { calcInContainer, extractCommentPayload, handleKeyDown, splitByMentions } from "../script";
import { CommentContentHandle, CommentContentProps } from "./types";
import { WorkspaceMember } from "@/types/workspace";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useParams } from "react-router-dom";
import { Avatar, Listbox, ListboxItem, ListboxSection } from "@heroui/react";
import MemberCard from "@/components/card/member";
import { useLingui } from "@lingui/react/macro";
import { useTodo } from "@/contexts/TodoContext";
import { createPortal } from "react-dom";





const CommentContent = forwardRef<CommentContentHandle, CommentContentProps>((props, ref) => {
    const [dropdown, setDropdown] = useState<{ visible: boolean; top: number; left: number; keyword: string; range: Range | null }>({ visible: false, top: 0, left: 0, keyword: '', range: null });
    const dropdownRef = useRef<HTMLDivElement>(null); // 下拉列表容器
    const popoverRef = useRef<HTMLDivElement>(null); // popover容器
    const containerRef = useRef<HTMLDivElement>(null)
    const params = useParams();
    const { t } = useLingui();
    const [contentValue, setContentValue] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data: members } = useWorkspaceMembers(params.id || "", searchParams);
    const memberMap = useMemo(() => {
        const map: Record<string, WorkspaceMember> = {};
        (members || []).forEach(m => { map[m.id] = m; });
        return map;
    }, [members]);

    const [popover, setPopover] = useState<{
        visible: boolean;
        anchorEl?: HTMLElement | null;
        mention?: WorkspaceMember;
        left?: number;
        top?: number;
    }>({ visible: false });
    const { setActiveOverlay } = useTodo();

    const boxRef = useRef<HTMLDivElement>(null);       // contentEditable 容器
    useImperativeHandle(ref, () => ({
        getContent: () => {
            const { text, mentions } = extractCommentPayload(boxRef.current!);
            return {
                content: text,
                mentions: mentions
            };
        },
    }));


    useEffect(
        () => {
            console.log(props?.defaultValue)
            setContentValue(splitByMentions(props?.defaultValue?.content || '', props.defaultValue?.mentions || []))
        },
        [props.defaultValue]
    );

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            const inDropdown = !!dropdownRef.current?.contains(target);
            const inPopover = !!popoverRef.current?.contains(target);

            // 点击不在下拉里 -> 关下拉
            if (!inDropdown) {
                setDropdown((d) => (d.visible ? { ...d, visible: false } : d));
            }

            // 点击不在 popover 里 -> 关 popover（不依赖闭包里的 popover.visible）
            if (!inPopover) {
                setPopover((p) => (p.visible ? { ...p, visible: false } : p));
            }

            // 两个都不是，就把全局遮罩也关了
            if (!inDropdown && !inPopover) {
                setActiveOverlay?.(false);
            }
        };

        // 用 pointerdown 更稳
        document.addEventListener("pointerdown", handlePointerDown, { capture: true });
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
        };
    }, [setActiveOverlay]); // 不要把 popover/dropdown 放依赖里，避免重复绑定


    useLayoutEffect(() => {
        if (!popover.visible || !popover.anchorEl) return;
        const pop = popoverRef.current;
        const container = containerRef.current;
        if (!pop || !container) return;

        // 读取最新 rect（避免过期）
        const anchorRect = popover.anchorEl.getBoundingClientRect();
        const size = { w: pop.offsetWidth, h: pop.offsetHeight };

        const { left, top } = calcInContainer(anchorRect, container, size, 6);
        // 你需要的额外下移
        setPopover(p => ({ ...p, left, top: top + 16 }));
    }, [popover.visible, popover.anchorEl, containerRef]);


    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.target as HTMLElement;
        console.log("uid:", el.dataset.uid)
        if (el.classList.contains("mention")) {
            setPopover({
                visible: true,
                anchorEl: el, // 存元素
                mention: memberMap[el.dataset.uid || ""],
            });
            setActiveOverlay?.(true);
        } else {
            setPopover({ visible: false });
        }
    };

    const handleMentionClick = (e: React.MouseEvent<HTMLSpanElement>, m: any) => {
        setPopover({
            visible: true,
            anchorEl: e.currentTarget,  // 只存元素
            mention: m.member,
        });
        setActiveOverlay?.(true);
    };

    // 插入 mention
    const insertMention = (m: WorkspaceMember) => {
        if (!dropdown.range) return;

        const range = dropdown.range;          // 已经覆盖了 @keyword
        range.deleteContents();                // 1) 删除 @keyword

        // 2) 构造 mention 节点
        const span = document.createElement('span');
        span.className = 'mention';
        span.dataset.uid = m.id;
        span.textContent = `@${m.workspace_nickname || m.user_nickname || m.email}`;
        span.contentEditable = 'false';

        // 3) 插进 DOM
        range.insertNode(span);

        // 4) 把光标移动到 span 之后
        range.setStartAfter(span);             // 起点到 span 后
        range.setEndAfter(span);               // 终点也到 span 后
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);                 // 更新 selection
        }

        // 5) 插入空格（此时在 span 后）
        document.execCommand('insertText', false, ' ');

        // 6) 关闭下拉
        setDropdown(d => ({ ...d, visible: false }));
    };
    // 输入触发 (@ 检测 & keyword 更新)
    const handleInput = () => {
        const sel = document.getSelection();
        if (!sel) return;
        const node = sel.anchorNode;
        if (!node) return;

        const charBefore = sel.anchorOffset > 0 && node.textContent
            ? node.textContent[sel.anchorOffset - 1]
            : null;
        // ① 刚输入 @ ：打开下拉
        if (!dropdown.visible && charBefore === '@') {
            const range = sel.getRangeAt(0).cloneRange();
            range.setStart(node, sel.anchorOffset - 1);
            const anchor = range.getClientRects().item(range.getClientRects().length - 1)!;
            const size = {
                w: dropdownRef.current?.offsetWidth ?? 200,
                h: dropdownRef.current?.offsetHeight ?? 180,
            };
            const container = containerRef.current!;
            const { left, top } = calcInContainer(anchor, container, size, 6);
            setDropdown({
                visible: true,
                top: top + 30, // 30px为偏移高度
                left,
                keyword: '',
                range,              // 记录插入位置
            });
            setActiveOverlay?.(true);
            return;
        }
        // ② 下拉已打开：实时更新 keyword / 自动关闭
        if (dropdown.visible) {
            const kwRange = dropdown.range!.cloneRange();
            kwRange.setEnd(sel.anchorNode!, sel.anchorOffset);
            if (kwRange.toString() == "") {
                console.log("handleInput", "empty range");
                setDropdown(d => ({ ...d, visible: false }));
                setActiveOverlay?.(false);
                return;
            }
            const kw = kwRange.toString().replace(/^@/, '');
            if (/[\s@]/.test(kw)) {
                setDropdown(d => ({ ...d, visible: false }));
                setActiveOverlay?.(false);
            } else {
                setSearchParams(d => ({ ...d, keywords: kw }));
            }
        }
    };
    useEffect(() => {
        if (!popover.visible || !popover.anchorEl) return;

        const rerender = () => {
            // 触发上面的 useLayoutEffect 重新测量
            setPopover(p => ({ ...p }));
        };

        const container = containerRef.current;
        container?.addEventListener("scroll", rerender, { passive: true });
        window.addEventListener("resize", rerender);

        // 如果容器外还有滚动父级，必要时也加监听（见下方可选增强）
        return () => {
            container?.removeEventListener("scroll", rerender);
            window.removeEventListener("resize", rerender);
        };
    }, [popover.visible, popover.anchorEl, containerRef]);
    return (
        <>
            <div ref={containerRef} style={{ position: 'relative' }}>
                {/* 输入框 */}
                <div
                    ref={boxRef}
                    contentEditable
                    aria-placeholder="输入评论，可 @ 提及"
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onClick={handleClick}
                    style={{
                        outline: 'none', whiteSpace: 'pre-wrap',
                        ...(props.inputStyle || {})
                    }}
                >
                    {contentValue.map((p, idx) =>
                        p.type === 'text' ? (
                            <span key={`t-${idx}`}>{p.text}</span>
                        ) : (
                            <span
                                key={`m-${idx}`}
                                className="mention inline px-0.5 rounded cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                                data-uid={p.data.member_id}
                                data-label={p.label}
                                contentEditable={false}
                                onClick={(event) => handleMentionClick(event, p.data)}
                            >
                                {p.label}
                            </span>
                        )
                    )}

                </div>

                {/* 下拉列表 */}
                {dropdown.visible && (
                    <Listbox className="border border-gray-200 bg-white dark:bg-black absolute overflow-y-auto z-20" ref={dropdownRef} aria-label="Listbox menu with sections" variant="flat"
                        style={{
                            top: dropdown.top + 4, left: dropdown.left,
                            width: 160, maxHeight: 200,
                            borderRadius: 4,
                        }}
                    >
                        <ListboxSection title={t`Members`}>
                            {
                                (members || []).map(member => (
                                    <>
                                        <ListboxItem className="data-[focus-visible=true]:bg-default/40 data-[focus-visible=true]:dark:bg-default/40" key={member.id} onClick={e => { e.preventDefault(); insertMention(member); }}>
                                            <div className="flex gap-2 items-center">
                                                <Avatar className="w-5 h-5" src={member.avatar}></Avatar>
                                                <span className="text-xs text-gray-500 dark:text-white">
                                                    {member.workspace_nickname || member.user_nickname || member.email}
                                                </span>
                                            </div>
                                        </ListboxItem>
                                    </>
                                ))
                            }
                        </ListboxSection>
                    </Listbox>
                )}

                {/* Popover */}
                {popover.visible && popover.mention && containerRef.current &&
                    createPortal(
                        <div ref={popoverRef} className="absolute z-30" style={{ left: popover.left, top: popover.top }}>
                            <MemberCard member={popover.mention} />
                        </div>,
                        containerRef.current
                    )
                }

                {/* mention 样式 */}
                <style>{`
        .mention{
          background:#eff6ff;
          color:#1d4ed8;
          padding:0 2px;
          border-radius:3px;
          cursor:pointer;
          user-select:none;
        }
        .mention:hover{background:#dbeafe;}
        [contenteditable]:empty:before{
          content:attr(placeholder);
          color:#aaa;
        }
      `}</style>
            </div>
        </>
    )
})

export default CommentContent;