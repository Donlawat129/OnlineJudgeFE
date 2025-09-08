<template>
  <div class="view">
    <Panel :title="contestId ? $i18n.t('m.Contest_Problem_List') : $i18n.t('m.Problem_List')">
      <div slot="header">
        <div class="header-container">
          <!-- ปุ่มกลุ่ม/ลบ (โชว์เมื่อเลือกอย่างน้อย 1 รายการ หรือโหมดเลือกทั้งผลลัพธ์) -->
          <div class="bulk-actions-section" v-show="selectedProblemIDs.length || selectAllAcross">
            <el-button
              type="primary"
              icon="el-icon-fa-users"
              size="small"
              class="action-button"
              @click="openGroupDialog"
            >
              Group
            </el-button>
            <el-button
              type="warning"
              icon="el-icon-fa-trash"
              size="small"
              class="action-button"
              :loading="deleteInProgress"
              @click="handleDeleteClick"
            >
              Delete
            </el-button>
          </div>

          <!-- ช่องค้นหาแบบต้นฉบับ (พิมพ์แล้วคิวรีใหม่ผ่าน watcher) -->
          <div class="search-section" :class="{ 'with-buttons': selectedProblemIDs.length || selectAllAcross }">
            <el-input
              v-model="keyword"
              prefix-icon="el-icon-search"
              placeholder="Keywords">
            </el-input>
          </div>
        </div>

        <!-- แถบแจ้งเตือน selection ข้ามหน้า -->
        <div
          v-if="(selectedProblemIDs.length && total) || selectAllAcross"
          class="selection-info"
        >
          <template v-if="!selectAllAcross">
            Selected {{ selectedProblemIDs.length }} on this page.
            <el-link
              v-if="selectedProblemIDs.length === problemList.length && total > problemList.length"
              type="primary"
              :disabled="collecting"
              @click="selectAllAcrossResults"
            >
              Select all {{ total }} results
            </el-link>
          </template>
          <template v-else>
            All {{ total }} results are selected.
          </template>
          <el-link type="danger" @click="clearSelection" :disabled="collecting">Clear</el-link>
        </div>
      </div>

      <el-table
        v-loading="loading || collecting"
        element-loading-text="loading"
        ref="table"
        :data="problemList"
        @row-dblclick="handleDblclick"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column width="100" prop="id" label="ID"></el-table-column>

        <el-table-column width="150" label="Display ID">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row._id}}</span>
            <el-input
              v-show="row.isEditing"
              v-model="row._id"
              @keyup.enter.native="handleInlineEdit(row)">
            </el-input>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="Title">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row.title}}</span>
            <el-input
              v-show="row.isEditing"
              v-model="row.title"
              @keyup.enter.native="handleInlineEdit(row)">
            </el-input>
          </template>
        </el-table-column>

        <el-table-column prop="created_by.username" label="Author"></el-table-column>

        <el-table-column width="200" prop="create_time" label="Create Time">
          <template slot-scope="scope">
            {{ scope.row.create_time | localtime }}
          </template>
        </el-table-column>

        <el-table-column label="Group">
          <template slot-scope="scope">
            <template v-if="scope.row.groups && scope.row.groups.length">
              <el-tag
                v-for="(g,i) in scope.row.groups"
                :key="g+i"
                size="mini"
                style="margin-right:4px"
              >{{ g }}</el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>

        <el-table-column width="100" prop="visible" label="Visible">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.visible"
              active-text=""
              inactive-text=""
              @change="updateProblem(scope.row)">
            </el-switch>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="Operation" width="250">
          <div slot-scope="scope">
            <icon-btn name="Edit" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn
              v-if="contestId"
              name="Make Public"
              icon="clone"
              @click.native="makeContestProblemPublic(scope.row.id)">
            </icon-btn>
            <icon-btn
              icon="download"
              name="Download TestCase"
              @click.native="downloadTestCase(scope.row.id)">
            </icon-btn>
            <icon-btn
              icon="trash"
              name="Delete Problem"
              @click.native="deleteProblems([scope.row.id])">
            </icon-btn>
          </div>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="goCreateProblem">
          Create
        </el-button>

        <el-button
          v-if="contestId"
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="addProblemDialogVisible = true">
          Add From Public Problem
        </el-button>

        <el-pagination
          class="page"
          layout="prev, pager, next"
          :page-size="pageSize"
          :total="total"
          @current-change="currentChange">
        </el-pagination>
      </div>
    </Panel>

    <el-dialog
      title="Sure to update the problem? "
      width="20%"
      :visible.sync="InlineEditDialogVisible"
      @close-on-click-modal="false"
    >
      <div>
        <p>DisplayID: {{ currentRow._id }}</p>
        <p>Title: {{ currentRow.title }}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="InlineEditDialogVisible = false; getProblemList(currentPage)"></cancel>
        <save @click.native="updateProblem(currentRow)"></save>
      </span>
    </el-dialog>

    <el-dialog
      v-if="contestId"
      title="Add Contest Problem"
      width="80%"
      :visible.sync="addProblemDialogVisible"
      @close-on-click-modal="false">
      <add-problem-component :contestID="contestId" @on-change="getProblemList" />
    </el-dialog>

    <!-- Group dialog -->
    <el-dialog
      title="Group selected problems"
      :visible.sync="showGroupDialog"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form :model="groupForm" label-position="top">
        <el-form-item label="Choose existing group">
          <el-select v-model="groupForm.selected" placeholder="Select a group" filterable clearable>
            <el-option
              v-for="g in availableGroups"
              :key="g.id || g.name"
              :label="g.name"
              :value="g.name" />
          </el-select>
        </el-form-item>

        <div style="text-align:center;margin:8px 0;color:#888">— OR —</div>

        <el-form-item label="Create / input a new group name">
          <el-input v-model="groupForm.name" placeholder="e.g. A1 / Beginner / Special" />
        </el-form-item>
      </el-form>

      <div class="right">
        <el-button
          type="text"
          :loading="clearAllSubmitting"
          @click="clearAllGroups">
          Clear all groups
        </el-button>
      </div>

      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showGroupDialog = false">Cancel</cancel>
        <el-button
          type="danger"
          :disabled="!groupForm.selected"
          :loading="removeSubmitting"
          @click="removeFromGroup">
          Remove from group
        </el-button>
        <save @click.native="confirmGroup" :loading="groupSubmitting">Save</save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../../api.js'
