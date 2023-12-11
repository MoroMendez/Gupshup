const express = require('express')
const { get, cfgLog } = require('../config/config')
const log = require('../middlewares/log')
const BP = require('../middlewares/brightpattern')
const { downloadFile } = require('../middlewares/util')
const pathFile = require('path')


const app = express()
const logger = log.create(__filename)
const vendor = get('global.vendor')
const path = 'gupshup'



app.post(`/${vendor}/${path}/webhook`, async(req, res) => {

    console.log(req.body)
    res.status(200).json( )

if(req.body.channel == 'telegram') { return res.status(200).json( ) }


    const cfg = log.request(logger, req, 'webhook')
    let answ = {}
    
    let m = JSON.parse(req.body.messageobj)
    let s = JSON.parse(req.body.senderobj)
    let c = JSON.parse(req.body.contextobj)

    

    try {
        let answBP
        let answFile = { ok: true }

        // if (m.statuses){
        //     console.log(m.statuses[0].status)
        //     return res.status(200).json( )
        // }

        if (m.type=='text') {

                dataMessage = {
                    whatsappNumber: c.sourceId,
                    phone: m.from,
                    message: m.text,
                    name: s.display,
                    type: 'TEXT',
                }


            } else {

                let fileName = null
                let Mediafile = null
                let filePath = null


                if (m.type=='image') {
                    filePath = m.url
                    Mediafile = m.url.toString().split('/')
                    fileName = Mediafile[Mediafile.length - 1]

                } else if (m.type=='audio') {
                    filePath = m.url
                    Mediafile = m.url.toString().split('/')
                    fileName = Mediafile[Mediafile.length - 1]

                } else if (m.type=='file') {
                    filePath = m.url
                    Mediafile = m.url.toString().split('/')
                    fileName = Mediafile[Mediafile.length - 1]

                } else {
                    filePath = m.url
                    Mediafile = m.url.toString().split('/')
                    fileName = m.caption
                }

                answFile = await downloadFile(filePath, pathFile.join(__dirname, `../${get('global.upload.directory')}/${fileName}`))

                dataMessage = {
                    whatsappNumber: c.sourceId,
                    phone: m.from,
                    message: m.text,
                    name: s.display,
                    type: 'FILE',
                    filePath: pathFile.join(__dirname, `../${get('global.upload.directory')}/${fileName}`),
                    fileName: fileName
                }
            }

            answBP = await BP.requestChat(cfg.uuid, path, dataMessage)
        
    } catch (err) {
        console.error(err)
        log.error(cfg, err)
        answ = {
            ok: false,
            err: err.message
        }

        return log.response(cfg, res, answ)
    }


})


module.exports = app