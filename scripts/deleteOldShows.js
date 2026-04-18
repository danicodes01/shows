const mongoose = require('mongoose');
const moment = require('moment');
require('dotenv').config();

// Define your Show schema
const showSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    genre: { type: String, required: false },
    location: { type: String, required: false },
    time: { type: String, required: true },
    price: { type: String, required: false },
    isFeatured: { type: Boolean, default: false },
    image: { type: String, required: false },
    excerpt: { type: String, required: false },
    rating: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

showSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Show = mongoose.model('Show', showSchema);

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = { bufferCommands: false };
        const uri = `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_clustername}.${process.env.mongodb_database}/gagz?retryWrites=true&w=majority`;
        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

(async () => {
    await connectDb();

    try {
        const yesterday = moment().subtract(1, 'days').startOf('day').toDate();

        const result = await Show.deleteMany({
            date: { $lt: yesterday }
        });

        console.log(`${result.deletedCount} shows deleted successfully.`);
    } catch (error) {
        console.error('Failed to delete old shows:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
})();