import utils from '@/utils/utils'
import AddProblemComponent from './AddPublicProblem.vue'

export default {
  name: 'ProblemList',
  components: { AddProblemComponent },
  data () {
    return {
      pageSize: 10,
      total: 0,
      problemList: [],
      keyword: '',
      loading: false,
      currentPage: 1,
      routeName: '',
      contestId: '',

      currentRow: {},
      InlineEditDialogVisible: false,
      addProblemDialogVisible: false,

      // group
      selectedProblems: [],
      showGroupDialog: false,
      groupSubmitting: false,
      availableGroups: [],
      groupForm: { selected: '', name: '' },
      removeSubmitting: false,
      clearAllSubmitting: false,

      // select-all-across
      selectAllAcross: false,
      selectionFilter: null,   // snapshot ของตัวกรองตอนกด "Select all results"
      collecting: false,       // กำลังรวบรวมไอดีทุกหน้า
      deleteInProgress: false
    }
  },
  mounted () {
    this.routeName = this.$route.name
    this.contestId = this.$route.params.contestId
    this.getProblemList(this.currentPage)
  },
  methods: {
    handleDblclick (row) {
      row.isEditing = true
    },

    // โหลดรายการ
    getProblemList (page = 1) {
      this.loading = true
      const isNormal = this.routeName === 'problem-list'
      const offset = (page - 1) * this.pageSize

      if (isNormal) {
        api.getProblemList(offset, this.pageSize, this.keyword, '')
          .then(res => {
            this.total = res.data.data.total
            this.problemList = res.data.data.results.map(p => ({ ...p, isEditing: false }))
            this.currentPage = page
          })
          .finally(() => { this.loading = false })
      } else {
        api.getContestProblemList(this.contestId, page, this.pageSize)
          .then(res => {
            this.total = res.data.data.total
            this.problemList = res.data.data.results.map(p => ({ ...p, isEditing: false }))
            this.currentPage = page
          })
          .finally(() => { this.loading = false })
      }
    },

    // เปลี่ยนหน้า
    currentChange (page) {
      this.currentPage = page
      this.getProblemList(page)
    },

    goEdit (problemId) {
      if (this.routeName === 'problem-list') {
        this.$router.push({ name: 'edit-problem', params: { problemId } })
      } else if (this.routeName === 'contest-problem-list') {
        this.$router.push({ name: 'edit-contest-problem', params: { problemId, contestId: this.contestId } })
      }
    },

    goCreateProblem () {
      if (this.routeName === 'problem-list') {
        this.$router.push({ name: 'create-problem' })
      } else if (this.routeName === 'contest-problem-list') {
        this.$router.push({ name: 'create-contest-problem', params: { contestId: this.contestId } })
      }
    },

    // ===== Select-all across pages =====
    selectAllAcrossResults () {
      // เซ็ตโหมด "เลือกทั้งหมดทุกหน้า" และ snapshot ฟิลเตอร์ปัจจุบัน
      this.selectAllAcross = true
      this.selectionFilter = {
        keyword: this.keyword,
        routeName: this.routeName,
        contestId: this.contestId
      }
    },
    clearSelection () {
      this.selectAllAcross = false
      this.selectionFilter = null
      this.selectedProblems = []
      this.$refs.table && this.$refs.table.clearSelection()
    },

    async fetchAllMatchingProblemIds () {
      // รวบรวม id ของผลลัพธ์ทุกหน้าตามฟิลเตอร์ snapshot
      const ids = []
      this.collecting = true
      try {
        if (this.selectionFilter.routeName === 'problem-list') {
          const limit = 1000
          let offset = 0
          while (offset < this.total) {
            // ใช้ keyword จาก snapshot เพื่อกันกรณีผู้ใช้แก้ไขระหว่างทาง
            const res = await api.getProblemList(offset, limit, this.selectionFilter.keyword, '')
            const rows = (res.data.data.results || [])
            ids.push(...rows.map(r => r.id))
            offset += limit
          }
        } else {
          // contest-problem-list ใช้ page + limit
          const per = 200
          const pages = Math.ceil(this.total / per)
          for (let page = 1; page <= pages; page++) {
            const res = await api.getContestProblemList(this.selectionFilter.contestId, page, per)
            const rows = (res.data.data.results || [])
            ids.push(...rows.map(r => r.id))
          }
        }
      } finally {
        this.collecting = false
      }
      return ids
    },

    // กดลบ (ถ้าอยู่ในโหมด select-all-across จะลบทั้งผลลัพธ์ทุกหน้า)
    async handleDeleteClick () {
      if (this.selectAllAcross) {
        // ยืนยันการลบทั้งหมด
        try {
          await this.$confirm(
            `Delete ALL ${this.total} result(s) matching the current search? The associated submissions will be deleted as well.`,
            'Delete Problems',
            { type: 'warning' }
          )
        } catch (e) { return }

        this.deleteInProgress = true
        try {
          const allIds = await this.fetchAllMatchingProblemIds()
          if (!allIds.length) {
            this.$warning('No result to delete.')
            return
          }

          if (this.selectionFilter.routeName === 'problem-list') {
            // ลบทีละก้อนเพื่อลดปัญหา URL ยาวเกิน
            const chunkSize = 200
            for (let i = 0; i < allIds.length; i += chunkSize) {
              const chunk = allIds.slice(i, i + chunkSize)
              await api.deleteProblem(chunk.join(','))
            }
          } else {
            // contest-problem-list: endpoint รองรับทีละไอดี
            for (const id of allIds) {
              await api.deleteContestProblem(id)
            }
          }

          this.$success(`Deleted ${allIds.length} item(s).`)
          this.clearSelection()
          // โหลดหน้าใหม่ (เริ่มจากหน้า 1)
          this.getProblemList(1)
        } finally {
          this.deleteInProgress = false
        }
        return
      }

      // ไม่ได้เลือกแบบ across => ลบเฉพาะที่เลือกในหน้านี้
      this.deleteProblems(this.selectedProblemIDs)
    },

    // ลบเดี่ยว/หลายรายการแบบเดิม
    deleteProblems (ids) {
      const list = Array.isArray(ids) ? ids : (ids ? String(ids).split(',') : [])
      if (!list.length) return this.$error('Please select at least 1 problem')

      this.$confirm(
        'Sure to delete the selected problem(s)? The associated submissions will be deleted as well.',
        'Delete Problem',
        { type: 'warning' }
      )
      .then(() => {
        if (this.routeName === 'problem-list') {
          return api.deleteProblem(list.join(','))
        } else {
          // contest: ลบทีละ id
          return list.reduce(
            (p, id) => p.then(() => api.deleteContestProblem(id)),
            Promise.resolve()
          )
        }
      })
      .then(() => {
        const nextPage = Math.max(1, this.currentPage - (list.length >= this.problemList.length ? 1 : 0))
        this.clearSelection()
        this.getProblemList(nextPage)
      })
      .catch(() => {})
    },

    makeContestProblemPublic (problemID) {
      this.$prompt('Please input display id for the public problem', 'confirm')
        .then(({ value }) => api.makeContestProblemPublic({ id: problemID, display_id: value }))
        .catch(() => {})
    },

    updateProblem (row) {
      const data = { ...row }
      const funcName = this.contestId ? 'editContestProblem' : 'editProblem'
      if (this.contestId) data.contest_id = this.contestId

      api[funcName](data)
        .then(() => {
          this.InlineEditDialogVisible = false
          this.getProblemList(this.currentPage)
        })
        .catch(() => { this.InlineEditDialogVisible = false })
    },

    handleInlineEdit (row) {
      this.currentRow = row
      this.InlineEditDialogVisible = true
    },

    downloadTestCase (problemID) {
      const url = '/admin/test_case?problem_id=' + problemID
      utils.downloadFile(url)
    },

    getPublicProblem () {
      api.getProblemList()
    },

    // selection
    handleSelectionChange (val) {
      this.selectedProblems = val
    },

    // group dialog
    openGroupDialog () {
      this.groupForm = { selected: '', name: '' }
      this.showGroupDialog = true
      this.loadGroups()
    },

    loadGroups () {
      api.getGroupList()
        .then(res => { this.availableGroups = res.data.data || [] })
        .catch(() => { this.availableGroups = [] })
    },

    confirmGroup () {
      const problem_ids = this.selectedProblemIDs
      const group_name = (this.groupForm.name || this.groupForm.selected || '').trim()
      if (!problem_ids.length) return this.$error('Please select at least 1 problem')
      if (!group_name) return this.$error('Please select or input a group name')

      this.groupSubmitting = true
      api.assignProblemsToGroup({ problem_ids, group_name })
        .then(() => {
          this.getProblemList(this.currentPage)
          return this.loadGroups()
        })
        .then(() => { this.showGroupDialog = false })
        .finally(() => { this.groupSubmitting = false })
    },

    async removeFromGroup () {
      const problem_ids = this.selectedProblemIDs
      const group_name = (this.groupForm.selected || '').trim()
      if (!problem_ids.length) return this.$error('Please select at least 1 problem')
      if (!group_name) return this.$error('Please select a group to remove')

      try {
        await this.$confirm(`Remove ${problem_ids.length} problem(s) from group "${group_name}" ?`, 'Confirm', { type: 'warning' })
      } catch (e) { return }

      this.removeSubmitting = true
      try {
        await api.removeProblemsFromGroup({ problem_ids, group_name })
        this.$success('Removed from group')
        this.getProblemList(this.currentPage)
      } finally {
        this.removeSubmitting = false
      }
    },

    async clearAllGroups () {
      const problem_ids = this.selectedProblemIDs
      if (!problem_ids.length) return this.$error('Please select at least 1 problem')

      try {
        await this.$confirm(`Remove ${problem_ids.length} problem(s) from ALL groups?`, 'Confirm', { type: 'warning' })
      } catch (e) { return }

      this.clearAllSubmitting = true
      try {
        await api.clearProblemsGroups({ problem_ids })
        this.$success('Cleared all groups')
        this.getProblemList(this.currentPage)
      } finally {
        this.clearAllSubmitting = false
      }
    }
  },
  computed: {
    selectedProblemIDs () {
      return this.selectedProblems.map(p => p.id)
    }
  },
  watch: {
    '$route' (newVal) {
      this.contestId = newVal.params.contestId
      this.routeName = newVal.name
      // reset selection across เมื่อเปลี่ยน route
      this.clearSelection()
      this.getProblemList(this.currentPage)
    },
    // แบบต้นฉบับ: พิมพ์แล้วรีเฟรชทันที
    keyword () {
      // ถ้าแก้ keyword ใหม่ ต้องตัดโหมด select-all-across ทิ้งเพื่อกันพลาด
      if (this.selectAllAcross) this.clearSelection()
      this.currentChange(1)
    }
  }
}
</script>

<style scoped lang="less">
/* Container หลัก */
.header-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

/* ปุ่มกลุ่ม */
.bulk-actions-section {
  display: flex;
  align-items: center;
  gap: 0px;
  flex-shrink: 0;
}

/* ช่องค้นหา */
.search-section {
  flex: 1;
  display: flex;
  align-items: center;
}

/* ปุ่ม */
.action-button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action-button i { margin-right: 4px; }
.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Banner แสดงสถานะการเลือก */
.selection-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 12px;
  align-items: center;
}

/* สไตล์ input ให้เนียน */
.search-section .el-input { transition: all 0.3s ease; }
.search-section .el-input /deep/ .el-input__inner {
  height: 32px;
  line-height: 32px;
  border-radius: 6px;
}
.search-section .el-input:focus-within {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* Animation ปุ่มกลุ่ม */
.bulk-actions-section { animation: slideInLeft 0.3s ease-out; }
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .header-container { flex-direction: column; gap: 12px; }
  .bulk-actions-section, .search-section { width: 100%; }
  .search-section { flex: none; }
  .bulk-actions-section { justify-content: flex-start; }
}
</style>
