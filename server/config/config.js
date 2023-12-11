//Configuracion general
const cfg = {
    global: {
        servicePort: 3000,
        vendor: 'bp',
        upload: {
            directory: 'uploads',
            uri: `https://1521-190-22-116-217.ngrok-free.app`,
            maxSizeMbPerFile: 50
        }
    },
    accounts: {
        gupshup: {
            url: 'https://api.gupshup.io/sm/api/v1/msg',
            accesstoken: '7n4iidqu1v0zzl9fvu5adtdipg9ynlqt',
            numero: '917834811114'
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
            platform: 'c3n-demo1.brightpattern.com',
            authorization: 'MOBILE-API-140-327-PLAIN appId="{appId}", clientId="{clientId}"',
            appId: '0e1f03d6fe424e1cac974cf87e829e62',
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