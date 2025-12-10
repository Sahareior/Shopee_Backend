import express from "express"

import { createStory, getStoriesFeed, getStoryMedia } from "../controller/storyController.js";




const storyRoute= express.Router()

storyRoute.post('/', createStory);
storyRoute.get('/', getStoriesFeed)
storyRoute.get('/media/:storyid', getStoryMedia);


export default storyRoute