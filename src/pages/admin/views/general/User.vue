<template>
  <div class="view">
    <Panel :title="$t('m.User_User') ">
      <div slot="header">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-button v-show="selectedUsers.length"
                       type="warning" icon="el-icon-fa-trash"
                       @click="deleteUsers(selectedUserIDs)">Delete
            </el-button>
            <el-button
              v-show="selectedUsers.length"
              type="primary"
              icon="el-icon-fa-users"
              @click="openGroupDialog"
              style="margin-left:8px"
            >Group</el-button>
          </el-col>
          <el-col :span="selectedUsers.length ? 16: 24">
            <el-input v-model="keyword" prefix-icon="el-icon-search" placeholder="Keywords"></el-input>
          </el-col>
        </el-row>
      </div>
      <el-table
        v-loading="loadingTable"
        element-loading-text="loading"
        @selection-change="handleSelectionChange"
        ref="table"
        :data="userList"
        style="width: 100%">
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column prop="id" label="ID"></el-table-column>

        <el-table-column prop="real_name" :label="$t('m.User_Real_Name')"></el-table-column>

        <el-table-column prop="username" :label="$t('m.User_Username')"></el-table-column>

        <el-table-column prop="email" :label="$t('m.User_Email')"></el-table-column>

        <el-table-column prop="create_time" :label="$t('m.User_Create_Time')"></el-table-column>

        <el-table-column prop="last_login" label="Last Login"></el-table-column>

        <el-table-column :label="$t('m.User_Action')">
          <template slot-scope="{row}">
            <el-button type="primary" @click="openUserDialog(row.id)" icon="el-icon-fa-pencil" size="small">Edit</el-button>
            <el-button type="warning" @click="resetPassword(row.id)" icon="el-icon-fa-undo" size="small">Reset Password</el-button>
            <el-button type="danger" @click="deleteUsers([row.id])" icon="el-icon-fa-trash" size="small">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="text-align:center;margin: 20px auto;">
        <el-pagination
          layout="prev, pager, next, jumper, sizes"
          @current-change="currentChange"
          @size-change="(size) => {pageSize = size; currentChange(1)}"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"></el-pagination>
      </div>
    </Panel>

    <Panel :title="$t('m.User_Generate_User')" icon="el-icon-fa-users" style="margin-top: 20px;">
      <el-form ref="formGenerateUser" :model="formGenerateUser" label-width="120px" label-position="left">
        <el-form-item :label="$t('m.User_Prefix')" :rules="{ required: true, message: 'Prefix is required'}">
          <el-input v-model="formGenerateUser.prefix" placeholder="u"></el-input>
        </el-form-item>
        <el-form-item :label="$t('m.User_Suffix')">
          <el-input v-model="formGenerateUser.suffix" placeholder="_student"></el-input>
        </el-form-item>
        <el-form-item :label="$t('m.User_From')" :rules="{ required: true, message: 'From is required'}">
          <el-input-number v-model="formGenerateUser.number_from" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('m.User_To')" :rules="{ required: true, message: 'To is required'}">
          <el-input-number v-model="formGenerateUser.number_to" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('m.User_Password_Length')" :rules="{ required: true, message: 'Password length is required'}">
          <el-input-number v-model="formGenerateUser.password_length" :min="4" :max="20"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('m.User_CSV')" :rules="{ required: true, message: 'CSV file is required'}">
          <span style="display:inline-flex; align-items:center;">
            <el-popover
              placement="right"
              title="CSV Format"
              width="340"
              trigger="hover"
            >
              <div class="notification">
                <p>CSV columns: <strong>username, real_name, email, password</strong></p>
                <p>Example:</p>
                <pre>alice,Alice,alice@example.com,pass1234
