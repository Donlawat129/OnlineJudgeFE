<template>
  <div class="view">
    <Panel :title="$t('m.User_User') ">
      <div slot="header">
        <div class="header-container">
          <!-- ปุ่มกลุ่ม/ลบ (เฉพาะที่มี selection หรืออยู่โหมด select-all) -->
          <div class="bulk-actions-section" v-show="selectedUsers.length || selectAllAcross">
            <el-button
              type="primary"
              icon="el-icon-fa-users"
              size="small"
              class="action-button"
              @click="openGroupDialog"
              :loading="groupAllInProgress"
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

          <!-- ช่องค้นหา -->
          <div class="search-section" :class="{ 'with-buttons': selectedUsers.length || selectAllAcross }">
            <el-input
              v-model="keyword"
              prefix-icon="el-icon-search"
              placeholder="Keywords"
              clearable
            />
          </div>
        </div>

        <!-- แบนเนอร์สถานะการเลือก -->
        <div v-if="(selectedUsers.length && total) || selectAllAcross" class="selection-info">
          <template v-if="!selectAllAcross">
            Selected {{ selectedUsers.length }} on this page.
            <el-link
              v-if="selectedUsers.length === userList.length && total > userList.length"
              type="primary"
              :disabled="collecting"
              @click="selectAllAcrossResults"
            >Select all {{ total }} results</el-link>
          </template>
          <template v-else>
            All {{ total }} results are selected.
          </template>
          <el-link type="danger" :disabled="collecting" @click="clearSelection">Clear</el-link>
        </div>
      </div>

      <el-table
        ref="table"
        :data="userList"
        v-loading="loading || collecting"
        element-loading-text="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column prop="id" label="ID"></el-table-column>
        <el-table-column prop="username" label="Username"></el-table-column>

        <el-table-column prop="create_time" label="Create Time">
          <template slot-scope="scope">
            {{ scope.row.create_time | localtime }}
          </template>
        </el-table-column>

        <el-table-column prop="last_login" label="Last Login">
          <template slot-scope="scope">
            {{ scope.row.last_login | localtime }}
          </template>
        </el-table-column>

        <el-table-column prop="real_name" label="Real Name"></el-table-column>
        <el-table-column prop="email" label="Email"></el-table-column>

        <el-table-column prop="admin_type" label="User Type">
          <template slot-scope="scope">{{ scope.row.admin_type }}</template>
        </el-table-column>

        <el-table-column label="Group">
          <template slot-scope="scope">
            <template v-if="scope.row.groups && scope.row.groups.length">
              <el-tag v-for="(g,i) in scope.row.groups" :key="g+i" size="mini" style="margin-right:4px">{{ g }}</el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="Option" width="200">
          <template slot-scope="{row}">
            <icon-btn name="Edit" icon="edit" @click.native="openUserDialog(row.id)"></icon-btn>
            <icon-btn name="Delete" icon="trash" @click.native="deleteUsers([row.id])"></icon-btn>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="currentChange"
          :page-size="pageSize"
          :total="total"
        />
      </div>
    </Panel>

    <!-- Import -->
    <Panel>
      <span slot="title">
        {{$t('m.Import_User')}}
        <el-popover placement="right" trigger="hover">
          <p>Only support csv file without headers, check the
            <a href="http://docs.onlinejudge.me/#/onlinejudge/guide/import_users">link</a> for details</p>
          <i slot="reference" class="el-icon-fa-question-circle import-user-icon"></i>
        </el-popover>
      </span>

      <el-upload
        v-if="!uploadUsers.length"
        action=""
        :show-file-list="false"
        accept=".csv"
        :before-upload="handleUsersCSV"
      >
        <el-button size="small" icon="el-icon-fa-upload" type="primary">Choose File</el-button>
      </el-upload>

      <template v-else>
        <el-table :data="uploadUsersPage">
          <el-table-column label="Username">
            <template slot-scope="{row}">{{ row[0] }}</template>
          </el-table-column>
          <el-table-column label="Password">
            <template slot-scope="{row}">{{ row[1] }}</template>
          </el-table-column>
          <el-table-column label="Email">
            <template slot-scope="{row}">{{ row[2] }}</template>
          </el-table-column>
          <el-table-column label="RealName">
            <template slot-scope="{row}">{{ row[3] }}</template>
          </el-table-column>
        </el-table>
        <div class="panel-options">
          <el-button type="primary" size="small" icon="el-icon-fa-upload" @click="handleUsersUpload">Import All</el-button>
          <el-button type="warning" size="small" icon="el-icon-fa-undo" @click="handleResetData">Reset Data</el-button>
          <el-pagination
            class="page"
            layout="prev, pager, next"
            :page-size="uploadUsersPageSize"
            :current-page.sync="uploadUsersCurrentPage"
            :total="uploadUsers.length"
          />
        </div>
      </template>
    </Panel>

    <!-- Generate -->
    <Panel :title="$t('m.Generate_User')">
      <el-form :model="formGenerateUser" ref="formGenerateUser">
        <el-row type="flex" justify="space-between">
          <el-col :span="4">
            <el-form-item label="Prefix" prop="prefix"><el-input v-model="formGenerateUser.prefix"/></el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Suffix" prop="suffix"><el-input v-model="formGenerateUser.suffix"/></el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Start Number" prop="number_from" required>
              <el-input-number v-model="formGenerateUser.number_from" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="End Number" prop="number_to" required>
              <el-input-number v-model="formGenerateUser.number_to" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Password Length" prop="password_length" required>
              <el-input v-model="formGenerateUser.password_length" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="generateUser" icon="el-icon-fa-users" :loading="loadingGenerate">
            Generate & Export
          </el-button>
          <span class="userPreview"
                v-if="formGenerateUser.number_from && formGenerateUser.number_to &&
                       formGenerateUser.number_from <= formGenerateUser.number_to">
            The usernames will be
            {{formGenerateUser.prefix + formGenerateUser.number_from + formGenerateUser.suffix}},
            <span v-if="formGenerateUser.number_from + 1 < formGenerateUser.number_to">
              {{formGenerateUser.prefix + (formGenerateUser.number_from + 1) + formGenerateUser.suffix + '...'}}
            </span>
            <span v-if="formGenerateUser.number_from + 1 <= formGenerateUser.number_to">
              {{formGenerateUser.prefix + formGenerateUser.number_to + formGenerateUser.suffix}}
            </span>
          </span>
        </el-form-item>
      </el-form>
    </Panel>

    <!-- Edit user dialog -->
    <el-dialog :title="$t('m.User_Info')" :visible.sync="showUserDialog" :close-on-click-modal="false">
      <el-form :model="user" label-width="120px" label-position="left">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Username')" required>
              <el-input v-model="user.username" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Real_Name')" required>
              <el-input v-model="user.real_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Email')" required>
              <el-input v-model="user.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_New_Password')">
              <el-input v-model="user.password" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Type')">
              <el-select v-model="user.admin_type">
                <el-option label="Regular User" value="Regular User" />
                <el-option label="Admin" value="Admin" />
                <el-option label="Super Admin" value="Super Admin" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.Problem_Permission')">
              <el-select v-model="user.problem_permission" :disabled="user.admin_type!=='Admin'">
                <el-option label="None" value="None" />
                <el-option label="Own" value="Own" />
                <el-option label="All" value="All" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Two_Factor_Auth')">
              <el-switch v-model="user.two_factor_auth" :disabled="!user.real_tfa" active-color="#13ce66" inactive-color="#ff4949"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Open Api">
              <el-switch v-model="user.open_api" active-color="#13ce66" inactive-color="#ff4949"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Is_Disabled')">
              <el-switch v-model="user.is_disabled"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showUserDialog = false">Cancel</cancel>
        <save @click.native="saveUser()"></save>
      </span>
    </el-dialog>

    <!-- Group dialog -->
    <el-dialog
      title="Group selected users"
      :visible.sync="showGroupDialog"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form :model="groupForm" label-position="top">
        <el-form-item label="Choose existing group">
          <el-select v-model="groupForm.selected" placeholder="Select a group" filterable clearable>
            <el-option v-for="g in availableGroups" :key="g.id || g.name" :label="g.name" :value="g.name"/>
          </el-select>
        </el-form-item>

        <div style="text-align:center;margin:8px 0;color:#888">— OR —</div>

        <el-form-item label="Create / input a new group name">
          <el-input v-model="groupForm.name" placeholder="e.g. A1 / Beginner / Special"/>
        </el-form-item>
      </el-form>

      <div class="right">
        <el-button type="text" :loading="clearAllSubmitting" @click="clearAllGroups">Clear all groups</el-button>
      </div>

      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showGroupDialog = false">Cancel</cancel>
        <el-button type="danger" :disabled="!groupForm.selected" :loading="removeSubmitting" @click="removeFromGroup">
          Remove from group
        </el-button>
        <save @click.native="confirmGroup" :loading="groupSubmitting || groupAllInProgress">Save</save>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import papa from 'papaparse'
