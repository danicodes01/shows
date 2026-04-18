import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    text: {
        type: String,
        required: false
    },
    showId: {
        type: String,
        required: false
    }
}, { timestamps: true });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;