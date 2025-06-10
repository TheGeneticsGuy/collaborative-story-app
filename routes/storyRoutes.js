const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');

router.use(storyController.ensureAuthenticated);

// GET /stories - Display all stories
router.get('/stories', storyController.getStoriesPage);

// POST /stories - Create a new story
router.post('/stories', storyController.postCreateStory);

// GET /stories/:id - Display a specific story and its snippets
router.get('/stories/:id', storyController.getStoryDetailPage);

// GET /stories/:id/full - This will display the full story
router.get('/stories/:id/full', storyController.getFullStoryPage);

// POST /stories/:id/snippets - Add a new snippet to a story
router.post('/stories/:id/snippets', storyController.postAddSnippet);

// PUT /stories/:storyId/snippets/:snippetId - Update a specific snippet
router.put('/stories/:storyId/snippets/:snippetId', storyController.updateSnippet);

// DELETE /stories/:storyId/snippets/:snippetId - Delete a specific snippet
router.delete('/stories/:storyId/snippets/:snippetId', storyController.deleteSnippet);

module.exports = router;