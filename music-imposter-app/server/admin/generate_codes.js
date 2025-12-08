const mongoose = require('mongoose');
const { Code } = require('../models');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please set MONGODB_URI in .env file");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const generateCodes = async (count = 1, type = '30days') => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const codeStr = 'PRO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({ code: codeStr, type });
  }
  
  try {
    await Code.insertMany(codes);
    console.log(`Successfully generated ${count} codes of type ${type}:`);
    codes.forEach(c => console.log(c.code));
  } catch (error) {
    console.error('Error generating codes:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Get args from command line
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 1;
const type = args[1] || '30days';

generateCodes(count, type);
