try {
    console.log("Attempting to require problem.controller...");
    const controller = require('./src/controllers/problem.controller');
    console.log("Successfully required problem.controller");
} catch (error) {
    console.error("Error requiring problem.controller:");
    console.error(error);
}
