import Vue from 'vue'
import router from './router'
import axios from 'axios'
import utils from '@/utils/utils'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  // 登录
  login (username, password) {
    return ajax('login', 'post', {
      data: {
        username,
        password
      }
    })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getProfile () {
    return ajax('profile', 'get')
  },
  getAnnouncementList (offset, limit, keyword) {
    return ajax('admin/announcement', 'get', {
      params: {
        offset,
        limit,
        keyword
      }
    })
  },
  deleteAnnouncement (id) {
    return ajax('admin/announcement', 'delete', {
      params: { id }
    })
  },
  editAnnouncement (data) {
    return ajax('admin/announcement', 'put', { data })
  },
  addAnnouncement (data) {
    return ajax('admin/announcement', 'post', { data })
  },
  getUserList (offset, limit, keyword) {
    return ajax('admin/user', 'get', {
      params: {
        offset,
        limit,
        keyword
      }
    })
  },
  getUser (id) {
    return ajax('admin/user', 'get', { params: { id } })
  },
  editUser (data) {
    return ajax('admin/user', 'put', { data })
  },
  deleteUsers (id) {
    return ajax('admin/user', 'delete', { params: { id }})
  },
  addUser (data) {
    return ajax('admin/user', 'post', { data })
  },
  generateUser (data) {
    return ajax('admin/generate_user', 'post', { data })
  },
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
  getWebsiteConfig () {
    return ajax('admin/website', 'get')
  },
  editWebsiteConfig (data) {
    return ajax('admin/website', 'post', { data })
  },
  getJudgeServer () {
    return ajax('admin/judge_server', 'get')
  },
  deleteJudgeServer (hostname) {
    return ajax('admin/judge_server', 'delete', { params: { hostname } })
  },
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
  // 导入用户
  importUsers (users) {
    let data = []
    for (let user of users) {
      data.push({
        username: user[0],
        real_name: user[1],
        email: user[2],
        password: user[3]
      })
    }
    return ajax('admin/import_user', 'post', { data: { users: data } })
  },
  downloadTestCase (id) {
    return ajax('admin/test_case', 'get', {
      params: { id },
      responseType: 'blob'
    })
  },
  getLanguages () {
    return ajax('languages', 'get')
  },
  getProblemTagList () {
    return ajax('problem/tags', 'get')
  },
  addProblemTag (tag_name) {
    return ajax('problem/tags', 'post', { data: { tag_name } })
  },
  deleteProblemTag (tag_name) {
    return ajax('problem/tags', 'delete', { params: { tag_name } })
  },
  makeProblemPublic (id) {
    return ajax('admin/problem/make_public', 'post', { data: { id } })
  },
  addProblem (data) {
    return ajax('admin/problem', 'post', { data })
  },
  // 修改problem
  editProblem (data) {
    return ajax('admin/problem', 'put', { data })
  },
  getProblem (id) {
    return ajax('admin/problem', 'get', { params: { id } })
  },
  deleteProblem (id) {
    return ajax('admin/problem', 'delete', { params: { id } })
  },
  getProblemList (offset, limit, keyword, tag) {
    return ajax('admin/problem', 'get', {
      params: { offset, limit, keyword, tag }
    })
  },
  getContestProblem (problem_id, contest_id) {
    return ajax('admin/contest/problem', 'get', {
      params: { problem_id, contest_id }
    })
  },
  getContestProblemList (contest_id, page, limit) {
    return ajax('admin/contest/problem', 'get', {
      params: { contest_id, page, limit }
    })
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
  getReleaseNotes () {
    return ajax('admin/versions', 'get')
  },
  getDashboardInfo () {
    return ajax('admin/dashboard_info', 'get')
  },
  getSessions () {
    return ajax('sessions', 'get')
  },
  exportProblems (data) {
    return ajax('export_problem', 'post', {
      data
    })
  },
  getGroupList () {
  return ajax('admin/groups', 'get')
  },
  assignUsersToGroup (data) {
    // { user_id: [1,2], group_name: 'A1' }
    return ajax('admin/groups/assign', 'post', { data })
  },
  removeUsersFromGroup (data) {
    // { user_id: [1,2], group_name: 'A1' }
    return ajax('admin/groups/remove', 'post', { data })
  },
  clearUsersGroups (data) {
    // { user_id: [1,2] }
    return ajax('admin/groups/clear', 'post', { data })
  },
  assignProblemsToGroup (data) {
    // { problem_ids: [1,2], group_name: 'A1', replace_existing?: true }
    return ajax('admin/problem/groups/assign', 'post', { data })
  },
  removeProblemsFromGroup (data) {
    // { problem_ids: [1,2], group_name: 'A1' }
    return ajax('admin/problem/groups/remove', 'post', { data })
  },
  clearProblemsGroups (data) {
    // { problem_ids: [1,2] }
    return ajax('admin/problem/groups/clear', 'post', { data })
  },
    // ลบหลายปัญหาในคราวเดียว (ถ้าแก้ backend ให้รับ id=1,2,3 แล้ว)
  deleteProblem (ids) {
    const id = Array.isArray(ids) ? ids.join(',') : ids
    return ajax('admin/problem', 'delete', { params: { id } })
  },
}

/**
 * @param url
 * @param method get|post|put|delete...
 * @param params like queryString. if a url is index?a=1&b=2, params = {a: '1', b: '2'}
 * @param data post data, use for method put|post
 * @returns {Promise}
 */
function ajax (url, method, options) {
  if (options !== undefined) {
    var {params = {}, data = {}} = options
  } else {
    params = data = {}
  }
  return new Promise((resolve, reject) => {
    axios({
      url,
      method,
      params,
      data
    }).then(res => {
      // API正常返回(status=20x), 是否错误通过有无error判断
      if (res.data.error !== null) {
        Vue.prototype.$error(res.data.data)
        reject(res)
        // // 若后端返回为登录，则为session失效，应退出当前登录用户
        if (res.data.data.startsWith('Please login')) {
          router.push({name: 'login'})
        }
      } else {
        resolve(res)
        if (method !== 'get') {
          Vue.prototype.$success('Succeeded')
        }
      }
    }, res => {
      // API请求异常，一般为Server error 或 network error
      reject(res)
      Vue.prototype.$error(res.data.data)
    })
  })
}


