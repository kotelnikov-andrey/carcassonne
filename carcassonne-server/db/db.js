const knex = require('knex');
const knexConfig = require('../knexfile');

// Determine which environment we're in
const environment = process.env.NODE_ENV || 'development';

// Initialize knex with the appropriate configuration
const db = knex(knexConfig[environment]);

module.exports = db;