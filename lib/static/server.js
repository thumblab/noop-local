const express = require('express')
const app = express()
const morgan = require('morgan')

app.use(morgan('tiny'))
app.use(express.static('/content'))

app.listen(80)
