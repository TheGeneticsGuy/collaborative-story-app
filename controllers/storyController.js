const Story = require('../models/Story');
const Snippet = require('../models/Snippet');
const User = require('../models/User')

// I need to ensure the user is authenticated first and logged in.
exports.ensureAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/auth/login');
};

exports.getStoriesPage = async (req, res) => {
    try {
        const stories = await Story.find().populate('author', 'username').sort({ createdAt: -1 });
        res.render('stories', {
            pageTitle: 'Collaborative Stories',
            stories: stories,
            currentUser: req.session.userId,
            currentUsername: req.session.username
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');   // Just generic error message if this fails 500 for server error
    }
};

exports.postCreateStory = async (req, res) => {
    const { title } = req.body;
    if (!title) {
        // I could flash a message error here maybe... if I ever expand on this.
        return res.redirect('/stories');
    }
    try {
        const newStory = new Story({
            title,
            author: req.session.userId
        });
        await newStory.save();
        // Auto-redirect to the detail page on creating new story
        res.redirect(`/stories/${newStory._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new story');
    }
};

exports.getStoryDetailPage = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate('author', 'username')
            .populate({
                path: 'snippets',
                populate: { path: 'author', select: 'username' }
            });

        if (!story) {
            return res.status(404).send('Story not found');
        }
        res.render('storyDetail', {
            pageTitle: story.title,
            story: story,
            currentUser: req.session.userId,
            currentUsername: req.session.username
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Combines all the snippets to a full story
exports.getFullStoryPage = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate('author', 'username')
            .populate({
                path: 'snippets',
                populate: { path: 'author', select: 'username' }
            });

        if (!story) {
            return res.status(404).send('Story not found');
        }

        let formattedStoryContent = [];
        let currentParagraph = "";

        story.snippets.forEach((snippet, snippetIndex) => {
            const lines = snippet.content.split('\n');
            lines.forEach((line, lineIndex) => {
                let processedLine = line.trim();

                if (processedLine.startsWith('##')) {
                    // This line indicates a new paragraph should start
                    if (currentParagraph.trim() !== "") {
                        formattedStoryContent.push(currentParagraph.trim());
                    }
                    currentParagraph = "";

                    // Remove the '##' and whitespace indicating new P
                    processedLine = processedLine.substring(2).trim();
                }

                if (processedLine !== "") {
                    if (currentParagraph.trim() !== "" && processedLine !== "") {
                        currentParagraph += " "; // Add space if appending to existing content
                    }
                    currentParagraph += processedLine;
                }
            });

            if (snippetIndex < story.snippets.length - 1 && currentParagraph.trim() !== "") {
                 // Check if the current snippet's last line was just '##' or started with '##'
                const lastLineOfCurrentSnippet = lines[lines.length - 1].trim();
                const nextSnippetFirstLine = story.snippets[snippetIndex + 1].content.split('\n')[0].trim();

                if (!lastLineOfCurrentSnippet.startsWith('##') && !nextSnippetFirstLine.startsWith('##')) {
                    currentParagraph += " ";
                }
            }
        });

        // Add the last paragraph if it has content
        if (currentParagraph.trim() !== "") {
            formattedStoryContent.push(currentParagraph.trim());
        }

        res.render('fullStory', {
            pageTitle: `Full Story: ${story.title}`,
            story: story,
            formattedStoryContent: formattedStoryContent,
            currentUser: req.session.userId,
            currentUsername: req.session.username
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postAddSnippet = async (req, res) => {
    const { content } = req.body;
    const storyId = req.params.id;

    if (!content) {
        return res.redirect(`/stories/${storyId}`);
    }

    try {
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).send('Story not found');
        }

        const newSnippet = new Snippet({
            content,
            author: req.session.userId,
            story: storyId
        });
        await newSnippet.save();

        story.snippets.push(newSnippet._id);
        await story.save();

        // Populate author for the new snippet to send via Socket.IO
        const populatedSnippet = await Snippet.findById(newSnippet._id).populate('author', 'username');

        // Emit event to all clients in the story's room
        req.io.to(storyId).emit('new_snippet', populatedSnippet);


        res.redirect(`/stories/${storyId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error adding snippet');
    }
};