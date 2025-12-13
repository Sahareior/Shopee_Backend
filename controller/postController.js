import User from "../model/User.js";
import { Post } from "../model/Post.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sizeOf from 'image-size'; // You'll need to install this: npm install image-size
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload a post with all new features
export const uploadAPost = async (req, res) => {
  try {
    const { 
      content, 
      media, 
      audience, 
      hashtags, 
      taggedUsers,
      feeling,
      location,
      isScheduled,
      scheduledFor
    } = req.body.postData || req.body;
    
    const author = req.user.id;

    console.log("Extracted content:", content);
    console.log("Media received:", media ? `Array with ${media.length} items` : 'No media');
    console.log("First media item:", media && media[0] ? {
      hasBase64: !!media[0].base64,
      base64Length: media[0].base64?.length,
      base64Prefix: media[0].base64?.substring(0, 50) + '...'
    } : 'No media items');

    // Validate required fields
    if (!content && (!media || !Array.isArray(media) || media.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Either content or media is required to create a post"
      });
    }

    // Process media - store base64 directly
    let processedMedia = [];
    if (media && Array.isArray(media)) {
      console.log("Processing", media.length, "media items");
      
      processedMedia = media.map((item, index) => {
        console.log(`Processing media item ${index}:`, {
          hasBase64: !!item.base64,
          base64Prefix: item.base64?.substring(0, 30),
          width: item.width,
          height: item.height
        });

        // Create media item object
        const mediaItem = {
          order: index,
          caption: item.caption || "",
          mediaType: item.mediaType || 'image',
          width: item.width || 800,
          height: item.height || 600
        };

        // Store base64 directly - THIS IS THE KEY LINE
        if (item.base64 && item.base64.startsWith('data:image')) {
          // Store the full base64 string
          mediaItem.base64 = item.base64;
          console.log(`Stored base64 for item ${index}, length: ${item.base64.length}`);
        } else if (item.base64) {
          // If base64 doesn't have data prefix, add it
          mediaItem.base64 = `data:image/jpeg;base64,${item.base64}`;
          console.log(`Added prefix to base64 for item ${index}, length: ${item.base64.length}`);
        } else {
          console.warn(`No base64 found for media item ${index}`);
        }
        
        return mediaItem;
      });
      
      console.log("Processed", processedMedia.length, "media items");
      console.log("First processed item has base64:", !!processedMedia[0]?.base64);
    }

    // Process hashtags if provided
    let processedHashtags = [];
    if (hashtags && Array.isArray(hashtags)) {
      processedHashtags = hashtags.map(tag => 
        tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
      );
    }

    // Build post data
    const postData = {
      author,
      content: content || "",
      media: processedMedia,
      audience: audience || 'public',
      hashtags: processedHashtags,
      taggedUsers: taggedUsers || [],
      feeling: feeling || undefined,
      mentions: taggedUsers || [],
      isScheduled: isScheduled || false
    };

    console.log("Post data to save:", {
      contentLength: postData.content.length,
      mediaCount: postData.media.length,
      firstMediaHasBase64: postData.media[0]?.base64 ? 'Yes' : 'No'
    });

    // Create post
    const newPost = await Post.create(postData);

    // Populate author details - but don't include base64 in response if it's too large
    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedUsers', 'name username profilePicture')
      .lean();

    // Optionally: Remove base64 from response if you want to save bandwidth
    // Only include a thumbnail or smaller version
    if (populatedPost.media && populatedPost.media.length > 0) {
      populatedPost.media = populatedPost.media.map(item => {
        const { base64, ...rest } = item;
        // Return only metadata or a smaller version
        return rest;
      });
    }

    // Add user interaction info
    populatedPost.userLiked = false;

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: populatedPost
    });

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get posts by a specific user
export const getPostbyUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Build query based on privacy
    const query = { 
      author: userId, 
      isDeleted: false,
      isScheduled: false,
      $or: [
        { scheduledFor: { $exists: false } },
        { scheduledFor: { $lte: new Date() } }
      ]
    };
    
    // If viewing someone else's posts, respect privacy
    if (userId !== req.user.id) {
      query.audience = 'public'; // Only show public posts
    }

    // Find posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedProducts.product', 'name price images')
      .populate('taggedUsers', 'name username profilePicture')
      .populate('sharedPost')
      .lean();

    // Add user interaction info
    const enhancedPosts = posts.map(post => ({
      ...post,
      userLiked: post.likes.some(likeId => likeId.toString() === req.user.id)
    }));

    const totalPosts = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      data: {
        posts: enhancedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get newsfeed (Facebook-like infinite scroll)
export const getNewsFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get user's following list
    const user = await User.findById(userId).select('following');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // People whose posts we should always see: following + self
    const followedAndSelfUsers = [...user.following, userId];

    // Build query for newsfeed - IMPORTANT FIX HERE
    // We want to see:
    // 1. Posts from people we follow (all their posts based on privacy)
    // 2. Our own posts (all privacy levels)
    // 3. Public posts from everyone else
    const query = {
      $and: [
        {
          isDeleted: false,
          isScheduled: false,
          $or: [
            { scheduledFor: { $exists: false } },
            { scheduledFor: { $lte: new Date() } }
          ]
        },
        {
          $or: [
            // Posts from people we follow (including ourselves)
            {
              author: { $in: followedAndSelfUsers },
              $or: [
                { audience: 'public' },
                { audience: 'followers' },
                { 
                  audience: 'private', 
                  author: userId // We can see our own private posts
                }
              ]
            },
            // Public posts from everyone else
            {
              author: { $nin: followedAndSelfUsers },
              audience: 'public'
            }
          ]
        }
      ]
    };

    // Get posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profilePicture isSeller sellerProfile followersCount followingCount')
      .populate('taggedProducts.product', 'name price images')
      .populate('taggedUsers', 'name username profilePicture')
      .populate('sharedPost')
      .lean();

    const totalPosts = await Post.countDocuments(query);

    // Add additional info like if user liked each post
    const enhancedPosts = posts.map(post => ({
      ...post,
      userLiked: post.likes.some(likeId => likeId.toString() === userId),
      userReaction: post.reactions ? 
        Object.entries(post.reactions).find(([_, users]) => 
          users.some(u => u.toString() === userId)
        )?.[0] : null
    }));

    res.status(200).json({
      success: true,
      message: "Newsfeed fetched successfully",
      data: {
        posts: enhancedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching newsfeed:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get trending posts using the new static method
export const getTrendingPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    // Use the new static method
    const posts = await Post.getTrendingPosts(limit, days);

    // Add user interaction info
    const enhancedPosts = posts.map(post => ({
      ...post,
      userLiked: post.likes.some(likeId => likeId.toString() === req.user?.id),
      userReaction: post.reactions ? 
        Object.entries(post.reactions).find(([_, users]) => 
          users.some(u => u.toString() === req.user?.id)
        )?.[0] : null
    }));

    res.status(200).json({
      success: true,
      message: "Trending posts fetched successfully",
      data: {
        posts: enhancedPosts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalPosts: enhancedPosts.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

  } catch (error) {
    console.error("Error fetching trending posts:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single post by ID
export const getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedProducts.product', 'name price images')
      .populate('taggedUsers', 'name username profilePicture')
      .populate('poll.options.voters', 'name username profilePicture')
      .populate('event.attendees', 'name username profilePicture')
      .populate('sharedPost')
      .populate({
        path: 'likes',
        select: 'name username profilePicture',
        perDocumentLimit: 10
      })
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user can view this post (privacy check)
    if (post.audience === 'private' && post.author._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "This post is private"
      });
    }

    // Check if scheduled post should be visible
    if (post.isScheduled && post.scheduledFor > new Date() && post.author._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "This post is scheduled for later"
      });
    }

    // Add user interaction info
    post.userLiked = post.likes.some(like => like._id.toString() === userId);
    post.userReaction = post.reactions ? 
      Object.entries(post.reactions).find(([_, users]) => 
        users.some(u => u.toString() === userId)
      )?.[0] : null;
    
    // Check if user voted in poll
    if (post.poll && post.poll.options) {
      post.poll.userVoted = post.poll.options.some(option => 
        option.voters && option.voters.some(voter => voter._id.toString() === userId)
      );
      post.poll.userVoteIndex = post.poll.options.findIndex(option => 
        option.voters && option.voters.some(voter => voter._id.toString() === userId)
      );
    }

    // Check if user registered for event
    if (post.event && post.event.attendees) {
      post.event.userRegistered = post.event.attendees.some(attendee => 
        attendee._id.toString() === userId
      );
    }

    // Increment view count (asynchronously)
    Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } }).exec();

    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: post
    });

  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// React to a post (add/change/remove reaction)
