import axios from 'axios'

export const addSample = (id, name, aisle) => {
  return axios.post('/api/samples', { id, name, aisle })
}

export const removeSample = (id) => {
  return axios.delete(`/api/samples/${id}`)
}

export const listSamples = () => {
  return axios.get('/api/samples')
}
