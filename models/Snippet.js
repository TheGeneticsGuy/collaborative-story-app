const mongoose = require('mongoose');

const SnippetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    story: { // This will link back to the story this snippet belongs to.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Snippet', SnippetSchema);