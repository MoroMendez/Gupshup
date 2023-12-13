const { Worker } = require('worker_threads')
const axios = require('axios')
const log = require('./log')
const { get } = require('../config/config')
const logger = log.create(__filename)
const fs = require('fs');
const qs = require('qs');
const FormData = require('form-data');
// const { PassThrough } = require("stream");
// const { Http2ServerResponse } = require('http2')
// const pathFile = require('path')

requestChat = async (uuid, connector, data) => {
    const cfg = log.initiate(logger, uuid, 'requestChat')
    log.info(cfg, 'Request', data)

    try {
        const answChatOpen = await getChatStatusOpen(uuid, data)
        // console.log('answChatOpen --->', answChatOpen);

        if (answChatOpen.active) {
            //chat activo, solo enviar nuevo mensaje
            console.log('EXISTE CHAT');

            let dataEvt = { ...data }
            dataEvt.chatID = answChatOpen.chatID

            if (dataEvt.type !== 'TEXT') {
                let answFile = await uploadFile(uuid, dataEvt)

                if (answFile && answFile.ok) {
                    dataEvt.fileId = answFile.data.file_id
                }
            }

            sendEventChat(uuid, dataEvt)

        } else {
            //No existe sesion previa, crear chat
            console.log('NO EXISTE CHAT');

            const answCreate = await createChat(uuid, data, connector)

            if (answCreate) {
                let dataCreate = { ...data }
                dataCreate.chatID = answCreate.chat_id

                if (dataCreate.type !== 'TEXT') {
                    let answFile = await uploadFile(uuid, dataCreate)

                    if (answFile && answFile.status === 200) {
                        dataCreate.fileId = answFile.data.file_id
                    }
                }

                sendEventChat(uuid, dataCreate)

                createWorker(uuid, answCreate.chat_id, data.phone)
            }
        }

        return true

    } catch (err) {
        log.error(cfg, err)
        return null
    }
}

getChatStatusOpen = async (uuid, data) => {
    const cfg = log.initiate(logger, uuid, 'getChatStatusOpen')
    log.info(cfg, 'Request', data)

    try {
        let url = get('accounts.brithpattern.url.base') + get('accounts.brithpattern.url.methods.active') + get('accounts.brithpattern.url.end')
        const platform = get('accounts.brithpattern.platform')
        let authorization = get('accounts.brithpattern.authorization')
        const appId = get('accounts.brithpattern.appId')

        url = url.replace(new RegExp('{platform}', 'gi'), platform)
        authorization = authorization.replace('{appId}', appId)
        authorization = authorization.replace('{clientId}', data.phone)

        const axiosRequest = {
            url,
            method: 'get',
            headers: {
                'Authorization': authorization
            }
        }

        const answBP = await axios.request(axiosRequest)
        const resp = {
            active: ['ivr', 'queued', 'connected'].includes(answBP.data.state),
            chatID: answBP.data.chat_id
        }

        log.info(cfg, 'Response', resp)
        return resp
    } catch (err) {
        if (err.response.status === 404)
            log.info(cfg, err, err.response.data)
        else
            log.error(cfg, err, err.response.data)

        let resp = { active: false }
        log.info(cfg, 'Response', resp)
        return resp
    }
}

createChat = async (uuid, data, connector) => {
    const cfg = log.initiate(logger, uuid, 'createChat')
    log.info(cfg, 'Request', data)

    try {
        let url = get('accounts.brithpattern.url.base') + get('accounts.brithpattern.url.end') + '&timestamp=' + (new Date).getTime() + '&callback=false'
        const platform = get('accounts.brithpattern.platform')
        let authorization = get('accounts.brithpattern.authorization')
        const appId = get('accounts.brithpattern.appId')
        const userAgent = get('accounts.brithpattern.userAgent')

        url = url.replace(new RegExp('{platform}', 'gi'), platform)
        authorization = authorization.replace('{appId}', appId)
        authorization = authorization.replace('{clientId}', data.phone)

        const axiosRequest = {
            url,
            method: 'post',
            timeout: get('accounts.brithpattern.timeOutMiliSec'),
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json; charset=UTF-8',
                'User-Agent': userAgent
            },
            data: {
                from: data.phone,
                phone_number: data.phone,
                parameters: {
                    first_name: data.name,
                    mensaje_inicial: data.message,
                    sessionId: data.sessionId,
                    //     email: 'mauricio.mendezaburto@gmail.coml',
                    //     number: data.phone
                }
            }
        }

        const answBP = await axios.request(axiosRequest)

        // const respSes = await Session.findOne({clientId: data.phone})
        // if(respSes){
        //     respSes.sessionID = uuid 
        //     respSes.chatID = answBP.data.chat_id
        //     respSes.save()
        // } else {
        //     let session = new Session()
        //     session.sessionID = uuid 
        //     session.clientId = data.phone
        //     session.originConnector = connector
        //     session.chatID = answBP.data.chat_id
        //     await session.save()
        // }

        log.info(cfg, 'Response', answBP.data)
        return answBP.data
    } catch (err) {
        log.error(cfg, err)
        log.info(cfg, 'Response', null)
        return null
    }
}

