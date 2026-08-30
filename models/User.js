const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    highscore: { type: Number, default: 0, min: 0 },
    coins: { type: Number, default: 0, min: 0 },
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)
