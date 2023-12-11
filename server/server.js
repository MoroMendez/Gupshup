const { get } = require('./config/config')
const express = require('express')
const bodyParser = require('body-parser')
const log = require('./middlewares/log')
const fs = require('fs')
const https = require('https')

const app = express()
const logger = log.create(__filename)
const portExpress = get('global.servicePort')


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token")
    next()
})



app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(require('./routes/index'))
app.use( express.static('public'))


 app.listen(portExpress, () => {
        const cfg = log.initiate(logger, undefined, 'app.listen')
        console.clear()
        log.info(cfg, `Server Online >> localhost:${portExpress}`)
    })