bob,Bob,bob@example.com,pass5678</pre>
                <p>Empty rows will be filtered.</p>
              </div>
              <i slot="reference" class="el-icon-fa-question-circle import-user-icon"></i>
            </el-popover>
          </span>
          <el-upload v-if="!uploadUsers.length"
                     action=""
                     :show-file-list="false"
                     accept=".csv"
                     :before-upload="handleUsersCSV">
            <el-button size="small" icon="el-icon-fa-upload" type="primary">Choose File</el-button>
          </el-upload>
          <template v-else>
            <el-table :data="uploadUsersPage">
              <el-table-column label="Username">
                <template slot-scope="{row}">
                  {{row[0]}}
                </template>
              </el-table-column>
              <el-table-column label="Real Name">
                <template slot-scope="{row}">
                  {{row[1]}}
                </template>
              </el-table-column>
              <el-table-column label="Email">
                <template slot-scope="{row}">
                  {{row[2]}}
                </template>
              </el-table-column>
              <el-table-column label="Password">
                <template slot-scope="{row}">
                  {{row[3]}}
                </template>
              </el-table-column>
            </el-table>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <div>Rows: {{ uploadUsers.length }}</div>
              <el-pagination
                :current-page.sync="uploadUsersCurrentPage"
                layout="prev, pager, next, jumper"
                :page-size="uploadUsersPageSize"
                :total="uploadUsers.length">
              </el-pagination>
            </div>
            <div style="margin-top:8px;">
              <el-button type="primary" :loading="loadingGenerate" @click="handleUsersUpload">Import</el-button>
              <el-button @click="handleResetData">Reset</el-button>
            </div>
          </template>
        </el-form-item>
        <el-form-item :label="$t('m.User_Download_Format')">
          <span>
            <a href="/admin/generate_user?file_id=0" target="_blank">Click to download</a>
            &nbsp;file preview: 
            <span class="userPreview">
              {{formGenerateUser.prefix}}{{formGenerateUser.number_from}}{{formGenerateUser.suffix}},
              {{formGenerateUser.prefix}}{{formGenerateUser.number_from + 1}}{{formGenerateUser.suffix}},
              {{formGenerateUser.prefix}}...{{formGenerateUser.number_to}}{{formGenerateUser.suffix}}
            </span>
          </span>
        </el-form-item>
      </el-form>
    </Panel>
    <!--对话框-->
    <el-dialog :title="$t('m.User_Info')" :visible.sync="showUserDialog" :close-on-click-modal="false">
      <el-form :model="user" label-width="120px" label-position="left">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Username')" required>
              <el-input v-model="user.username"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Real_Name')" required>
              <el-input v-model="user.real_name"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Email')" required>
              <el-input v-model="user.email"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_New_Password')">
              <el-input v-model="user.password"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.User_Type')">
              <el-select v-model="user.admin_type">
                <el-option label="Regular User" value="Regular User"></el-option>
                <el-option label="Admin" value="Admin"></el-option>
                <el-option label="Super Admin" value="Super Admin"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Problem Permission">
              <el-select v-model="user.problem_permission">
                <el-option label="None" value="None"></el-option>
                <el-option label="Own" value="Own"></el-option>
                <el-option label="All" value="All"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Two-Factor Auth">
              <el-switch v-model="user.real_tfa"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showUserDialog = false">Cancel</cancel>
        <save @click.native="saveUser()"></save>
      </span>
    </el-dialog>
    <!-- Group users dialog -->
    <el-dialog
      title="Group selected users"
      :visible.sync="showGroupDialog"
      :close-on-click-modal="false"
      width="480px"
    >
      <el-form :model="groupForm" label-position="top">
        <el-form-item label="Choose existing group">
          <el-select v-model="groupForm.selected" placeholder="Select a group" filterable clearable>
            <el-option v-for="g in availableGroups" :key="g.id || g.name"
                      :label="g.name" :value="g.name"/>
          </el-select>
        </el-form-item>

        <div style="text-align:center;margin:8px 0;color:#888">— OR —</div>

        <el-form-item label="Create / input a new group name">
          <el-input v-model="groupForm.name" placeholder="e.g. A1 / Beginner / Special"></el-input>
        </el-form-item>

        <el-alert type="info" :closable="false" show-icon>
          Users selected: {{ selectedUserIDs.length }}
        </el-alert>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showGroupDialog = false">Cancel</cancel>
        <save @click.native="confirmGroup" :loading="groupSubmitting">Save</save>
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
        // 一页显示的用户数
        pageSize: 10,
        // 用户总数
        total: 0,
        // 用户列表
        userList: [],
        uploadUsers: [],
        uploadUsersPage: [],
        uploadUsersCurrentPage: 1,
        uploadUsersPageSize: 15,
        // 搜索关键字
        keyword: '',
        // 是否显示用户对话框
        showUserDialog: false,
        // 当前用户model
        user: {},
        loadingTable: false,
        loadingGenerate: false,
        // 当前页码
        currentPage: 0,
        selectedUsers: [],
        formGenerateUser: {
          prefix: '',
          suffix: '',
          number_from: 0,
          number_to: 0,
          password_length: 8
        },
        showGroupDialog: false,
        groupSubmitting: false,
        availableGroups: [],        
        groupForm: { selected: '', name: '' } 
      }
    },
    mounted () {
      this.getUserList(1)
    },
    methods: {
      // 切换页码回调
      currentChange (page) {
        this.currentPage = page
        this.getUserList(page)
      },
      // 提交修改用户的信息
      saveUser () {
        api.editUser(this.user).then(res => {
          // 更新列表
          this.getUserList(this.currentPage)
        }).then(() => {
          this.showUserDialog = false
        }).catch(() => {
        })
      },
      // 打开用户对话框
      openUserDialog (id) {
        this.showUserDialog = true
        api.getUser(id).then(res => {
          this.user = res.data.data
          this.user.password = ''
          this.user.real_tfa = this.user.two_factor_auth
        })
      },
      resetPassword (id) {
        this.$confirm('Sure to reset the password to 123456?', 'confirm', {
          type: 'warning'
        }).then(() => {
          api.resetPassword(id).then(res => {
          }).catch(() => {
          })
        }, () => {
        })
      },
      // 获取用户列表
      getUserList (page) {
        this.loadingTable = true
        api.getUserList((page - 1) * this.pageSize, this.pageSize, this.keyword).then(res => {
          this.loadingTable = false
          this.total = res.data.data.total
          this.userList = res.data.data.results
        }, res => {
          this.loadingTable = false
        })
      },
      deleteUsers (ids) {
        this.$confirm('Sure to delete the user? The associated resources will be removed as well, like problem, contest, announcement, etc.', 'confirm', {
          type: 'warning'
        }).then(() => {
          api.deleteUsers(ids.join(',')).then(res => {
            this.getUserList(this.currentPage)
          }).catch(() => {
            this.getUserList(this.currentPage)
          })
        }, () => {
        })
      },
      handleSelectionChange (val) {
        this.selectedUsers = val
      },
      generateUser () {
        this.$refs['formGenerateUser'].validate((valid) => {
          if (!valid) {
            this.$error('Please validate the error fields')
            return
          }
          this.loadingGenerate = true
          let data = Object.assign({}, this.formGenerateUser)
          api.generateUser(data).then(res => {
            this.loadingGenerate = false
            let url = '/admin/generate_user?file_id=' + res.data.data.file_id
            utils.downloadFile(url).then(() => {
              this.$alert('All users created successfully, the users sheets have downloaded to your disk.', 'Notice')
            })
            this.getUserList(1)
          }).catch(() => {
            this.loadingGenerate = false
          })
        })
      },
      handleUsersCSV (file) {
        papa.parse(file, {
          complete: (results) => {
            let data = results.data.filter(user => {
              return user[0] && user[1] && user[2] && user[3]
            })
            let delta = results.data.length - data.length
            if (delta > 0) {
              this.$warning(delta + ' users have been filtered due to empty value')
            }
            this.uploadUsersCurrentPage = 1
            this.uploadUsers = data
            this.uploadUsersPage = data.slice(0, this.uploadUsersPageSize)
          },
          error: (error) => {
            this.$error(error)
          }
        })
      },
      handleUsersUpload () {
        api.importUsers(this.uploadUsers).then(res => {
          this.getUserList(1)
        }).catch(() => {
        })
      },
      handleResetData () {
        this.uploadUsers = []
      },
      openGroupDialog () {
        this.groupForm = { selected: '', name: '' }
        this.showGroupDialog = true
        this.loadGroups()  // โหลดรายชื่อกลุ่มปัจจุบัน
      },

      loadGroups () {
        // เรียก API เพื่อดึงรายการ group
        // (จะไปเพิ่มเมธอดใน api.js ข้อ 5)
        api.getGroupList().then(res => {
          // คาดหวังรูป { data: { data: [{id, name}, ...] } }
          this.availableGroups = res.data.data || []
        }).catch(() => {
          this.availableGroups = []
        })
      },

      confirmGroup () {
        const user_ids = this.selectedUserIDs
        const group_name = (this.groupForm.name || this.groupForm.selected || '').trim()
        if (!user_ids.length) {
          this.$error('Please select at least 1 user')
          return
        }
        if (!group_name) {
          this.$error('Please select or input a group name')
          return
        }
        this.groupSubmitting = true
        // เรียก API assign กลุ่มให้ users (จะไปเพิ่มเมธอดใน api.js ข้อ 5)
        api.assignUsersToGroup({ user_ids, group_name }).then(() => {
          this.groupSubmitting = false
          this.showGroupDialog = false
          this.getUserList(this.currentPage) // refresh ตาราง
        }).catch(() => {
          this.groupSubmitting = false
        })
      }
    },
    computed: {
      selectedUserIDs () {
        let ids = []
        for (let user of this.selectedUsers) {
          ids.push(user.id)
        }
        return ids
      }
    },
    watch: {
      'keyword' () {
        this.currentChange(1)
      },
      'user.admin_type' () {
        if (this.user.admin_type === 'Super Admin') {
          this.user.problem_permission = 'All'
        } else if (this.user.admin_type === 'Regular User') {
          this.user.problem_permission = 'None'
        }
      },
      'uploadUsersCurrentPage' (page) {
        this.uploadUsersPage = this.uploadUsers.slice((page - 1) * this.uploadUsersPageSize, page * this.uploadUsersPageSize)
      }
    }
  }
</script>

<style scoped lang="less">
  .import-user-icon {
    color: #555555;
    margin-left: 4px;
  }

  .userPreview {
    padding-left: 10px;
  }

  .notification {
    p {
      margin: 0;
      text-align: left;
    }
  }
</style>
