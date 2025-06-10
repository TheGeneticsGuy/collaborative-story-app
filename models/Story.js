const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: { // This will be who first created the new story
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    snippets: [{ // Each entry will be stored in an array of snippets.
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Snippet'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);