sendEventChat = async (uuid, data) => {
    const cfg = log.initiate(logger, uuid, 'sendEventChat')
    log.info(cfg, 'Request')

    try {
        let url = get('accounts.brithpattern.url.base') + get('accounts.brithpattern.url.methods.events') + get('accounts.brithpattern.url.end')
        const platform = get('accounts.brithpattern.platform')
        let authorization = get('accounts.brithpattern.authorization')
        const appId = get('accounts.brithpattern.appId')

        url = url.replace(new RegExp('{platform}', 'gi'), platform)
        url = url.replace('{chatId}', data.chatID)
        authorization = authorization.replace('{appId}', appId)
        authorization = authorization.replace('{clientId}', data.phone)

        let event = {}
        if (data.type && data.type === 'exit') {
            event = {
                event: "chat_session_end"
            }
        } else if (data.type && data.type !== 'TEXT') {
            event = {
                event: "chat_session_file",
                msg_id: `${data.chatID}:${(new Date).getTime()}`,
                file_type: data.fileMimeType,
                file_id: data.fileId,
                file_name: data.fileName
            }
        } else {
            event = {
                event: "chat_session_message",
                msg_id: `${data.chatID}:${(new Date).getTime()}`,
                msg: data.message
            }
        }

        const axiosRequest = {
            url,
            method: 'post',
            headers: {
                'Authorization': authorization
            },
            data: {
                events: [event]
            }
        }

        const answBP = await axios.request(axiosRequest)

        return true

    } catch (err) {
        if (err.response && err.response.data)
            log.error(cfg, err.response.data)
        else
            log.error(cfg, err)

        log.info(cfg, 'Response', false)
        return false
    }
}

uploadFile = async (uuid, data) => {
    const cfg = log.initiate(logger, uuid, 'uploadFile')
    log.info(cfg, 'Request')

    try {
        let url = get('accounts.brithpattern.url.baseFile') + get('accounts.brithpattern.url.end')
        const platform = get('accounts.brithpattern.platform')
        let authorization = get('accounts.brithpattern.authorization')
        const appId = get('accounts.brithpattern.appId')

        url = url.replace(new RegExp('{platform}', 'gi'), platform)
        authorization = authorization.replace('{appId}', appId)
        authorization = authorization.replace('{clientId}', data.phone)

        var dataForm = new FormData()
        dataForm.append(data.fileName, fs.createReadStream(data.filePath))

        const axiosRequest = {
            url,
            method: 'post',
            headers: {
                'Authorization': authorization,
                ...dataForm.getHeaders()
            },
            data: dataForm
        }

        const answBP = await axios.request(axiosRequest)

        fs.unlinkSync(data.filePath)

        return { ok: true, data: answBP.data }

    } catch (err) {
        if (err.response && err.response.data)
            log.error(cfg, err.response.data)
        else
            log.error(cfg, err)

        log.info(cfg, 'Response', false)
        return false
    }
}

