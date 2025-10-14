import Vue from 'vue'
import router from './router'
import axios from 'axios'
import utils from '@/utils/utils'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  // auth
  login (username, password) {
    return ajax('login', 'post', { data: { username, password } })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getProfile () {
    return ajax('profile', 'get')
  },

  // announcement
  getAnnouncementList (offset, limit, keyword) {
    return ajax('admin/announcement', 'get', { params: { offset, limit, keyword } })
  },
  deleteAnnouncement (id) {
    return ajax('admin/announcement', 'delete', { params: { id } })
  },
  editAnnouncement (data) {
    return ajax('admin/announcement', 'put', { data })
  },
  addAnnouncement (data) {
    return ajax('admin/announcement', 'post', { data })
  },

  // user
  getUserList (offset, limit, keyword) {
    return ajax('admin/user', 'get', { params: { offset, limit, keyword } })
  },
  getUser (id) {
    return ajax('admin/user', 'get', { params: { id } })
  },
  editUser (data) {
    return ajax('admin/user', 'put', { data })
  },
  deleteUsers (id) {
    return ajax('admin/user', 'delete', { params: { id } })
  },
  addUser (data) {
    return ajax('admin/user', 'post', { data })
  },
  generateUser (data) {
    return ajax('admin/generate_user', 'post', { data })
  },

  // smtp
  getSMTPConfig () {
    return ajax('admin/smtp', 'get')
  },
  addSMTPConfig (data) {
    return ajax('admin/smtp', 'post', { data })
  },
  editSMTPConfig (data) {
    return ajax('admin/smtp', 'put', { data })
  },
  testSMTPConfig (data) {
    return ajax('admin/smtp_test', 'post', { data })
  },

  // website
  getWebsiteConfig () {
    return ajax('admin/website', 'get')
  },
  editWebsiteConfig (data) {
    return ajax('admin/website', 'post', { data })
  },

  // judge server
  getJudgeServer () {
    return ajax('admin/judge_server', 'get')
  },
  deleteJudgeServer (hostname) {
    return ajax('admin/judge_server', 'delete', { params: { hostname } })
  },

  // contest
  getContestList (offset, limit, keyword) {
    return ajax('admin/contest', 'get', { params: { offset, limit, keyword } })
  },
  addContest (data) {
    return ajax('admin/contest', 'post', { data })
  },
  getContest (id) {
    return ajax('admin/contest', 'get', { params: { id } })
  },
  editContest (data) {
    return ajax('admin/contest', 'put', { data })
  },
  deleteContest (id) {
    return ajax('admin/contest', 'delete', { params: { id } })
  },

  // import users
  importUsers (users) {
    const data = users.map(u => ({
      username: u[0],
      real_name: u[1],
      email: u[2],
      password: u[3]
    }))
    return ajax('admin/import_user', 'post', { data: { users: data } })
  },

  // languages
  getLanguages () {
    return ajax('languages', 'get')
  },

  // problem tags
  getProblemTagList (params = {}) {
    // เติม default เผื่อ FE ไม่ส่งมา จะดึงได้มากขึ้น
    const finalParams = { keyword: '', offset: 0, limit: 1000, ...params }
    return ajax('problem/tags', 'get', { params: finalParams })
  },
  addProblemTag (tag_name) {
    return ajax('problem/tags', 'post', { data: { tag_name } })
  },
  deleteProblemTag (tag_name) {
    return ajax('problem/tags', 'delete', { params: { tag_name } })
  },

  // problems (public)
  makeProblemPublic (id) {
    return ajax('admin/problem/make_public', 'post', { data: { id } })
  },

  // problems (admin)
  addProblem (data) {
    return ajax('admin/problem', 'post', { data })
  },
  editProblem (data) {
    return ajax('admin/problem', 'put', { data })
  },
  getProblem (id) {
    return ajax('admin/problem', 'get', { params: { id } })
  },

  // ✅ รวมฟังก์ชันลบปัญหา ให้เหลืออันเดียว รองรับทั้ง id เดี่ยวและหลาย id
  deleteProblem (ids) {
    const id = Array.isArray(ids) ? ids.join(',') : ids
    return ajax('admin/problem', 'delete', { params: { id } })
  },

  getProblemList (offset, limit, keyword, tag) {
    return ajax('admin/problem', 'get', { params: { offset, limit, keyword, tag } })
  },

  // contest problems
  getContestProblem (problem_id, contest_id) {
    return ajax('admin/contest/problem', 'get', { params: { problem_id, contest_id } })
  },
  getContestProblemList (contest_id, page, limit) {
    return ajax('admin/contest/problem', 'get', { params: { contest_id, page, limit } })
  },
  addContestProblem (data) {
    return ajax('admin/contest/problem', 'post', { data })
  },
  editContestProblem (data) {
    return ajax('admin/contest/problem', 'put', { data })
  },
  deleteContestProblem (id) {
    return ajax('admin/contest/problem', 'delete', { params: { id } })
  },
  makeContestProblemPublic (data) {
    return ajax('admin/contest_problem/make_public', 'post', { data })
  },
  addProblemFromPublic (data) {
    return ajax('admin/contest/add_problem_from_public', 'post', { data })
  },

  // release notes / dashboard / session
  getReleaseNotes () {
    return ajax('admin/versions', 'get')
  },
  getDashboardInfo () {
    return ajax('admin/dashboard_info', 'get')
  },
  getSessions () {
    return ajax('sessions', 'get')
  },

  // import/export problem
  exportProblems (data) {
    return ajax('export_problem', 'post', { data })
  },

  // groups
  getGroupList () {
    return ajax('admin/groups', 'get')
  },
  assignUsersToGroup (data) {
    // expects: { user_ids: [1,2], group_name: 'A1' }
    return ajax('admin/groups/assign', 'post', { data })
  },
  removeUsersFromGroup (data) {
    // expects: { user_ids: [1,2], group_name: 'A1' }
    return ajax('admin/groups/remove', 'post', { data })
  },
  clearUsersGroups (data) {
    // expects: { user_ids: [1,2] }
    return ajax('admin/groups/clear', 'post', { data })
  },

  assignProblemsToGroup (data) {
    // expects: { problem_ids: [1,2], group_name: 'A1', replace_existing?: true }
    return ajax('admin/problem/groups/assign', 'post', { data })
  },
  removeProblemsFromGroup (data) {
    // expects: { problem_ids: [1,2], group_name: 'A1' }
    return ajax('admin/problem/groups/remove', 'post', { data })
  },
  clearProblemsGroups (data) {
    // expects: { problem_ids: [1,2] }
    return ajax('admin/problem/groups/clear', 'post', { data })
  },

  // spj
  compileSPJ (data) {
    return ajax('admin/compile_spj', 'post', { data })
  }
}

/**
 * ajax wrapper
 */
function ajax (url, method, options) {
  let params = {}
  let data = {}
  if (options) ({ params = {}, data = {} } = options)

  return new Promise((resolve, reject) => {
    axios({ url, method, params, data }).then(res => {
      // ✅ ถือว่าสำเร็จถ้าไม่มี error หรือ error เป็น falsy
      const hasError = res && res.data && res.data.error
      if (hasError) {
        const msg = (res.data && (res.data.data || res.data.error)) || 'Request failed'
        Vue.prototype.$error(String(msg))
        // ถ้า message เป็น string และบอกว่าไม่ได้ล็อกอิน ค่อย redirect
        if (typeof msg === 'string' && msg.startsWith('Please login')) {
          router.push({ name: 'login' })
        }
        reject(res)
      } else {
        resolve(res)
        if (method !== 'get') Vue.prototype.$success('Succeeded')
      }
    }).catch(err => {
      const msg =
        (err.response && err.response.data && (err.response.data.error || err.response.data.data)) ||
        err.message || 'Network error'
      Vue.prototype.$error(String(msg))
      reject(err)
    })
  })
}