import api from '../../api.js'
import utils from '@/utils/utils'

export default {
  name: 'User',
  data () {
    return {
      userList: [],
      loading: false,
      total: 0,
      pageSize: 10,
      currentPage: 1,

      uploadUsers: [],
      uploadUsersPage: [],
      uploadUsersCurrentPage: 1,
      uploadUsersPageSize: 15,

      keyword: '',

      showUserDialog: false,
      user: {},

      // selection (ในหน้านี้)
      selectedUsers: [],

      // group dialog
      showGroupDialog: false,
      groupSubmitting: false,
      availableGroups: [],
      groupForm: { selected: '', name: '' },
      removeSubmitting: false,
      clearAllSubmitting: false,

      // status
      loadingGenerate: false,

      // select-all across pages
      selectAllAcross: false,
      selectionFilter: null,
      collecting: false,
      deleteInProgress: false,
      groupAllInProgress: false,

      // generate form
      formGenerateUser: {
        prefix: '',
        suffix: '',
        number_from: 0,
        number_to: 0,
        password_length: 8
      }
    }
  },
  mounted () {
    this.getUserList(1)
  },
  methods: {
    currentChange (page) {
      this.currentPage = page
      this.getUserList(page)
    },

    saveUser () {
      api.editUser(this.user).then(() => {
        this.getUserList(this.currentPage)
      }).then(() => {
        this.showUserDialog = false
      }).catch(() => {})
    },

    openUserDialog (id) {
      this.showUserDialog = true
      api.getUser(id).then(res => {
        this.user = res.data.data
        this.user.password = ''
        this.user.real_tfa = this.user.two_factor_auth
      })
    },

    getUserList (page = 1) {
      this.loading = true
      api.getUserList((page - 1) * this.pageSize, this.pageSize, this.keyword)
        .then(res => {
          const data = res.data && res.data.data ? res.data.data : {results: [], total: 0}
          this.userList = data.results
          this.total = data.total || 0
          this.currentPage = page
          // เคลียร์ selection เฉพาะหน้าปัจจุบัน
          this.selectedUsers = []
          if (this.$refs.table) this.$refs.table.clearSelection()
        })
        .finally(() => { this.loading = false })
    },

    // ----- select-all across pages -----
    selectAllAcrossResults () {
      this.selectAllAcross = true
      this.selectionFilter = { keyword: this.keyword }
    },
    clearSelection () {
      this.selectAllAcross = false
      this.selectionFilter = null
      this.selectedUsers = []
      this.$refs.table && this.$refs.table.clearSelection()
    },

    async fetchAllMatchingUserIds () {
      const ids = []
      this.collecting = true
      try {
        const limit = this.pageSize || 10
        let offset = 0
        while (offset < this.total) {
          const res = await api.getUserList(offset, limit, this.selectionFilter ? this.selectionFilter.keyword : '')
          const rows = (res && res.data && res.data.data && res.data.data.results) || []
          if (!rows.length) break
          ids.push(...rows.map(r => r.id))
          offset += rows.length
        }
      } finally {
        this.collecting = false
      }
      return ids
    },

    // ----- delete -----
    async handleDeleteClick () {
      if (this.selectAllAcross) {
        // ลบทุกผลลัพธ์ (ต้องกด select-all results มาก่อน)
        try {
          await this.$confirm(`Delete ALL ${this.total} result(s)?`, 'Delete Users', { type: 'warning' })
        } catch (e) { return }

        this.deleteInProgress = true
        try {
          const allIds = await this.fetchAllMatchingUserIds()
          if (!allIds.length) return this.$warning('No result to delete.')

          // ลบทีละก้อนเพื่อกัน URL ยาว
          const chunk = 200
          for (let i = 0; i < allIds.length; i += chunk) {
            await api.deleteUsers(allIds.slice(i, i + chunk).join(','))
          }
          this.$success(`Deleted ${allIds.length} user(s).`)
          this.clearSelection()
          this.getUserList(1)
        } finally {
          this.deleteInProgress = false
        }
        return
      }

      // ลบเฉพาะที่เลือกในหน้านี้
      const ids = this.selectedUserIDs
      if (!ids.length) return this.$error('Please select at least 1 user')
      this.deleteUsers(ids)
    },

    deleteUsers (ids) {
      const list = Array.isArray(ids) ? ids : (ids ? String(ids).split(',') : [])
      if (!list.length) return this.$error('Please select at least 1 user')

      const isBulk = list.length > 1
      const title = isBulk ? 'Delete Users' : 'Delete User'
      const msg = isBulk ? 'Sure to delete the selected user(s)?' : 'Sure to delete this user?'

      this.$confirm(msg, title, { type: 'warning' })
        .then(() => api.deleteUsers(list.join(',')))
        .then(() => {
          const nextPage = Math.max(1, this.currentPage - (list.length >= this.userList.length ? 1 : 0))
          this.clearSelection()
          this.getUserList(nextPage)
        })
        .catch(() => {})
    },

    handleSelectionChange (val) { this.selectedUsers = val },

    // ----- import/generate  (เดิม) -----
    generateUser () {
      this.$refs['formGenerateUser'].validate((valid) => {
        if (!valid) return this.$error('Please validate the error fields')
        this.loadingGenerate = true
        const data = Object.assign({}, this.formGenerateUser)
        api.generateUser(data).then(res => {
          this.loadingGenerate = false
          const url = '/admin/generate_user?file_id=' + res.data.data.file_id
          utils.downloadFile(url).then(() => {
            this.$alert('All users created successfully, the users sheets have downloaded to your disk.', 'Notice')
          })
          this.getUserList(1)
        }).catch(() => { this.loadingGenerate = false })
      })
    },
    handleUsersCSV (file) {
      papa.parse(file, {
        complete: (results) => {
          const data = results.data.filter(user => user[0] && user[1] && user[2] && user[3])
          const delta = results.data.length - data.length
          if (delta > 0) this.$warning(delta + ' users have been filtered due to empty value')
          this.uploadUsersCurrentPage = 1
          this.uploadUsers = data
          this.uploadUsersPage = data.slice(0, this.uploadUsersPageSize)
        },
        error: (error) => { this.$error(error) }
      })
    },
    handleUsersUpload () {
      api.importUsers(this.uploadUsers).then(() => {
        this.getUserList(1)
        this.handleResetData()
      }).catch(() => {})
    },
    handleResetData () { this.uploadUsers = [] },

    // ----- group -----
    openGroupDialog () {
      if (!this.selectedUserIDs.length && !this.selectAllAcross) {
        return this.$error('Please select at least 1 user')
      }
      this.groupForm = { selected: '', name: '' }
      this.showGroupDialog = true
      this.loadGroups()
    },
    loadGroups () {
      api.getGroupList().then(res => {
        this.availableGroups = res.data.data || []
      }).catch(() => { this.availableGroups = [] })
    },
    async confirmGroup () {
      const group_name = (this.groupForm.name || this.groupForm.selected || '').trim()
      if (!group_name) return this.$error('Please select or input a group name')

      let user_ids = this.selectedUserIDs.slice()
      if (this.selectAllAcross) {
        this.groupAllInProgress = true
        user_ids = await this.fetchAllMatchingUserIds()
        this.groupAllInProgress = false
      }
      if (!user_ids.length) return this.$error('No user selected')

      this.groupSubmitting = true
      api.assignUsersToGroup({ user_ids, group_name })
        .then(() => { this.$success('Saved'); this.getUserList(this.currentPage); return this.loadGroups() })
        .then(() => { this.showGroupDialog = false })
        .finally(() => { this.groupSubmitting = false })
    },
    async removeFromGroup () {
      const group_name = (this.groupForm.selected || '').trim()
      if (!group_name) return this.$error('Please select a group to remove')

      let user_ids = this.selectedUserIDs.slice()
      if (!user_ids.length && !this.selectAllAcross) return this.$error('Please select at least 1 user')
      if (this.selectAllAcross) {
        try { await this.$confirm(`Remove ALL ${this.total} results from "${group_name}" ?`, 'Confirm', { type: 'warning' }) } catch (e) { return }
        this.groupAllInProgress = true
        user_ids = await this.fetchAllMatchingUserIds()
        this.groupAllInProgress = false
      }

      this.removeSubmitting = true
      try {
        await api.removeUsersFromGroup({ user_ids, group_name })
        this.$success('Removed from group')
        this.getUserList(this.currentPage)
      } finally {
        this.removeSubmitting = false
      }
    },
    async clearAllGroups () {
      let user_ids = this.selectedUserIDs.slice()
      if (!user_ids.length && !this.selectAllAcross) return this.$error('Please select at least 1 user')

      if (this.selectAllAcross) {
        try { await this.$confirm(`Remove ALL ${this.total} results from ALL groups?`, 'Confirm', { type: 'warning' }) } catch (e) { return }
        this.groupAllInProgress = true
        user_ids = await this.fetchAllMatchingUserIds()
        this.groupAllInProgress = false
      }

      this.clearAllSubmitting = true
      try {
        await api.clearUsersGroups({ user_ids })
        this.$success('Cleared all groups')
        this.getUserList(this.currentPage)
      } finally {
        this.clearAllSubmitting = false
      }
    }
  },
  computed: {
    selectedUserIDs () { return this.selectedUsers.map(u => u.id) }
  },
  watch: {
    keyword () { this.clearSelection(); this.currentPage = 1; this.getUserList(1) },
    'user.admin_type' () {
      if (this.user.admin_type === 'Super Admin') this.user.problem_permission = 'All'
      else if (this.user.admin_type === 'Regular User') this.user.problem_permission = 'None'
    },
    uploadUsersCurrentPage (page) {
      this.uploadUsersPage = this.uploadUsers.slice((page - 1) * this.uploadUsersPageSize, page * this.uploadUsersPageSize)
    }
  }
}
</script>

<style scoped lang="less">
.import-user-icon { color: #555; margin-left: 4px; }
.userPreview { padding-left: 10px; }

.header-container { display: flex; align-items: center; gap: 10px; width: 100%; }
.bulk-actions-section { display: flex; align-items: center; gap: 0px; flex-shrink: 0; }
.search-section { flex: 1; display: flex; align-items: center; }

.action-button { box-shadow: 0 2px 4px rgba(0,0,0,.1); border-radius: 6px; transition: all .3s; height: 32px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; }
.action-button:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,.15); }

.selection-info { margin-top: 8px; font-size: 12px; color: #666; display: flex; gap: 12px; align-items: center; }

.search-section .el-input { transition: all .3s; }
.search-section .el-input /deep/ .el-input__inner { height: 32px; line-height: 32px; border-radius: 6px; }
.search-section .el-input:focus-within { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(64,158,255,.2); }
</style>
