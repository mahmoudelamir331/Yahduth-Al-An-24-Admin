"use client";

import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AlignCenter, AlignLeft, AlignRight, Bold, ImagePlus, Italic, Link, List, Quote, Redo2, Undo2 } from "lucide-react";
import type { ChangeEvent } from "react";

export default function NewsEditor({ onChange }: { onChange?: (html: string) => void }) {
  const editor = useEditor({ extensions: [StarterKit, Placeholder.configure({ placeholder: "اكتب تفاصيل الخبر هنا..." }), TextStyle, Color, TextAlign.configure({ types: ["heading", "paragraph"] }), LinkExtension.configure({ openOnClick: false }), Image], content: "", immediatelyRender: false, onUpdate: ({ editor }) => onChange?.(editor.getHTML()) });
  if (!editor) return <div className="h-36 animate-pulse rounded-lg bg-muted" />;
  const run = (action: () => boolean) => { action(); editor.view.focus(); };
  const addLink = () => { const url = window.prompt("اكتب الرابط"); if (url) editor.chain().focus().setLink({ href: url }).run(); };
  const addImage = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const form = new FormData(); form.append("file", file); const response = await fetch("/api/media", { method: "POST", body: form }); const result = await response.json() as { url?: string }; if (response.ok && result.url) editor.chain().focus().setImage({ src: result.url, alt: file.name }).run(); };
  return <div className="overflow-hidden rounded-lg border"><div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
    <select aria-label="نمط العنوان" className="h-8 rounded border bg-card px-2 text-xs" defaultValue="paragraph" onChange={event => { const value = event.target.value; if (value === "paragraph") { editor.chain().focus().setParagraph().run(); } else { editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 }).run(); } }}><option value="paragraph">نص عادي</option><option value="1">عنوان رئيسي</option><option value="2">عنوان فرعي</option></select>
    <button type="button" onClick={() => run(() => editor.chain().focus().toggleBold().run())} className="toolbar-button" aria-label="خط عريض"><Bold size={16} /></button><button type="button" onClick={() => run(() => editor.chain().focus().toggleItalic().run())} className="toolbar-button" aria-label="خط مائل"><Italic size={16} /></button><button type="button" onClick={() => run(() => editor.chain().focus().toggleBulletList().run())} className="toolbar-button" aria-label="قائمة نقطية"><List size={16} /></button><button type="button" onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())} className="toolbar-button" aria-label="اقتباس"><Quote size={16} /></button>
    <span className="mx-1 h-6 w-px bg-border" /><button type="button" onClick={() => run(() => editor.chain().focus().setTextAlign("right").run())} className="toolbar-button" aria-label="محاذاة يمين"><AlignRight size={16} /></button><button type="button" onClick={() => run(() => editor.chain().focus().setTextAlign("center").run())} className="toolbar-button" aria-label="محاذاة النص"><AlignCenter size={16} /></button><button type="button" onClick={() => run(() => editor.chain().focus().setTextAlign("left").run())} className="toolbar-button" aria-label="محاذاة شمال"><AlignLeft size={16} /></button>
    <label className="toolbar-button cursor-pointer" aria-label="إضافة صورة"><ImagePlus size={16} /><input type="file" accept="image/*" className="hidden" onChange={addImage} /></label><button type="button" onClick={addLink} className="toolbar-button" aria-label="إضافة رابط"><Link size={16} /></button><label className="flex h-8 items-center gap-1 rounded px-1 text-xs" title="لون الخط"><span className="sr-only">لون الخط</span><input type="color" onChange={event => editor.chain().focus().setColor(event.target.value).run()} /></label><button type="button" onClick={() => editor.chain().focus().undo().run()} className="toolbar-button" aria-label="تراجع"><Undo2 size={16} /></button><button type="button" onClick={() => editor.chain().focus().redo().run()} className="toolbar-button" aria-label="إعادة"><Redo2 size={16} /></button>
  </div><EditorContent editor={editor} className="prose prose-sm min-h-40 max-w-none p-4 outline-none" /></div>;
}
