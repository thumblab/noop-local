import axios from 'axios'

export let baseUrl = '__BASE_URL__'

if (baseUrl === '__BASE_URL__') {
  baseUrl = process.env.NODE_ENV === 'production' ? `${window.location.origin}/api` : 'http://localhost:1235/api'
}

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
