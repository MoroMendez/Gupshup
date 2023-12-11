const express = require('express')
const app = express()

app.use(require('./gupshup'))

module.exports = app