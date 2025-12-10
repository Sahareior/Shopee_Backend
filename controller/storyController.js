
import mongoose from 'mongoose';
import Story from '../model/Story.js';

// Helper to convert file to base64
const fileToBase64 = async (fileUri) => {
  // For React Native, you might need a different approach
  // This assumes fileUri is a local file path
  try {
    // In React Native, you might use FileSystem.readAsStringAsync
    // For this example, I'll show the concept
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error.message}`);
  }
};

// Create story with direct media storage
export const createStory = async (req, res) => {
  try {
     const userId = req.user.id;
    
    const { 
      mediaData,
      mediaType,
      caption = '',
      textOverlays = [],
      transform = '{}',
      duration = 24,
      visibility = 'public',
      visibleTo = [],
      closeFriends = [],
      mimeType,
      fileName
    } = req.body;

    console.log(req.body)

    console.log('📱 Received story creation request:', {
      mediaType,
      caption: caption?.substring(0, 50) + '...',
      textOverlaysCount: textOverlays?.length || 0,
      mediaDataLength: mediaData?.length || 0,
      hasTransform: !!transform
    });

    // Validate required fields
    if (!mediaData || !mediaType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Media data and type are required' 
      });
    }

    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid media type. Must be "image" or "video"' 
      });
    }

    // Parse and validate transform data
    let parsedTransform = { scale: 1, translateX: 0, translateY: 0 };
    try {
      if (transform && transform !== '{}') {
        parsedTransform = JSON.parse(transform);
        
        // Validate and clamp values
        parsedTransform = {
          scale: Math.max(0.1, Math.min(5, parsedTransform.scale || 1)),
          translateX: parsedTransform.translateX || 0,
          translateY: parsedTransform.translateY || 0
        };
        
        console.log('📐 Parsed transform:', parsedTransform);
      }
    } catch (error) {
      console.error('Error parsing transform:', error);
    }

    // Parse and validate text overlays
    let parsedTextOverlays = [];
    try {
      if (textOverlays && textOverlays.length > 0) {
        parsedTextOverlays = Array.isArray(textOverlays) 
          ? textOverlays 
          : JSON.parse(textOverlays);
        
        parsedTextOverlays = parsedTextOverlays
          .map(overlay => {
            if (!overlay.text || !overlay.text.trim()) return null;
            
            return {
              id: overlay.id || `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: overlay.text.trim(),
              color: overlay.color || '#FFFFFF',
              fontSize: Math.min(Math.max(12, overlay.fontSize || 24), 72),
              fontFamily: overlay.fontFamily || 'System',
              position: overlay.position || { x: 100, y: 300 },
              style: {
                bold: overlay.bold || overlay.style?.bold || false,
                italic: overlay.italic || overlay.style?.italic || false,
                underline: overlay.underline || overlay.style?.underline || false
              },
              align: ['left', 'center', 'right'].includes(overlay.align) 
                ? overlay.align 
                : 'center'
            };
          })
          .filter(overlay => overlay !== null);
        
        console.log(`📝 Processed ${parsedTextOverlays.length} valid text overlays`);
      }
    } catch (error) {
      console.error('Error processing text overlays:', error);
      parsedTextOverlays = [];
    }

    // Calculate file size
    const fileSize = Math.ceil(mediaData.length * 3 / 4);

    // Validate file size
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Max size: ${mediaType === 'video' ? '50MB' : '10MB'}`
      });
    }

    // Calculate expiresAt here before creating the story
    const expiresAt = new Date(Date.now() + (duration * 60 * 60 * 1000));

    // Create story document
    const storyData = {
      user: userId,
      mediaData,
      mediaType,
      mimeType: mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      fileName: fileName || `story_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      fileSize,
      caption: caption.trim(),
      textOverlays: parsedTextOverlays,
      transform: parsedTransform, // Add transform data
      duration: Math.min(Math.max(1, duration), 168),
      expiresAt,
      visibility,
      visibleTo: visibility === 'private' ? visibleTo : [],
      closeFriends: visibility === 'close_friends' ? closeFriends : [],
      dimensions: {
        width: 1080,
        height: 1920,
        aspectRatio: '9:16'
      }
    };

    console.log('📝 Story data being saved:', {
      userId: storyData.user,
      mediaType: storyData.mediaType,
      transform: storyData.transform,
      expiresAt: storyData.expiresAt,
      duration: storyData.duration
    });

    const story = new Story(storyData);
    await story.save();

    console.log(`✅ Story saved to database. ID: ${story._id}, Size: ${Math.round(fileSize / 1024)}KB`);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      story: {
        id: story._id,
        user: story.user,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        textOverlays: story.textOverlays,
        transform: story.transform, // Include in response
        expiresAt: story.expiresAt,
        remainingHours: story.remainingHours,
        createdAt: story.createdAt,
        viewCount: story.viewCount
      }
    });

  } catch (error) {
    console.error('❌ Error creating story:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', messages);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry detected'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create story',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get story media (serves base64 as proper content-type)
export const getStoryMedia = async (req, res) => {
  try {
   
    const storyId = req.params.storyid; // For authentication
    console.log('Fetching media for story ID:', storyId);

    // Find story with media data
    const story = await Story.findById(storyId).select('mediaData mimeType user visibility visibleTo closeFriends expiresAt');
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if story is expired
    if (story.isExpired) {
      return res.status(410).json({ // 410 Gone
        success: false,
        message: 'Story has expired'
      });
    }

    // Check if user can view the story


    // Increment view count (but don't await to speed up response)


    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    let base64Data = story.mediaData;
    if (base64Data.startsWith('data:')) {
      const commaIndex = base64Data.indexOf(',');
      if (commaIndex !== -1) {
        base64Data = base64Data.substring(commaIndex + 1);
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Set appropriate headers
    res.set({
      'Content-Type': story.mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Expires': story.expiresAt.toUTCString()
    });

    // Send the buffer
    res.send(buffer);

  } catch (error) {
    console.error('Error serving story media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load story media'
    });
  }
};

// Get story metadata (without media data)
export const getStoriesFeed = async (req, res) => {
  try {
    // Get current user ID from auth middleware or use default 691f393838bceee55ce53ee5
     const currentUserId = req.user.id;
   
  
    console.log(`📱 Fetching stories for user: ${currentUserId}`);
    
    // 1. Get current user's active stories with full data
    const ownStories = await Story.find({
      user: currentUserId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .lean();
    
    // 2. Get random stories from other users
    const randomStories = await Story.aggregate([
      {
        $match: {
          isActive: true,
          expiresAt: { $gt: new Date() },
          user: { $ne: new mongoose.Types.ObjectId(currentUserId) }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$user",
          stories: { $push: "$$ROOT" },
          storyCount: { $sum: 1 },
          latestStory: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $sample: { size: 15 } // Get 15 random users with stories
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$userInfo._id",
            username: "$userInfo.username",
            name: "$userInfo.name",
            profilePicture: "$userInfo.profilePicture"
          },
          stories: {
            $map: {
              input: "$stories",
              as: "story",
              in: {
                id: "$$story._id",
                _id: "$$story._id",
                user: "$$story.user",
                mediaType: "$$story.mediaType",
                mimeType: "$$story.mimeType",
                fileName: "$$story.fileName",
                fileSize: "$$story.fileSize",
                textOverlays: "$$story.textOverlays",
                caption: "$$story.caption",
                hashtags: "$$story.hashtags",
                mentions: "$$story.mentions",
                duration: "$$story.duration",
                transform: "$$story.transform",
                dimensions: "$$story.dimensions",
                visibility: "$$story.visibility",
                visibleTo: "$$story.visibleTo",
                closeFriends: "$$story.closeFriends",
                storyType: "$$story.storyType",
                highlight: "$$story.highlight",
                mediaUrl: `/api/stories/$$story._id/media`,
                thumbnailUrl: `/api/stories/$$story._id/thumbnail`,
                expiresAt: "$$story.expiresAt",
                remainingHours: {
                  $divide: [
                    { $subtract: ["$$story.expiresAt", new Date()] },
                    1000 * 60 * 60
                  ]
                },
                viewCount: "$$story.viewCount",
                isActive: "$$story.isActive",
                loadCount: "$$story.loadCount",
                views: "$$story.views",
                reactions: "$$story.reactions",
                createdAt: "$$story.createdAt",
                updatedAt: "$$story.updatedAt",
                __v: "$$story.__v",
                isExpired: {
                  $cond: [
                    { $lt: ["$$story.expiresAt", new Date()] },
                    true,
                    false
                  ]
                }
              }
            }
          },
          storyCount: "$storyCount"
        }
      }
    ]);
    
    // Format own stories with all data
    const formattedOwnStories = ownStories.map(story => ({
      id: story._id,
      _id: story._id,
      user: story.user,
      mediaType: story.mediaType,
      mimeType: story.mimeType,
      fileName: story.fileName,
      fileSize: story.fileSize,
      textOverlays: story.textOverlays,
      caption: story.caption,
      hashtags: story.hashtags,
      mentions: story.mentions,
      duration: story.duration,
      transform: story.transform,
      dimensions: story.dimensions,
      mediaUrl: `/api/stories/${story._id}/media`,
      thumbnailUrl: `/api/stories/${story._id}/thumbnail`,
      expiresAt: story.expiresAt,
      remainingHours: Math.max(0, Math.ceil((new Date(story.expiresAt) - new Date()) / (1000 * 60 * 60))),
      viewCount: story.viewCount,
      isActive: story.isActive,
      loadCount: story.loadCount,
      views: story.views,
      reactions: story.reactions,
      visibility: story.visibility,
      visibleTo: story.visibleTo,
      closeFriends: story.closeFriends,
      storyType: story.storyType,
      highlight: story.highlight,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      __v: story.__v,
      isExpired: new Date(story.expiresAt) < new Date()
    }));
    
    // Create response with user info for current user
    const userInfo = await mongoose.model('User').findById(currentUserId)
      .select('username name profilePicture')
      .lean();
    
    // Prepare the final response array
    const storiesFeed = [];
    
    // Add current user first (even if no stories, for "Add story" button)
    storiesFeed.push({
      user: {
        _id: currentUserId,
        username: userInfo?.username || "You",
        name: userInfo?.name || "Your Story",
        profilePicture: userInfo?.profilePicture || null,
        isCurrentUser: true
      },
      stories: formattedOwnStories,
      storyCount: formattedOwnStories.length,
      canAddStory: true
    });
    
    // Add random users' stories
    randomStories.forEach(userStories => {
      // Sort stories by createdAt descending for each user
      const sortedStories = userStories.stories.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      storiesFeed.push({
        user: {
          ...userStories.user,
          isCurrentUser: false
        },
        stories: sortedStories,
        storyCount: userStories.storyCount
      });
    });
    
    console.log(`✅ Stories feed: 
      Own stories: ${formattedOwnStories.length}
      Random users: ${randomStories.length}
      Total in feed: ${storiesFeed.length}
    `);
    
    res.status(200).json({
      success: true,
      feed: storiesFeed,
      meta: {
        totalStories: storiesFeed.length,
        ownStoryCount: formattedOwnStories.length,
        randomUserCount: randomStories.length,
        hasStories: storiesFeed.length > 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching stories feed:', error);
    
    // Return empty but valid response on error
    const currentUserId = req.user.id || "69308363dc8f45c47f9c9a16";
    
    const userInfo = await mongoose.model('User').findById(currentUserId)
      .select('username name profilePicture')
      .lean();
    
    res.status(200).json({
      success: true,
      feed: [
        {
          user: {
            _id: currentUserId,
            username: userInfo?.username || "You",
            name: userInfo?.name || "Your Story",
            profilePicture: userInfo?.profilePicture || null,
            isCurrentUser: true
          },
          stories: [],
          storyCount: 0,
          canAddStory: true
        }
      ],
      meta: {
        totalStories: 1,
        ownStoryCount: 0,
        randomUserCount: 0,
        hasStories: false
      }
    });
  }
};
