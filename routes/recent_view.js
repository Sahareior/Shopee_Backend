import express from 'express';
import { getRecentView, getRecentViewByUser, postRecentView } from '../controller/RecentViewController.js';

const recentView = express.Router()


recentView.post('/',postRecentView)
recentView.get('/',getRecentView)
recentView.get('/:userId', getRecentViewByUser)

// https://codeshare.io/5w0R99


export default recentView