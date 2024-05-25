const dotenv = require('dotenv');

process.env.NODE_ENV !== 'production' 
    ? dotenv.config({path: '.env.development'}) 
    : dotenv.config({path: '.env.production'});