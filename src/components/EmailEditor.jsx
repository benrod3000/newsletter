import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import DOMPurify from 'dompurify'
import { getAuthToken } from '../lib/api'
import PromptModal from './PromptModal'

/** Reject anything that isn't an http(s) URL — notably javascript: hrefs. */
function validateUrl(value) {
  if (!value) return 'Enter a URL'
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Only http:// and https:// links are allowed'
    }
    return ''
  } catch {
    return 'Enter a full URL, including https://'
  }
}

const MERGE_TAGS = [
  { tag: '{{first_name}}', label: 'First Name' },
  { tag: '{{last_name}}', label: 'Last Name' },
  { tag: '{{email}}', label: 'Email' },
  { tag: '{{unsubscribe_url}}', label: 'Unsubscribe Link' },
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
  const [linkPromptOpen, setLinkPromptOpen] = useState(false)
  const [imagePromptOpen, setImagePromptOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(null) // null=edit, 'mobile'
  const [splitMode, setSplitMode] = useState(false) // side-by-side editor + preview
  const [htmlMode, setHtmlMode] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'unsaved' | 'saving' | 'saved'
  const saveTimer = useRef(null)

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
      setSaveStatus('unsaved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        setSaveStatus('saving')
        onSave?.()
      }, 1500)
    },
    autofocus: false,
  })

  const insertMergeTag = useCallback((tag) => {
    if (!editor) return
    editor.chain().focus().insertContent(tag).run()
    setShowTags(false)
  }, [editor])

  const addLink = useCallback((url) => {
    setLinkPromptOpen(false)
    if (editor && url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback((url) => {
    setImagePromptOpen(false)
    if (editor && url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const toggleHtmlMode = useCallback(() => {
    if (!editor) return
    if (!htmlMode) {
      // Entering HTML mode // capture current content, exit preview
      setHtmlValue(editor.getHTML())
      setPreviewMode(null)
    } else {
      // Exiting HTML mode // apply HTML back to editor
      editor.commands.setContent(htmlValue)
      onChange?.(htmlValue)
    }
    setHtmlMode(!htmlMode)
  }, [editor, htmlMode, htmlValue, onChange])

  // ── Link Checker ──
  const [checkingLinks, setCheckingLinks] = useState(false)
  const [linkResults, setLinkResults] = useState(null) // null | { total, valid, broken, results: [] }

  const checkLinks = useCallback(async () => {
    if (!editor) return
    const html = editor.getHTML()
    setCheckingLinks(true)
    setLinkResults(null)
    try {
      const token = getAuthToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/admin/validate-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ html }),
      })
      const data = await res.json()
      setLinkResults({
        total: data.links?.length || 0,
        valid: data.validationResults?.filter(r => r.valid)?.length || 0,
        broken: data.brokenLinks?.length || 0,
        results: data.validationResults || [],
        missingUnsub: data.unsubscribeTagMissing,
      })
    } catch {
      setLinkResults({ total: 0, valid: 0, broken: 0, results: [], missingUnsub: false, error: 'Failed to validate links' })
    } finally {
      setCheckingLinks(false)
    }
  }, [editor])

  // Sync save status with parent saving state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!saving && saveStatus === 'saving') setSaveStatus('saved')
    if (saving) setSaveStatus('saving')
  }, [saving, saveStatus])

  if (!editor) return null

  const statusBadge = {
    idle: null,
    unsaved: { text: 'Unsaved', cls: 'bg-brutal-red text-white' },
    saving: { text: 'Saving...', cls: 'bg-brutal-yellow text-brutal-fg' },
    saved: { text: 'Saved ✓', cls: 'bg-brutal-green text-white' },
  }[saveStatus]

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
        <ToolbarButton active={editor.isActive('link')} onClick={() => setLinkPromptOpen(true)} title="Add Link">🔗</ToolbarButton>
        <ToolbarButton active={false} onClick={() => setImagePromptOpen(true)} title="Add Image">🖼</ToolbarButton>

        <span className="flex-1" />

        {/* Save status badge */}
        {statusBadge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border-2 border-brutal-fg ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
        )}

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

        {/* Link checker */}
        <button
          type="button"
          onClick={checkLinks}
          disabled={checkingLinks}
          className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2 border-transparent hover:border-brutal-fg transition text-brutal-fg/50 hover:text-brutal-fg disabled:opacity-40"
        >
          {checkingLinks ? '🔍 Checking...' : '🔗 Check Links'}
        </button>

        {/* Save + Preview */}
        <span className="flex-1" />
        <button
          type="button"
          onClick={toggleHtmlMode}
          className={`px-3 py-1 border-3 font-bold text-[10px] uppercase tracking-wider transition ${
            htmlMode ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg' : 'border-transparent text-brutal-fg/50 hover:text-brutal-fg hover:border-brutal-fg'
          }`}
        >
          {'<>'} HTML
        </button>
        <button
          type="button"
          onClick={() => { setSplitMode(!splitMode); setPreviewMode(null); setHtmlMode(false) }}
          className={`px-3 py-1 border-3 font-bold text-[10px] uppercase tracking-wider transition ${
            splitMode ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg' : 'border-transparent text-brutal-fg/50 hover:text-brutal-fg hover:border-brutal-fg'
          }`}
        >
          {splitMode ? '✕ Split' : '◧ Split'}
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode(previewMode ? null : 'mobile')}
          className={`px-3 py-1 border-3 font-bold text-[10px] uppercase tracking-wider transition ${
            previewMode ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg' : 'border-transparent text-brutal-fg/50 hover:text-brutal-fg hover:border-brutal-fg'
          }`}
        >
          {previewMode ? '✏️ Edit' : '📱 Preview'}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Link Checker Results */}
      {linkResults && (
        <div className="border-b-3 border-brutal-fg bg-brutal-bg px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider">
              🔗 Link Check: {linkResults.total} total,{' '}
              <span className="text-brutal-green">{linkResults.valid} valid</span>
              {linkResults.broken > 0 && (
                <><span className="text-brutal-muted">, </span><span className="text-brutal-red">{linkResults.broken} broken</span></>
              )}
            </p>
            <button onClick={() => setLinkResults(null)} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg">×</button>
          </div>
          {linkResults.missingUnsub && (
            <p className="text-[10px] text-brutal-red font-bold">⚠️ Missing <code className="bg-white px-1">{'{{unsubscribe_url}}'}</code> tag. Add it for CAN-SPAM compliance</p>
          )}
          {linkResults.results.filter(r => !r.valid).map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <span className="text-brutal-red shrink-0">✗</span>
              <span className="font-mono break-all text-brutal-red">{r.url}</span>
              {r.statusCode && <span className="text-brutal-muted shrink-0">(HTTP {r.statusCode})</span>}
            </div>
          ))}
          {linkResults.error && <p className="text-[10px] text-brutal-red font-bold">⚠️ {linkResults.error}</p>}
          {linkResults.broken === 0 && !linkResults.missingUnsub && (
            <p className="text-[10px] text-brutal-green font-bold">✓ All links look good</p>
          )}
        </div>
      )}

      {/* Editor / Preview */}
      {htmlMode ? (
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
            Paste or edit raw HTML. Switch back to visual mode when done.
          </p>
          <textarea
            value={htmlValue}
            onChange={e => setHtmlValue(e.target.value)}
            className="w-full min-h-[300px] px-4 py-3 bg-brutal-bg border-3 border-brutal-fg font-mono text-sm leading-relaxed focus:outline-none focus:bg-brutal-yellow/10 resize-y"
            spellCheck={false}
          />
        </div>
      ) : splitMode ? (
        <div className="flex flex-col lg:flex-row divide-y-3 lg:divide-y-0 lg:divide-x-3 divide-brutal-fg min-h-[300px]">
          {/* Left: Editor */}
          <div className="flex-1">
            <div className="border-b-2 border-brutal-fg/20 bg-brutal-surface px-3 py-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">✏️ Editor</span>
            </div>
            <EditorContent editor={editor} />
          </div>
          {/* Right: Rendered Preview */}
          <div className="flex-1 bg-white">
            <div className="border-b-2 border-brutal-fg/20 bg-brutal-surface px-3 py-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">📱 Preview</span>
            </div>
            <div className="p-4 prose prose-sm max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editor?.getHTML() || '') }} />
          </div>
        </div>
      ) : (
        <div className={previewMode === 'mobile' ? 'max-w-[375px] mx-auto border-x-3 border-brutal-fg' : ''}>
          <EditorContent editor={editor} />
        </div>
      )}

      <PromptModal
        open={linkPromptOpen}
        title="Add link"
        label="URL"
        type="url"
        placeholder="https://example.com"
        confirmLabel="Add link"
        validate={validateUrl}
        onSubmit={addLink}
        onCancel={() => setLinkPromptOpen(false)}
      />

      <PromptModal
        open={imagePromptOpen}
        title="Add image"
        label="Image URL"
        type="url"
        placeholder="https://example.com/image.png"
        confirmLabel="Add image"
        validate={validateUrl}
        onSubmit={addImage}
        onCancel={() => setImagePromptOpen(false)}
      />
    </div>
  )
}
