import mongoose from 'mongoose';

const cantactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    date: {
        type: String,
        required: false
    },
    genre: {
        type: String,
        required: false
    },
    time: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false 
    },
    excerpt: {
        type: String,
        required: false 
    },
    imageUrl: {
        type: String,
        required: false 
    }
}, { timestamps: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', cantactSchema);

export default Contact;