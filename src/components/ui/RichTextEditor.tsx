"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const btn = (active: boolean, onClick: () => void, label: string, title: string) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="text-sm font-bold px-2 py-1 rounded transition"
      style={{
        background: active ? "var(--color-primary)" : "transparent",
        color: active ? "#fff" : "var(--color-text)",
        border: "1px solid var(--color-border)",
        minWidth: 28,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="flex flex-wrap gap-1 p-2"
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "T1", "Titre 1")}
      {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "T2", "Titre 2")}
      {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "T3", "Titre 3")}
      <span style={{ width: 1, background: "var(--color-border)", margin: "0 4px" }} />
      {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "B", "Gras (Ctrl+B)")}
      {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "I", "Italique (Ctrl+I)")}
      {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "S", "Barré")}
      <span style={{ width: 1, background: "var(--color-border)", margin: "0 4px" }} />
      {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "•", "Liste à puces")}
      {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1.", "Liste numérotée")}
      {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "❝", "Citation")}
      {btn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), "</>", "Code")}
      <span style={{ width: 1, background: "var(--color-border)", margin: "0 4px" }} />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        title="Annuler"
        className="text-sm px-2 py-1 rounded"
        style={{ border: "1px solid var(--color-border)" }}
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        title="Rétablir"
        className="text-sm px-2 py-1 rounded"
        style={{ border: "1px solid var(--color-border)" }}
      >
        ↷
      </button>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 240 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Keep paragraphs and other defaults; enable paste of formatted content.
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        spellcheck: "true",
        style: `min-height: ${minHeight}px; padding: 14px 16px; outline: none;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Treat truly empty editor as empty string
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Re-sync when the external value changes (e.g. switching record)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "<p></p>";
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  return (
    <div
      className="rich-editor"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <Toolbar editor={editor} />
      <div style={{ position: "relative" }}>
        {editor && editor.isEmpty && placeholder && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 16,
              color: "var(--color-text-muted)",
              pointerEvents: "none",
              fontSize: 14,
              whiteSpace: "pre-line",
            }}
          >
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
