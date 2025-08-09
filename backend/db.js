const mongoose = require('mongoose');

function connectToDb() {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log('Connected to DB');
    }).catch(err => console.error('DB Connection Error:', err));
}

module.exports = connectToDb;