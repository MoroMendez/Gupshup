const moment = require('moment')
const isJson = require('is-json')
const fs = require("fs")
const https = require('follow-redirects').https;

setLogFile = (logger, f, d) => {
    logger.addContext('archivo', f.slice(d.length + 1))
}

validaCampo = (nombre, valor, tipo = 'string', empty = true) => {
    if (!valor && !empty) throw new Error(`Falta el campo: ${nombre}`)

    switch (tipo) {
        case 'number':
            if (isNaN(valor)) throw new Error(`El campo: ${nombre}, no es un numero valido`)
            break
        case 'email':
            if (!isEmail(valor)) throw new Error(`El campo: ${nombre}, no es un email valido`)
            break
        case 'boolean':
            if (!isBoolean(valor)) throw new Error(`El campo: ${nombre}, no es un boleano valido`)
            break
        case 'date':
            if (!moment(valor).isValid()) throw new Error(`El campo: ${nombre}, no es una fecha valida`)
            break
        case 'json':
            if (!isJson(valor, true)) throw new Error(`El campo: ${nombre}, no es un json valido`)
            break;
        case 'array':
            if (!Array.isArray(valor)) throw new Error(`El campo: ${nombre}, no es un arreglo valido`)
            break;
        case 'string':
            if (!empty && valor.trim().length === 0) throw new Error(`El campo: ${nombre}, esta vacio`)
            valor = valor ? valor.trim() : ''
            break
        default:
            break;
    }

    return valor
}

isNumeric = (n) => {
    return (typeof n == "number" && !isNaN(n));
}

isEmail = email => {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

isBoolean = val => {
    return (typeof val === "boolean")
}

normalize = str => {
    let from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç"
    let to = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc"
    let mapping = {}

    for (let i = 0, j = from.length; i < j; i++)
        mapping[from.charAt(i)] = to.charAt(i)

    let ret = []
    for (let i = 0, j = str.length; i < j; i++) {
        let c = str.charAt(i)
        if (mapping.hasOwnProperty(str.charAt(i)))
            ret.push(mapping[c])
        else
            ret.push(c)
    }
    return ret.join('')
}

verifiDateInRange = (date, endDateFrom, endDateTo) => {
    if (!date) return false
    if (!endDateFrom && !endDateTo) return true

    if (endDateFrom && endDateTo) {
        return (endDateFrom <= date) && (date <= endDateTo)
    } else if (endDateFrom && !endDateTo) {
        return endDateFrom <= date
    } else if (!endDateFrom && endDateTo) {
        return date <= endDateTo
    }
}

downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {

        let answ = "";
        console.log(dest);
        console.log(url);

        const file = fs.createWriteStream(dest, { flags: "w" });
        const request = https.get(url, response => {
            console.log(response);
            if (response.statusCode === 200) {
                response.pipe(file)
            } else {
                file.close()
                fs.unlink(dest, () => {})

                answ = {
                    ok: false,
                    code: response.statusCode,
                    err: response.statusMessage
                }

                reject(answ)
            }
        })

        request.on("error", err => {
            file.close();
            fs.unlink(dest, () => {})
            answ = {
                ok: false,
                code: err.code,
                err: err.message
            }
            reject(answ)
        })

        file.on("finish", () => {
            answ = {
                ok: true
            }
            resolve(answ)
        });

        file.on("error", err => {
            file.close()

            if (err.code === "EEXIST") {
                answ = {
                    ok: false,
                    code: -1,
                    err: 'File already exists'
                }
                reject(answ);
            } else {
                fs.unlink(dest, () => {})
                answ = {
                    ok: false,
                    code: err.code,
                    err: err.message
                }
                reject(answ)
            }
        })
    })
}

module.exports = {
    setLogFile,
    validaCampo,
    isNumeric,
    isJson,
    normalize,
    verifiDateInRange,
    downloadFile
}