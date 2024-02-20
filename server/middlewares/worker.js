const { isMainThread, parentPort, workerData } = require('worker_threads')
const axios = require('axios')
const { get } = require('../config/config')
const path = require('path')

if (!isMainThread) {
    //console.log('En Worker', workerData.chatID, workerData.phone);

    let url = get('accounts.brithpattern.url.base') + get('accounts.brithpattern.url.methods.events') + get('accounts.brithpattern.url.end')
    const platform = get('accounts.brithpattern.platform')
    let authorization = get('accounts.brithpattern.authorization')
    const appId = get('accounts.brithpattern.appId')

    url = url.replace(new RegExp('{platform}', 'gi'), platform)
    authorization = authorization.replace('{appId}', appId)

    const axiosRequest = {
        url: url.replace(new RegExp('{chatId}', 'gi'), workerData.chatID),
        method: 'get',
        headers: {
            'Authorization': authorization.replace('{clientId}', workerData.phone)
        }
    }
    let seguir = true

    async function fun() {
        do {
            let answ = await axios.request(axiosRequest)

            answ.data.events.filter(e => e.event == 'chat_session_message').forEach(e => {

                if (e.msg_text) console.log(workerData.phone, '>> msg_text: ', e.msg_text)
                if (e.msg) console.log(workerData.phone, '>> msg: ', e.msg)

                parentPort.postMessage({
                    type: 'message',
                    msg: e.msg_text ? e.msg_text : e.msg,
                    chatID: workerData.chatID,
                    phone: workerData.phone
                })
            })

            answ.data.events.filter(e => e.event == 'chat_session_timeout_warning').forEach(e => {

                if (e.msg_text) console.log(workerData.phone, '>> msg_text: ', e.msg_text)
                if (e.msg) console.log(workerData.phone, '>> msg: ', e.msg)

                parentPort.postMessage({
                    type: 'message',
                    msg: e.msg_text ? e.msg_text : e.msg,
                    chatID: workerData.chatID,
                    phone: workerData.phone
                })
            })
            
           answ.data.events.filter(e => e.event == 'chat_session_inactivity_timeout').forEach(e => {

                if (e.msg_text) console.log(workerData.phone, '>> msg_text: ', e.msg_text)
                if (e.msg) console.log(workerData.phone, '>> msg: ', e.msg)

                parentPort.postMessage({
                    type: 'message',
                    msg: e.msg_text ? e.msg_text : e.msg,
                    chatID: workerData.chatID,
                    phone: workerData.phone
                })
            })   
            
            

            answ.data.events.filter(e => e.event == 'chat_session_file').forEach(e => {

                const validExt = ['JPG', 'JPEG', 'PNG', 'AAC', 'MP4', 'AMR', 'MP3', 'OGG', 'PDF', 'XLS', 'XLSL', 'DOC', 'DOCX']

                if (validExt.includes(path.extname(e.file_name).substr(1).toUpperCase())) {

                    path.extname(e.file_name).substr(1).toUpperCase()
                    parentPort.postMessage({
                        type: 'file',
                        chatID: workerData.chatID,
                        phone: workerData.phone,
                        fileId: e.file_id,
                        fileName: e.file_name,
                        fileType: path.extname(e.file_name).substr(1).toUpperCase()
                    })
                }
            })

            seguir = answ.data.events.find(e => ['chat_session_ended'].includes(e.event)) ? false : true
            if (!seguir)
                parentPort.postMessage({
                    type: 'exit',
                    chatID: workerData.chatID,
                    phone: workerData.phone
                })
            console.log('seguir', seguir, '>', workerData.phone)
        } while (seguir)
    }

    fun()
}