downloadFile = async (uuid, data) => {
    const cfg = log.initiate(logger, uuid, 'downloadFile')
    log.info(cfg, 'Request')

    try {
        let url = get('accounts.brithpattern.url.base') + get('accounts.brithpattern.url.methods.files') + '/' + data.fileId
        const platform = get('accounts.brithpattern.platform')
        let authorization = get('accounts.brithpattern.authorization')
        const appId = get('accounts.brithpattern.appId')

        url = url.replace(new RegExp('{platform}', 'gi'), platform)
        url = url.replace('{chatId}', data.chatID)
        authorization = authorization.replace('{appId}', appId)
        authorization = authorization.replace('{clientId}', data.phone)

        const axiosRequest = {
            url,
            method: 'get',
            headers: {
                'Authorization': authorization
            },
            responseType: 'arraybuffer'
        }

        const data64 = await axios.request(axiosRequest).then(response => {
            return response = response.data.toString('base64')
        })

        fs.writeFile(`./public/uploads/${data.fileName.replace(/ /g, "_")}`, data64, { encoding: 'base64' }, (err) => { if (err) throw err; });

        return { ok: true, data: data64 }

    } catch (err) {
        if (err.response && err.response.data)
            log.error(cfg, err.response.data)
        else
            log.error(cfg, err)

        log.info(cfg, 'Response', false)
        return false
    }
}

createWorker = (uuid, chatID, phone) => {
    console.log('En createWorker >>', chatID, phone);
    const worker = new Worker('./server/middlewares/worker.js', { workerData: { chatID, phone } })
    worker.on('error', (err) => { console.log(`ERROR (${uuid})`, err); })
    worker.on('exit', _ => {
        console.log(`Thread exiting`);
    })
    
    worker.on('message', async (data) => {
        let url = get('accounts.gupshup.url')
        let authorization = get('accounts.gupshup.accesstoken')
        let axiosRequest = null
        let answ = null

        console.log('data', data)

        switch (data.type) {
            case 'message':
                if(data.msg.includes("/template")){
                    let template = data.msg.replace("/template","")
                    template = data.msg.replace("[","")
                    template = data.msg.replace("]","")
                    console.log("template:",template)
                    axiosRequest = {
                            url,
                            method: 'post',
                            headers: {
                                'D360-API-KEY': authorization
                            },
                            data: {
                                    "to": data.phone,
                                    "type": "template",
                                    "template": { 
                                    "namespace": "c8ae5f90_307a_ca4c_b8f6_d1e2a2573574",
                                        "language": {
                                            "policy": "deterministic",
                                            "code": "de"
                                        },
                                        "name": "disclaimer",
                                        "components": [{
                                            "type": "body"
                                            }]
                                    }
                                }
                            }
                } else {
                    let data_1 = qs.stringify({
                            'channel': 'whatsapp',
                            'source': '917834811114',
                            'src.name': 'DevMoro',
                            'destination': data.phone,
                            'message': data.msg,
                            'disablePreview': 'true',
                            'encode': 'true' 
                          })
                    axiosRequest = {
                        url,
                        method: 'post',
                        maxBodyLength: Infinity,
                        headers: {
                            'apikey': authorization,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data:data_1

                        }
            }
                await axios.request(axiosRequest)
                .then((response) => {
                    console.log(JSON.stringify(response.data));
                  })
                  .catch((error) => {
                    console.log(error);
                  });
                break;

            case 'file':
                const dir = get('global.upload.directory')
                const uri = get('global.upload.uri')

                const answFile = await downloadFile(uuid, data)

                const fileUrl = `${dir}/${data.fileName.replace(/ /g, "_")}`
                
                let data_1 = qs.stringify({
                    'channel': 'whatsapp',
                    'source': '917834811114',
                    'src.name': 'DevMoro',
                    'destination': data.phone,
                    'disablePreview': 'true',
                    'encode': 'true' 
                  })
                axiosRequest = {
                    url,
                    method: 'post',
                    headers: {
                        'D360-API-KEY': authorization
                    },
                    data:data_1
                }
                //console.log(data.fileType)
                if (data.fileType in ['JPG', 'JPEG', 'PNG', 'GIF']){
                    axiosRequest.data.message = {
                        "type":"image",
                        "originalUrl":fileUrl,
                        "previewUrl":fileUrl,
                        "caption":data.fileName
                     }
                 } else if (data.fileType in ['AAC', 'AMR', 'MP3', 'OGG'])
                 {
                    axiosRequest.data.message = {
                        "type":"audio",
                        "url":fileUrl
                     }
                 }
                else
                {
                    axiosRequest.data.message = {
                        "type":"file",
                        "url":fileUrl,
                        "filename":data.fileName
                     }
                 }

                //console.log(axiosRequest)

                answ = await axios.request(axiosRequest)
                

                break;

            case 'exit':
                sendEventChat(uuid, data)
                break;
        }
    })
    return worker
}

module.exports = {
    requestChat
}