import { reactive } from 'vue'

// Keep an unfinished story while the reader signs in, without persisting it.
export const boardDraft = reactive({ title: '', contents: '' })
