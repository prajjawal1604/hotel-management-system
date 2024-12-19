const connectionManager = require('./connectionManager');

async function initializeDatabases() {
    try {
        // Connect to master
        await connectionManager.connectToMaster();
        
        // Connect to org DB using hardcoded ID
        await connectionManager.connectToOrg();
        
        console.log('Both databases connected successfully');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initializeDatabases };