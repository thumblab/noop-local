import axios from 'axios'

export let baseUrl = '__BASE_URL__'

if (baseUrl.indexOf('BASE_URL')) baseUrl = 'http://localhost:1235/api'

export const request = axios.create({
  baseURL: baseUrl,
  timeout: 15000
})

request.interceptors.response.use(function (response) {
  return response
}, function (err) {
  // store.dispatch('errors/publish', err, { root: true })
  return Promise.reject(err)
})