export const reactToPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { reactionType } = req.body; // 'like', 'love', 'haha', 'wow', 'sad', 'angry', or null to remove

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    let message = "";
    
    if (reactionType) {
      // Add or change reaction
      await post.addReaction(userId, reactionType);
      message = `Reacted with ${reactionType}`;
    } else {
      // Remove all reactions
      await post.removeReaction(userId);
      message = "Reaction removed";
    }

    // Get updated post
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name username profilePicture')
      .lean();

    // Add user interaction info
    updatedPost.userLiked = updatedPost.likes.some(like => like.toString() === userId);
    updatedPost.userReaction = updatedPost.reactions ? 
      Object.entries(updatedPost.reactions).find(([_, users]) => 
        users.some(u => u.toString() === userId)
      )?.[0] : null;

    res.status(200).json({
      success: true,
      message,
      data: {
        likes: updatedPost.likes,
        likeCount: updatedPost.likeCount,
        reactions: updatedPost.reactions,
        reactionCounts: updatedPost.reactionCounts,
        totalReactions: updatedPost.totalReactions,
        userLiked: updatedPost.userLiked,
        userReaction: updatedPost.userReaction
      }
    });

  } catch (error) {
    console.error("Error reacting to post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Vote in a poll
export const voteInPoll = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { optionIndex } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (!post.poll || !post.poll.isActive) {
      return res.status(400).json({
        success: false,
        message: "Poll is not active"
      });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid option index"
      });
    }

    await post.voteInPoll(userId, optionIndex);

    // Get updated post
    const updatedPost = await Post.findById(postId)
      .populate('poll.options.voters', 'name username profilePicture')
      .lean();

    // Check if user voted
    updatedPost.poll.userVoted = updatedPost.poll.options.some(option => 
      option.voters && option.voters.some(voter => voter._id.toString() === userId)
    );
    updatedPost.poll.userVoteIndex = updatedPost.poll.options.findIndex(option => 
      option.voters && option.voters.some(voter => voter._id.toString() === userId)
    );

    res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        poll: updatedPost.poll
      }
    });

  } catch (error) {
    console.error("Error voting in poll:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (!post.event || !post.event.isActive) {
      return res.status(400).json({
        success: false,
        message: "Event is not active"
      });
    }

    await post.registerForEvent(userId);

    // Get updated post
    const updatedPost = await Post.findById(postId)
      .populate('event.attendees', 'name username profilePicture')
      .lean();

    // Check if user registered
    updatedPost.event.userRegistered = updatedPost.event.attendees.some(attendee => 
      attendee._id.toString() === userId
    );

    res.status(200).json({
      success: true,
      message: "Registered for event successfully",
      data: {
        event: updatedPost.event
      }
    });

  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save/unsave a post (bookmark)
export const savePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const savedIndex = post.savedBy.indexOf(userId);
    let message = "";

    if (savedIndex === -1) {
      // Save the post
      post.savedBy.push(userId);
      message = "Post saved";
    } else {
      // Unsave the post
      post.savedBy.splice(savedIndex, 1);
      message = "Post unsaved";
    }

    await post.save();

    res.status(200).json({
      success: true,
      message,
      data: {
        savedBy: post.savedBy,
        savedCount: post.savedBy.length
      }
    });

  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get saved posts
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      savedBy: userId,
      isDeleted: false
    };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedProducts.product', 'name price images')
      .populate('taggedUsers', 'name username profilePicture')
      .lean();

    // Add user interaction info
    const enhancedPosts = posts.map(post => ({
      ...post,
      userLiked: post.likes.some(likeId => likeId.toString() === userId),
      userReaction: post.reactions ? 
        Object.entries(post.reactions).find(([_, users]) => 
          users.some(u => u.toString() === userId)
        )?.[0] : null,
      userSaved: true // Always true for saved posts
    }));

    const totalPosts = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Saved posts fetched successfully",
      data: {
        posts: enhancedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching saved posts:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Share a post (create shared post)
export const sharePost = async (req, res) => {
  try {
    const originalPostId = req.params.postId;
    const userId = req.user.id;
    const { content, audience } = req.body;

    // Get original post
    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: "Original post not found"
      });
    }

    // Check if user can view original post
    if (originalPost.audience === 'private' && originalPost.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Cannot share private post"
      });
    }

    // Create shared post
    const sharedPost = await Post.create({
      author: userId,
      sharedPost: originalPostId,
      sharedContent: content || "",
      audience: audience || 'public',
      isDeleted: false
    });

    // Increment share count on original post
    await Post.findByIdAndUpdate(originalPostId, { $inc: { shareCount: 1 } });

    // Populate shared post data
    const populatedPost = await Post.findById(sharedPost._id)
      .populate('author', 'name username profilePicture')
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'name username profilePicture'
        }
      })
      .lean();

    res.status(201).json({
      success: true,
      message: "Post shared successfully",
      data: populatedPost
    });

  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update a post (enhanced)
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const updateData = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own posts"
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'content', 'media', 'audience', 'hashtags', 'taggedProducts',
      'taggedUsers', 'feeling', 'location', 'poll', 'event', 
      'linkPreview', 'scheduledFor', 'isScheduled'
    ];

    // Filter update data
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });

    // Process hashtags if provided
    if (filteredUpdate.hashtags) {
      filteredUpdate.hashtags = filteredUpdate.hashtags.map(tag => 
        tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
      );
    }

    // Add to edit history if content changed
    if (filteredUpdate.content && filteredUpdate.content !== post.content) {
      if (!post.editHistory) post.editHistory = [];
      post.editHistory.push({
        content: post.content,
        editedAt: new Date(),
        editedBy: userId
      });
    }

    // Update post
    Object.assign(post, filteredUpdate);
    post.updatedAt = new Date();
    await post.save();

    // Get updated post with populated data
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedProducts.product', 'name price images')
      .populate('taggedUsers', 'name username profilePicture')
      .populate('sharedPost')
      .lean();

    // Add user interaction info
    updatedPost.userLiked = updatedPost.likes.some(like => like.toString() === userId);

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost
    });

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get posts by hashtag
export const getPostsByHashtag = async (req, res) => {
  try {
    const hashtag = req.params.hashtag.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      hashtags: hashtag,
      isDeleted: false,
      audience: 'public',
      isScheduled: false,
      $or: [
        { scheduledFor: { $exists: false } },
        { scheduledFor: { $lte: new Date() } }
      ]
    };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profilePicture isSeller sellerProfile')
      .populate('taggedProducts.product', 'name price images')
      .lean();

    const totalPosts = await Post.countDocuments(query);

    // Add user interaction info
    const enhancedPosts = posts.map(post => ({
      ...post,
      userLiked: post.likes.some(likeId => likeId.toString() === req.user?.id)
    }));

    res.status(200).json({
      success: true,
      message: `Posts with #${hashtag} fetched successfully`,
      data: {
        posts: enhancedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching posts by hashtag:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a post (soft delete) - already good, but keep it
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts"
      });
    }

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Pin/unpin a post
export const togglePinPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only pin your own posts"
      });
    }

    // Toggle pin status
    post.isPinned = !post.isPinned;
    await post.save();

    res.status(200).json({
      success: true,
      message: post.isPinned ? "Post pinned" : "Post unpinned",
      data: {
        isPinned: post.isPinned
      }
    });

  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};