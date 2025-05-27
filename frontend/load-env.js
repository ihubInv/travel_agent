const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Environment variables loaded from .env file', process.env.NODE_ENV);