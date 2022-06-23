const monk = require('monk');
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ashteki';
console.log('attached to: ' + mongoUrl);
let db = monk(mongoUrl);
console.log('selecting game: ' + process.argv[2]);
const collection = db.get('games');
collection
    .find({ 'players.name': process.argv[2] })
    .then((result) => {
        console.log(result);
    })
    .then(() => db.close());