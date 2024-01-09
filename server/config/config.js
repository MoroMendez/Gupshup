//Configuracion general
const cfg = {
    global: {
        servicePort: process.env.PORT,
        vendor: 'bp',
        upload: {
            directory: 'uploads',
            uri: ``,
            maxSizeMbPerFile: 50
        }
    },
    accounts: {
        gupshup: {
            url: process.env.URL_GSH,
            accesstoken: process.env.TOKEN_GSH,
            numero: process.env.NUM_GSH,
            namebot: process.env.NAME_GSH,
            fileurl:process.env.C3N_FILEURL
        },
        brithpattern: {
            url: {
                base: 'https://{platform}/clientweb/api/v1/chats',
                baseFile: 'https://{platform}/clientweb/api/v1/files',
                end: '?tenantUrl={platform}',
                methods: {
                    active: '/active',
                    events: '/{chatId}/events',
                    files: '/{chatId}/files'
                }
            },
            platform: process.env.PLT_BP,
            authorization: 'MOBILE-API-140-327-PLAIN appId="{appId}", clientId="{clientId}"',
            appId: process.env.APPID_BP,
            userAgent: 'MobileClient',
            timeOutMiliSec: 15000
        }
    }
}

get = (...items) => {
    try {
        return items.length > 0 ? eval(`cfg.${items.join('.')}`) : undefined
    } catch (e) {
        throw new Error(`Config not found in path ${items.join('.')}`)
    }
}

//LOG >>>  all < trace < debug < info < warn < error < fatal < mark < off 
const cfgLog = {
    name: 'app',
    config: {
        appenders: {
            app: {
                type: 'dateFile',
                filename: 'log/appLog.log',
                pattern: '.yyyy-MM-dd',
                daysToKeep: 15,
                compress: true,
                layout: { type: 'pattern', pattern: '[%d] %p [%h] %X{archivo} %m' }
            },
            console: { type: 'console', layout: { type: 'pattern', pattern: '[%d] %[%p%] [%h] %[%X{archivo}%] %m' } }
        },
        categories: { default: { appenders: ['app', 'console'], level: 'all' } }
    }
}

module.exports = {
    cfgLog,
    get
}