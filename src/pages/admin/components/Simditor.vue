<template>
  <textarea ref="editor"></textarea>
</template>

<script>
// ✅ Simditor ต้องการ jQuery อยู่บน window
import $ from 'jquery'
window.$ = window.jQuery = $

import Simditor from 'tar-simditor'
import 'tar-simditor/styles/simditor.css'
import 'tar-simditor-markdown'
import 'tar-simditor-markdown/styles/simditor-markdown.css'
import './simditor-file-upload'

export default {
  name: 'Simditor',
  props: {
    toolbar: {
      type: Array,
      default: () => ([
        'title', 'bold', 'italic', 'underline', 'fontScale', 'color',
        'ol', 'ul', '|', 'blockquote', 'code', 'link', 'table', 'image',
        'uploadfile', 'hr', '|', 'indent', 'outdent', 'alignment', '|', 'markdown'
      ])
    },
    value: { type: String, default: '' }   // รองรับ v-model
  },
  data () {
    return {
      editor: null,
      syncing: false
    }
  },
  mounted () {
    // ❗️ไม่มีการเรียก Simditor.connect ที่ใดทั้งสิ้น
    this.editor = new Simditor({
      textarea: this.$refs.editor,
      toolbar: this.toolbar,
      pasteImage: true,
      // ถ้าใช้ปลั๊กอิน markdown ไม่ต้องตั้ง 'markdown: true/false' ก็ได้
      upload: {
        url: '/api/admin/upload_image/',
        params: null,
        fileKey: 'image',
        connectionCount: 3,
        leaveConfirm: this.$i18n ? this.$i18n.t('m.Uploading_is_in_progress') : 'Uploading...'
      },
      allowedStyles: { span: ['color'] }
    })

    // ค่าแรกเข้า
    this.editor.setValue(this.value || '')

    // sync → parent v-model
    const syncOut = () => {
      if (this.syncing) return
      this.syncing = true
      const val = this.editor.getValue()
      this.$emit('input', val)
      this.$emit('change', val)
      this.syncing = false
    }
    this.editor.on('valuechanged', syncOut)
    this.editor.on('decorate', syncOut)
  },
  watch: {
    // parent → editor
    value (val) {
      if (!this.editor) return
      const cur = this.editor.getValue()
      if (val !== cur) {
        // ป้องกัน loop
        this.syncing = true
        this.editor.setValue(val || '')
        this.syncing = false
      }
    }
  },
  beforeDestroy () {
    if (this.editor && this.editor.destroy) {
      this.editor.destroy()
      this.editor = null
    }
  }
}
</script>

<style lang="less" scoped>
/* ใส่สไตล์เสริมได้ตามต้องการ */
</style>
