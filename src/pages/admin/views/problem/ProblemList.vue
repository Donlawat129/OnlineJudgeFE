<template>
  <div class="view">
    <Panel :title="contestId ? this.$i18n.t('m.Contest_Problem_List') : this.$i18n.t('m.Problem_List')">
      <div slot="header">
        <div class="header-container">
          <!-- ปุ่มลบบนหัว ถ้ามีเลือกอย่างน้อย 1 -->
          <div class="bulk-actions-section" v-show="selectedProblemIDs.length">
            
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
              @click="deleteProblems(selectedProblemIDs)"
            >
              Delete
            </el-button>
          </div>

          <div class="search-section" :class="{ 'with-buttons': selectedProblemIDs.length }">
            <el-input
              v-model="keyword"
              placeholder="Keywords"
              clearable
              prefix-icon="el-icon-search"
              @keyup.enter.native="doSearch"
              @clear="doSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="doSearch" />
            </el-input>
          </div>
        </div>
      </div>
      <el-table
        v-loading="loading"
        element-loading-text="loading"
        ref="table"
        :data="problemList"
        @row-dblclick="handleDblclick"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column
          width="100"
          prop="id"
          label="ID">
        </el-table-column>
        <el-table-column
          width="150"
          label="Display ID">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row._id}}</span>
            <el-input v-show="row.isEditing" v-model="row._id"
                      @keyup.enter.native="handleInlineEdit(row)">

            </el-input>
          </template>
        </el-table-column>
        <el-table-column
          prop="title"
          label="Title">
          <template slot-scope="{row}">
            <span v-show="!row.isEditing">{{row.title}}</span>
            <el-input v-show="row.isEditing" v-model="row.title"
                      @keyup.enter.native="handleInlineEdit(row)">
            </el-input>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_by.username"
          label="Author">
        </el-table-column>
        <el-table-column
          width="200"
          prop="create_time"
          label="Create Time">
          <template slot-scope="scope">
            {{scope.row.create_time | localtime }}
          </template>
        </el-table-column>
        <el-table-column label="Group">
          <template slot-scope="scope">
            <template v-if="scope.row.groups && scope.row.groups.length">
              <el-tag v-for="(g,i) in scope.row.groups" :key="g+i" size="mini" style="margin-right:4px">
                {{ g }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          width="100"
          prop="visible"
          label="Visible">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.visible"
                       active-text=""
                       inactive-text=""
                       @change="updateProblem(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="Operation"
          width="250">
          <div slot-scope="scope">
            <icon-btn name="Edit" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn v-if="contestId" name="Make Public" icon="clone"
                      @click.native="makeContestProblemPublic(scope.row.id)"></icon-btn>
            <icon-btn icon="download" name="Download TestCase"
                      @click.native="downloadTestCase(scope.row.id)"></icon-btn>
            <icon-btn icon="trash" name="Delete Problem"
                      @click.native="deleteProblems([scope.row.id])"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <el-button type="primary" size="small"
                   @click="goCreateProblem" icon="el-icon-plus">Create
        </el-button>
        <el-button v-if="contestId" type="primary"
                   size="small" icon="el-icon-plus"
                   @click="addProblemDialogVisible = true">Add From Public Problem
        </el-button>
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="currentChange"
          :page-size="pageSize"
          :total="total">
        </el-pagination>
      </div>
    </Panel>
    <el-dialog title="Sure to update the problem? "
               width="20%"
               :visible.sync="InlineEditDialogVisible"
               @close-on-click-modal="false">
      <div>
        <p>DisplayID: {{currentRow._id}}</p>
        <p>Title: {{currentRow.title}}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="InlineEditDialogVisible = false; getProblemList(currentPage)"></cancel>
        <save @click.native="updateProblem(currentRow)"></save>
      </span>
    </el-dialog>
    <el-dialog title="Add Contest Problem"
               v-if="contestId"
               width="80%"
               :visible.sync="addProblemDialogVisible"
               @close-on-click-modal="false">
      <add-problem-component :contestID="contestId" @on-change="getProblemList"></add-problem-component>
    </el-dialog>

    <!-- [ADD] Group users dialog -->
    <el-dialog
      title="Group selected problems"
      :visible.sync="showGroupDialog"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form :model="groupForm" label-position="top">
        <el-form-item label="Choose existing group">
          <el-select v-model="groupForm.selected" placeholder="Select a group" filterable clearable>
            <el-option v-for="g in availableGroups" :key="g.id || g.name" :label="g.name" :value="g.name" />
          </el-select>
        </el-form-item>

        <div style="text-align:center;margin:8px 0;color:#888">— OR —</div>

        <el-form-item label="Create / input a new group name">
          <el-input v-model="groupForm.name" placeholder="e.g. A1 / Beginner / Special" />
        </el-form-item>
      </el-form>
      <div class="right">
      <el-button type="text"
            :loading="clearAllSubmitting"
            @click="clearAllGroups">
          Clear all groups
      </el-button>
      </div>

      <span slot="footer" class="dialog-footer">
    
        <cancel @click.native="showGroupDialog = false">Cancel</cancel>
      
        <el-button type="danger"
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
    components: {
      AddProblemComponent
    },
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
        // for make public use
        currentProblemID: '',
        currentRow: {},
        InlineEditDialogVisible: false,
        makePublicDialogVisible: false,
        addProblemDialogVisible: false,
        selectedProblems: [],
        showGroupDialog: false,
        groupSubmitting: false,
        availableGroups: [],
        groupForm: { selected: '', name: '' },
        removeSubmitting: false,
        clearAllSubmitting: false,
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
      doSearch () {
        this.currentChange(1)
      },
      getProblemList (page = 1) {
        this.loading = true
        const isNormal = this.routeName === 'problem-list'

        if (isNormal) {
          const offset = (page - 1) * this.pageSize
          api.getProblemList(offset, this.pageSize, this.keyword, '')   // tag ว่างไว้ก่อน
            .then(res => {
              this.total = res.data.data.total
              const results = res.data.data.results.map(p => ({ ...p, isEditing: false }))
              this.problemList = results
              this.currentPage = page
            })
            .finally(() => { this.loading = false })
        } else {
          // contest-problem-list ใช้ page/limit
          api.getContestProblemList(this.contestId, page, this.pageSize)
            .then(res => {
              this.total = res.data.data.total
              const results = res.data.data.results.map(p => ({ ...p, isEditing: false }))
              this.problemList = results
              this.currentPage = page
            })
            .finally(() => { this.loading = false })
        }
      },
      goEdit (problemId) {
        if (this.routeName === 'problem-list') {
          this.$router.push({name: 'edit-problem', params: {problemId}})
        } else if (this.routeName === 'contest-problem-list') {
          this.$router.push({name: 'edit-contest-problem', params: {problemId: problemId, contestId: this.contestId}})
        }
      },
      goCreateProblem () {
        if (this.routeName === 'problem-list') {
          this.$router.push({name: 'create-problem'})
        } else if (this.routeName === 'contest-problem-list') {
          this.$router.push({name: 'create-contest-problem', params: {contestId: this.contestId}})
        }
      },
      // 切换页码回调
      currentChange (page) {
        this.currentPage = page
        this.getProblemList(page)
      },
      getProblemList (page = 1) {
        this.loading = true
        let funcName = this.routeName === 'problem-list' ? 'getProblemList' : 'getContestProblemList'
        let params = {
          limit: this.pageSize,
          offset: (page - 1) * this.pageSize,
          keyword: this.keyword,
          contest_id: this.contestId
        }
        api[funcName](params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          for (let problem of res.data.data.results) {
            problem.isEditing = false
          }
          this.problemList = res.data.data.results
        }, res => {
          this.loading = false
        })
      },
      deleteProblem (id) {
        this.$confirm('Sure to delete this problem? The associated submissions will be deleted as well.', 'Delete Problem', {
          type: 'warning'
        }).then(() => {
          let funcName = this.routeName === 'problem-list' ? 'deleteProblem' : 'deleteContestProblem'
          api[funcName](id).then(() => [
            this.getProblemList(this.currentPage - 1)
          ]).catch(() => {
          })
        }, () => {
        })
      },
      makeContestProblemPublic (problemID) {
        this.$prompt('Please input display id for the public problem', 'confirm').then(({value}) => {
          api.makeContestProblemPublic({id: problemID, display_id: value}).catch()
        }, () => {
        })
      },
      updateProblem (row) {
        let data = Object.assign({}, row)
        let funcName = ''
        if (this.contestId) {
          data.contest_id = this.contestId
          funcName = 'editContestProblem'
        } else {
          funcName = 'editProblem'
        }
        api[funcName](data).then(res => {
          this.InlineEditDialogVisible = false
          this.getProblemList(this.currentPage)
        }).catch(() => {
          this.InlineEditDialogVisible = false
        })
      },
      handleInlineEdit (row) {
        this.currentRow = row
        this.InlineEditDialogVisible = true
      },
      downloadTestCase (problemID) {
        let url = '/admin/test_case?problem_id=' + problemID
        utils.downloadFile(url)
      },
      getPublicProblem () {
        api.getProblemList()
      },
      handleSelectionChange (val) {
        this.selectedProblems = val
      },
      openGroupDialog () {
        this.groupForm = { selected: '', name: '' }
        this.showGroupDialog = true
        this.loadGroups()
      },
      loadGroups () {
        api.getGroupList().then(res => {
          this.availableGroups = res.data.data || []
        }).catch(() => { this.availableGroups = [] })
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
      },

      deleteProblems (ids) {
        const list = Array.isArray(ids) ? ids : (ids ? String(ids).split(',') : [])
        if (!list.length) return this.$error('Please select at least 1 problem')

        this.$confirm(
          'Sure to delete the selected problem(s)? The associated submissions will be deleted as well.',
          'Delete Problem',
          { type: 'warning' }
        )
        .then(() => {
          const funcName = this.routeName === 'problem-list' ? 'deleteProblem' : 'deleteContestProblem'
          // ส่งเป็น comma-separated เช่น "12,13"
          return api[funcName](list.join(','))
        })
        .then(() => {
          const nextPage = Math.max(1, this.currentPage - (list.length >= this.problemList.length ? 1 : 0))
          this.getProblemList(nextPage)
        })
        .catch(() => {})
      },
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
        this.getProblemList(this.currentPage)
      },
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

  /* ส่วนปุ่มกลุ่ม */
  .bulk-actions-section {
    display: flex;
    align-items: center;
    gap: 0px; /* ระยะห่างระหว่างปุ่ม */
    flex-shrink: 0;
  }

  /* ส่วนช่องค้นหา */
  .search-section {
    flex: 1;
    display: flex;
    align-items: center;
  }

  /* ปรับแต่งปุ่มแต่ละปุ่มให้สวยงาม */
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

  .action-button i {
    margin-right: 4px;
  }

  /* Hover effects สำหรับปุ่มแต่ละปุ่ม */
  .action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* ปรับแต่ง input ให้ตรงกับปุ่ม */
  .search-section .el-input {
    transition: all 0.3s ease;
  }

  .search-section .el-input /deep/ .el-input__inner {
    height: 32px;
    line-height: 32px;
    border-radius: 6px;
  }

  .search-section .el-input:focus-within {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }

  /* Animation เมื่อปุ่มปรากฏ */
  .bulk-actions-section {
    animation: slideInLeft 0.3s ease-out;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .header-container {
      flex-direction: column;
      gap: 12px;
    }
    
    .bulk-actions-section,
    .search-section {
      width: 100%;
    }
    
    .search-section {
      flex: none;
    }
    
    .bulk-actions-section {
      justify-content: flex-start;
    }
  }
</style>
