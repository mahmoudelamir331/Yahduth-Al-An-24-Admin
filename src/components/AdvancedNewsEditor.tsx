"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Youtube as YoutubeIcon, Link as ReadAlsoIcon, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdvancedNewsEditor({ initialContent = "", onChange }: { initialContent?: string; onChange?: (content: string) => void }) {
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Youtube.configure({
        inline: false,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl shadow-lg border border-glass-border/30 my-4'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-bold cursor-pointer hover:text-primary/80 transition-colors'
        }
      }),
      CharacterCount,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-6'
      }
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    }
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("أدخل رابط الصورة (URL)");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    const url = window.prompt("أدخل رابط فيديو اليوتيوب");
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: Math.max(320, parseInt('100%', 10)) as number,
        height: Math.max(180, parseInt('100%', 10)) as number,
      });
    }
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('أدخل الرابط', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addReadAlso = () => {
    const title = window.prompt("اكتب عنوان الخبر المرتبط");
    const url = window.prompt("حط رابط الخبر المرتبط");
    
    if (title && url) {
      editor.chain().focus().insertContent(`
        <div class="my-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col gap-2 shadow-sm">
          <strong class="text-primary flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">✨</span>اقرأ أيضاً:</strong>
          <a href="${url}" class="text-foreground hover:text-primary transition-colors hover:underline text-lg font-bold block pr-8">${title}</a>
        </div>
        <p></p>
      `).run();
    }
  };

  return (
    <div className="glass-card flex flex-col overflow-hidden text-foreground">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white/20 dark:bg-black/20 border-b border-glass-border/30">
        
        {/* Undo / Redo (Simulating zoom functionality conceptually or standard editor tools) */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-black/40 disabled:opacity-30"><Minus size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-black/40 disabled:opacity-30"><Plus size={16} /></button>
        </div>

        <div className="w-px h-6 bg-glass-border/50 mx-1" />

        {/* Text styling */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('bold') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Bold size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('italic') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Italic size={16} /></button>
        </div>

        <div className="w-px h-6 bg-glass-border/50 mx-1" />

        {/* Headings */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('heading', { level: 2 }) ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Heading2 size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('heading', { level: 3 }) ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Heading3 size={16} /></button>
        </div>
        
        <div className="w-px h-6 bg-glass-border/50 mx-1" />

        {/* Alignment */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={cn("p-2 rounded-md transition-colors", editor.isActive({ textAlign: 'right' }) ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><AlignRight size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={cn("p-2 rounded-md transition-colors", editor.isActive({ textAlign: 'center' }) ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><AlignCenter size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={cn("p-2 rounded-md transition-colors", editor.isActive({ textAlign: 'left' }) ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><AlignLeft size={16} /></button>
        </div>

        <div className="w-px h-6 bg-glass-border/50 mx-1" />

        {/* Lists & Quotes */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('bulletList') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><List size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('orderedList') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><ListOrdered size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn("p-2 rounded-md transition-colors", editor.isActive('blockquote') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Quote size={16} /></button>
        </div>

        <div className="w-px h-6 bg-glass-border/50 mx-1" />

        {/* Embeds & Links */}
        <div className="flex bg-white/30 dark:bg-black/30 rounded-lg p-1 border border-glass-border/30">
            <button type="button" onClick={addLink} className={cn("p-2 rounded-md transition-colors", editor.isActive('link') ? "bg-primary text-primary-foreground" : "hover:bg-white/40 dark:hover:bg-black/40")}><Link2 size={16} /></button>
            <button type="button" onClick={addImage} className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-black/40"><ImagePlus size={16} /></button>
            <button type="button" onClick={addYoutube} className="p-2 rounded-md hover:bg-white/40 dark:hover:bg-black/40"><YoutubeIcon size={16} /></button>
        </div>

        <div className="mr-auto">
            <button type="button" onClick={addReadAlso} className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 py-1.5 px-3 rounded-lg text-sm font-semibold transition-colors">
                <ReadAlsoIcon size={16} />
                اقرأ أيضاً
            </button>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-black/10">
        <EditorContent editor={editor} />
      </div>

      <div className="bg-white/20 dark:bg-black/20 border-t border-glass-border/30 px-4 py-3 flex items-center justify-between text-xs opacity-90">
        <div className={cn("font-bold font-mono px-3 py-1 rounded-lg flex items-center gap-2", 
            (editor.storage.characterCount.words() < 5 || editor.storage.characterCount.words() > 10000) 
            ? "bg-danger/20 text-danger border border-danger/30 shadow-sm" 
            : "bg-background/40"
        )}>
            {editor.storage.characterCount.words()} كـلـمة
            {editor.storage.characterCount.words() > 0 && editor.storage.characterCount.words() < 5 && <span className="opacity-80 font-normal"> (الأدنى 5 كلمات)</span>}
            {editor.storage.characterCount.words() > 10000 && <span className="opacity-80 font-normal"> (الأقصى 10,000)</span>}
        </div>
        <div className="opacity-70">
            استخدم الأدوات المخصصة لصناعة محتوى غني وتفاعلي
        </div>
      </div>
    </div>
  );
}
