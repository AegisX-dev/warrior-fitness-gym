const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    membershipType: {
        type: String,
        enum: ['basic', 'premium', 'vip'],
        default: 'basic'
    },
    membershipStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    membershipExpiry: {
        type: Date,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Member', memberSchema);