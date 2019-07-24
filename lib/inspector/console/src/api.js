import axios from 'axios'

export let baseUrl = '__BASE_URL__'

if (baseUrl.indexOf('BASE_URL')) baseUrl = `${window.location.origin}/api`

export const request = axios.create({
  baseURL: baseUrl,
  timeout: 30000
})

request.interceptors.response.use(function (response) {
  return response
}, function (err) {
  // store.dispatch('errors/publish', err, { root: true })
  return Promise.reject(err)
})
