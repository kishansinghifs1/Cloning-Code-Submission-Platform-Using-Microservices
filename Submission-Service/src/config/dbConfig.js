const mongoose = require('mongoose');
const { ATLAS_DB_URL, NODE_ENV } = require('./serverConfig');


async function connectToDB() {

    try {
        if (!ATLAS_DB_URL) {
            throw new Error('ATLAS_DB_URL is not configured');
        }

        await mongoose.connect(ATLAS_DB_URL);
        console.log(`Mongodb connected (${NODE_ENV || 'unknown'})`);
    } catch(error) {
        console.log('Unable to connect to the DB server');
        console.log(error);
    }

}

module.exports = connectToDB;