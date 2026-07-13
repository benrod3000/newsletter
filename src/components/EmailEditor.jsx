import { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

const MERGE_TAGS = [
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{last_name}}', label: 'Last Name' },
  { tag: '{{email}}', label: 'Email' },
  { tag: '{{unsubscribe}}', label: 'Unsubscribe Link' },
  { tag: '{{preferences}}', label: 'Preferences Link' },
]

const ToolbarButton = ({ active, onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 text-xs font-bold uppercase tracking-wider border-2 transition ${
      active
        ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg'
        : 'border-transparent text-brutal-fg/50 hover:text-brutal-fg hover:border-brutal-fg'
    }`}
  >
    {children}
  </button>
)

export default function EmailEditor({ content, onChange, onSave, saving }) {
  const [showTags, setShowTags] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'underline text-brutal-green' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full border-2 border-brutal-fg' } }),
      Placeholder.configure({ placeholder: 'Start writing your newsletter...' }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    autofocus: false,
  })

  const insertMergeTag = useCallback((tag) => {
    if (!editor) return
    editor.chain().focus().insertContent(tag).run()
    setShowTags(false)
  }, [editor])

  const addLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="border-3 border-brutal-fg bg-white">
      {/* Toolbar */}
      <div className="border-b-3 border-brutal-fg bg-brutal-bg px-3 py-2 flex flex-wrap items-center gap-1">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">B</ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">I</ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">• List</ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">1. List</ToolbarButton>
        <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="Add Link">🔗</ToolbarButton>
        <ToolbarButton active={false} onClick={addImage} title="Add Image">🖼</ToolbarButton>

        <span className="w-px h-5 bg-brutal-fg/20 mx-1" />

        {/* Merge Tags */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className={`px-2 py-1 text-xs font-bold uppercase tracking-wider border-2 transition ${
              showTags
                ? 'border-brutal-fg bg-brutal-green text-white'
                : 'border-transparent text-brutal-fg/50 hover:text-brutal-fg hover:border-brutal-fg'
            }`}
          >
            {'{ }'} Tags
          </button>

          {showTags && (
            <div className="absolute top-full left-0 mt-1 border-3 border-brutal-fg bg-white shadow-brutal z-10 min-w-[180px]">
              {MERGE_TAGS.map((mt) => (
                <button
                  key={mt.tag}
                  type="button"
                  onClick={() => insertMergeTag(mt.tag)}
                  className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-brutal-yellow transition-colors border-b border-brutal-fg/10 last:border-0"
                >
                  <span className="text-brutal-green font-bold">{mt.tag}</span>
                  <span className="block text-[10px] text-brutal-muted uppercase tracking-wider">{mt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <span className="flex-1" />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}
