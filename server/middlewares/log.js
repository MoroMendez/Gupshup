const log4js = require('log4js');
const path = require('path')
const uniqid = require('uniqid')
const requestIp = require('request-ip')
const { isJson } = require('./util')
const { cfgLog } = require('../config/config')
const passFields = ['password', 'passw', 'pass', 'contrasena', 'pswd']

log4js.configure(cfgLog.config)

create = (fileName) => {
    let logger = log4js.getLogger(cfgLog.name)
    logger.addContext('archivo', path.basename(fileName))
    return logger
}

initiate = (logger, uuid = undefined, funcion) => {
    uuid = !uuid ? uniqid() : uuid
    return {
        logger, 
        uuid, 
        funcion
    }
}

request = (logger, req, funcion) => {
    const ip = requestIp.getClientIp(req) != '::1' ? requestIp.getClientIp(req).replace('::ffff:','') : 'localhost'
    let bodyNuevo = {...req.body} // Object.assign({}, req.body)
    let uuid = (req && req.body && req.body.uuid) ? req.body.uuid : uniqid()

    for(const field of passFields){
        if (bodyNuevo[field]) bodyNuevo[field] = '*****'
    }

    logger.info(`[${uuid}] [${funcion}] Request from ${ip} [${req.method} > ${req.originalUrl}]: ${JSON.stringify(bodyNuevo)}`)
    return {logger, uuid, funcion}
}

response = (logInfo, res, respuesta, status = 200, logAnsw = true) => {   
    let msg = ''
    let r = {...respuesta}
    if(!logAnsw && r.data) r.data = '[[DATA OMITTED]]'
    try {
        if(isJson(r, true)) r = JSON.stringify(r)
    } catch (err) {}
    msg = `[${logInfo.uuid}] [${logInfo.funcion}] Response [${res.req.method} > ${status} > ${res.req.originalUrl}]: ${r}`
    
    switch (status.toString().substring(0, 1)) {
        case '4':
            logInfo.logger.warn(msg)            
            break;            
        case '5':
            logInfo.logger.error(msg)            
            break;
        default:
            logInfo.logger.info(msg)
            break;
    }
    return res.status(status).json(respuesta)
}

info = (logInfo, ...msg) => {
    let params = ''
    msg.forEach(function(element) { 
        try {
            if(isJson(element, true)) element = JSON.stringify(element)
        } catch (err) {}
        params += `${element} `
    })  
    logInfo.logger.info(`[${logInfo.uuid}] [${logInfo.funcion}] ${params.trim()}`)
}

warn = (logInfo, ...msg) => {
    let params = ''
    msg.forEach(function(element) { 
        try {
            if(isJson(element, true)) element = JSON.stringify(element)
        } catch (err) {}
        params += `${element} `
    })  
    logInfo.logger.warn(`[${logInfo.uuid}] [${logInfo.funcion}] ${params.trim()}`)
}

error = (logInfo, ...msg) => {
    let params = ''
    msg.forEach(function(element) { 
        try {
            if(isJson(element, true)) element = JSON.stringify(element)
        } catch (err) {}
        params += `${element} `
    })  
    logInfo.logger.error(`[${logInfo.uuid}] [${logInfo.funcion}] ${params.trim()}`)
}

module.exports = {
    create,
    initiate,
    request,
    response,
    info,
    warn,
    error
}