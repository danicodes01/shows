import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    genre: {
        type: String,
        required: false 
    },
    location: {
        type: String,
        required: false 
    },
    time: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: false 
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        required: false
    },
    excerpt: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: false
    }
}, { timestamps: true });

function isDST(date) {
    const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    return Math.min(jan, jul) != date.getTimezoneOffset();
}

showSchema.pre('save', function(next) {
    const show = this;

    if (show.date) {
        const dateUTC = new Date(show.date);

        dateUTC.setDate(dateUTC.getDate() + 1);

        const offset = isDST(dateUTC) ? 7 : 8; 
        dateUTC.setUTCHours(offset, 0, 0, 0); 

        show.expiresAt = dateUTC;
    }

    next();
});

showSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Show = mongoose.models.Show || mongoose.model('Show', showSchema);

export default Show;

