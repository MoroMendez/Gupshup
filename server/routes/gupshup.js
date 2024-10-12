const express = require('express')
const { get, cfgLog } = require('../config/config')
const log = require('../middlewares/log')
const BP = require('../middlewares/brightpattern')
const { downloadFile } = require('../middlewares/util')
const pathFile = require('path')


const app = express()
const logger = log.create(__filename)
const vendor = get('global.vendor')
const wnumber = get('accounts.gupshup.numero')
const path = 'gupshup'



app.post(`/${vendor}/${path}/webhook`, async(req, res) => {

    //console.log(req.body)
    

    if(req.body.payload.type == 'sandbox-start') { return res.status(200).json( ) }

    if(req.body.type == 'message-event' || req.body.type == 'billing-event') { 
        console.log(req.body.payload.type);  
        console.log(req.body.payload.id);        
        return res.status(200).json( ) 
    }
    

    
    res.status(200).json( )
    const cfg = log.request(logger, req, 'webhook')
    let answ = {}
    
    let {body} = req
    let p = body.payload
    let s = body.payload.sender

    

    try {
        let answBP
        let answFile = { ok: true }

        // if (m.statuses){
        //     console.log(m.statuses[0].status)
        //     return res.status(200).json( )
        // }

        if (p.type=='text') {

                dataMessage = {
                    whatsappNumber: wnumber,
                    phone: p.source,
                    message: p.payload.text,
                    name: s.name,
                    type: 'TEXT',
                }


            } else if (p.type=='button_reply') {
                dataMessage = {
                    whatsappNumber: wnumber,
                    phone: p.source,
                    message: p.payload.title,
                    name: s.name,
                    type: 'TEXT',
                }
                
            } else if (p.type=='list_reply') {
                dataMessage = {
                    whatsappNumber: wnumber,
                    phone: p.source,
                    message: p.payload.title,
                    name: s.name,
                    type: 'TEXT',
                }
                
            } else if (p.type=='location') {
                dataMessage = {
                    whatsappNumber: wnumber,
                    phone: p.source,
                    message: `https://www.google.com/maps/@${p.payload.latitude},${p.payload.longitude},15z?entry=ttu`,
                    name: s.name,
                    type: 'TEXT',
                    subtype:'location',
                    latitude: p.payload.latitude,
                    longitude: p.payload.longitude
                }
                
            } else {

                let fileName = null
                let filePath = null


                if (p.type=='image') {
                    filePath = p.payload.url
                    Mediafile = filePath.toString().split('/')
                    Mediafile = Mediafile[Mediafile.length - 1]
                    console.log('Mediafile 1',Mediafile)
                    Mediafile = Mediafile.toString().split('?')
                    console.log('Mediafile 2',Mediafile)
                    fileName = Mediafile[0]+'.jpg'
                    fileType = "image"

                } else if (p.type=='sticker') {
                    filePath = p.payload.url
                    Mediafile = filePath.toString().split('/')
                    Mediafile = Mediafile[Mediafile.length - 1]
                    console.log('Mediafile 1',Mediafile)
                    Mediafile = Mediafile.toString().split('?')
                    console.log('Mediafile 2',Mediafile)
                    fileName = Mediafile[0]+'.webp'
                    fileType = "image"

                } else if (p.type=='file') {
                    filePath = p.payload.url
                    fileName = p.payload.name
                    fileType = "attachment"

                } else if (p.type=='audio') {                                      
                    filePath = p.payload.url
                    Mediafile = filePath.toString().split('/')
                    Mediafile = Mediafile[Mediafile.length - 1]
                    console.log('Mediafile 1',Mediafile)
                    Mediafile = Mediafile.toString().split('?')
                    console.log('Mediafile 2',Mediafile)
                    fileName = Mediafile[0]+'.mp3'
                    fileType = "attachment"
                
                } else if (p.type=='video') {                                      
                    filePath = p.payload.url
                    Mediafile = filePath.toString().split('/')
                    Mediafile = Mediafile[Mediafile.length - 1]
                    console.log('Mediafile 1',Mediafile)
                    Mediafile = Mediafile.toString().split('?')
                    console.log('Mediafile 2',Mediafile)
                    fileName = Mediafile[0]+'.mp4'
                    fileType = "attachment"
                
                } else {
                    filePath = p.payload.url
                    fileName = p.payload.name
                    fileType = "attachment"
                }

               answFile = await downloadFile(filePath, pathFile.join(__dirname, `../${get('global.upload.directory')}/${fileName}`))

                dataMessage = {
                    whatsappNumber: wnumber,
                    phone: p.source,
                    message: p.payload.text,
                    name: s.name,
                    type: 'FILE',
                    filePath: pathFile.join(__dirname, `../${get('global.upload.directory')}/${fileName}`),
                    fileName: fileName,
                    fileType: fileType
                }
                console.log("dataMessage",dataMessage);
                
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
