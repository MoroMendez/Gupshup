const { Schema, model } = require('mongoose')

let validTypes = {
    values: ['wavy','rapiwha'],
    message: '{VALUE} is not a valid type'
}

let sessionSchema = new Schema({
    clientId: {type: String, required: true, index: true},
    originConnector: {type: String, enum: validTypes},
    sessionID: String,
    chatID: String,
    createDate: {type: Number, default: Date.now}
},
{ 
    versionKey: false
})

module.exports = model('Session', sessionSchema)
