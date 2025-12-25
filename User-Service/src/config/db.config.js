const mongoose = require('mongoose');
const { ATLAS_DB_URL, NODE_ENV } = require('./server.config');

class DBConnection {
    constructor() {
        if (DBConnection.instance) {
            return DBConnection.instance;
        }
        this.isConnected = false;
        DBConnection.instance = this;
    }

    async connect() {
        if (this.isConnected) {
            console.log('DB Connection: Using existing connection');
            return;
        }

        try {
            if (NODE_ENV == "development") {
                await mongoose.connect(ATLAS_DB_URL);
                this.isConnected = true;
                console.log('DB Connection: New connection established');
            }
        } catch (error) {
            console.log('Unable to connect to the DB server');
            console.log(error);
            throw error;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('DB Connection: Disconnected');
        }
    }
}

const dbConnection = new DBConnection();
module.exports = dbConnection;
