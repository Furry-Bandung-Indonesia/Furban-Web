<template>
  <div class="tiptap-editor rounded-lg border bg-slate-900 ring-1 ring-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-[#0df2f2]">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-700 bg-slate-800/50">
      <!-- Text Style -->
      <button type="button" @click="editor?.chain().focus().toggleBold().run()" :class="btnClass(editor?.isActive('bold'))" title="Bold">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleItalic().run()" :class="btnClass(editor?.isActive('italic'))" title="Italic">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleUnderline().run()" :class="btnClass(editor?.isActive('underline'))" title="Underline">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleStrike().run()" :class="btnClass(editor?.isActive('strike'))" title="Strikethrough">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5c0-2-1.5-3.5-4-3.5H8v7"/><path d="M8 16.5c0 2 1.5 3.5 4 3.5h1.5c2.5 0 4-1.5 4-3.5"/></svg>
      </button>

      <div class="w-px h-5 bg-slate-700 mx-1"></div>

      <!-- Headings -->
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()" :class="btnClass(editor?.isActive('heading', { level: 2 }))" title="Heading 2">
        <span class="text-xs font-bold">H2</span>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()" :class="btnClass(editor?.isActive('heading', { level: 3 }))" title="Heading 3">
        <span class="text-xs font-bold">H3</span>
      </button>

      <div class="w-px h-5 bg-slate-700 mx-1"></div>

      <!-- Lists -->
      <button type="button" @click="editor?.chain().focus().toggleBulletList().run()" :class="btnClass(editor?.isActive('bulletList'))" title="Bullet List">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().toggleOrderedList().run()" :class="btnClass(editor?.isActive('orderedList'))" title="Ordered List">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fill="currentColor" font-size="8" stroke="none">1</text><text x="2" y="14" fill="currentColor" font-size="8" stroke="none">2</text><text x="2" y="20" fill="currentColor" font-size="8" stroke="none">3</text></svg>
      </button>

      <div class="w-px h-5 bg-slate-700 mx-1"></div>

      <!-- Block elements -->
      <button type="button" @click="editor?.chain().focus().toggleBlockquote().run()" :class="btnClass(editor?.isActive('blockquote'))" title="Quote">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().setHorizontalRule().run()" class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Horizontal Rule">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
      </button>

      <div class="w-px h-5 bg-slate-700 mx-1"></div>

      <!-- Alignment -->
      <button type="button" @click="editor?.chain().focus().setTextAlign('left').run()" :class="btnClass(editor?.isActive({ textAlign: 'left' }))" title="Align Left">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().setTextAlign('center').run()" :class="btnClass(editor?.isActive({ textAlign: 'center' }))" title="Align Center">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="5" y1="18" x2="19" y2="18"/></svg>
      </button>

      <div class="w-px h-5 bg-slate-700 mx-1"></div>

      <!-- Link -->
      <button type="button" @click="setLink" :class="btnClass(editor?.isActive('link'))" title="Add Link">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>

      <div class="flex-1"></div>

      <!-- Undo/Redo -->
      <button type="button" @click="editor?.chain().focus().undo().run()" class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Undo">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
      </button>
      <button type="button" @click="editor?.chain().focus().redo().run()" class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Redo">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
      </button>
    </div>

    <!-- Editor Content -->
    <editor-content :editor="editor" class="tiptap-content" />
  </div>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Start writing...' },
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-[#0df2f2] underline' },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      HTMLAttributes: { class: 'bg-yellow-500/30 rounded px-0.5' },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-invert prose-sm max-w-none px-4 py-3 min-h-[120px] max-h-[400px] overflow-y-auto focus:outline-none text-white',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function btnClass(isActive) {
  return [
    'p-1.5 rounded transition-colors',
    isActive
      ? 'bg-[#0df2f2]/20 text-[#0df2f2]'
      : 'text-slate-400 hover:text-white hover:bg-slate-700',
  ]
}

function setLink() {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('Enter URL:')
  if (url) {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}
</script>

<style>
/* TipTap editor styles */
.tiptap-content .ProseMirror {
  outline: none;
}

.tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #64748b;
  pointer-events: none;
  height: 0;
}

.tiptap-content .ProseMirror h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: white;
}

.tiptap-content .ProseMirror h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
  color: white;
}

.tiptap-content .ProseMirror p {
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.tiptap-content .ProseMirror ul,
.tiptap-content .ProseMirror ol {
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.tiptap-content .ProseMirror ul {
  list-style-type: disc;
}

.tiptap-content .ProseMirror ol {
  list-style-type: decimal;
}

.tiptap-content .ProseMirror li {
  margin-bottom: 0.25rem;
}

.tiptap-content .ProseMirror blockquote {
  border-left: 3px solid #0df2f2;
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 0.5rem;
  color: #94a3b8;
  font-style: italic;
}

.tiptap-content .ProseMirror hr {
  border: none;
  border-top: 1px solid #334155;
  margin: 1rem 0;
}

.tiptap-content .ProseMirror a {
  color: #0df2f2;
  text-decoration: underline;
}
</style>
