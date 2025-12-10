import mongoose from "mongoose";

const textOverlaySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#FFFFFF'
  },
  fontSize: {
    type: Number,
    default: 24,
    min: 12,
    max: 72
  },
  fontFamily: {
    type: String,
    default: 'System'
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  style: {
    bold: {
      type: Boolean,
      default: false
    },
    italic: {
      type: Boolean,
      default: false
    },
    underline: {
      type: Boolean,
      default: false
    }
  },
  align: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'center'
  }
}, { _id: false });

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

    transform: {
    scale: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 3
    },
    translateX: {
      type: Number,
      default: 0
    },
    translateY: {
      type: Number,
      default: 0
    }
  },
  
  // Store base64 data directly
  mediaData: {
    type: String, // Base64 encoded string
    required: true
  },
  
  mediaType: {
    type: String,
    required: true,
    enum: ["image", "video"],
    index: true
  },
  
  // Store mime type for proper content-type headers
  mimeType: {
    type: String,
    required: true,
    default: 'image/jpeg'
  },
  
  // Store original filename if available
  fileName: String,
  
  // File size in bytes
  fileSize: {
    type: Number,
    default: 0
  },
  
  // Text overlays array
  textOverlays: [textOverlaySchema],
  
  // Caption
  caption: {
    type: String,
    maxlength: 2200,
    default: "",
    trim: true
  },
  
  // Hashtags extracted from caption
  hashtags: [{
    type: String,
    lowercase: true,
    index: true
  }],
  
  // Mentions extracted from caption
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // Story duration (default 24 hours)
  duration: {
    type: Number,
    default: 24,
    min: 1,
    max: 168
  },
  
  // Auto-calculated expiration
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  
  // Visibility settings
  visibility: {
    type: String,
    enum: ["public", "private", "close_friends"],
    default: "public",
    index: true
  },
  
  // For private stories
  visibleTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // For close friends
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // Story type
  storyType: {
    type: String,
    enum: ["normal", "highlight", "archive"],
    default: "normal",
    index: true
  },
  
  // If part of a highlight
  highlight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Highlight",
    default: null
  },
  
  // For video stories
  videoDuration: {
    type: Number,
    min: 1,
    max: 60
  },
  
  // Media dimensions
  dimensions: {
    width: {
      type: Number,
      default: 1080
    },
    height: {
      type: Number,
      default: 1920
    },
    aspectRatio: {
      type: String,
      default: "9:16"
    }
  },
  
  // Views tracking
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  viewCount: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["like", "heart", "laugh", "wow", "sad", "angry", "reply"],
      default: "like"
    },
    message: {
      type: String,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Story status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Performance metrics
  loadCount: {
    type: Number,
    default: 0
  },
  
  // Archival info
  archivedAt: Date
  
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Don't send mediaData in normal queries to reduce payload size
      delete ret.mediaData;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for media URL (for API responses)
storySchema.virtual('mediaUrl').get(function() {
  return `/api/stories/${this._id}/media`;
});

// Virtual for thumbnail URL (same as media for simplicity)
storySchema.virtual('thumbnailUrl').get(function() {
  return `/api/stories/${this._id}/media`;
});

// Virtual for remaining hours
storySchema.virtual('remainingHours').get(function() {
  const now = new Date();
  const remainingMs = this.expiresAt - now;
  return Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
});

// Virtual for isExpired
storySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Pre-save middleware
storySchema.pre('save', function(next) {
  // Set expiresAt if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (this.duration * 60 * 60 * 1000));
  }
  
  // Extract hashtags from caption
  if (this.caption) {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = this.caption.match(hashtagRegex);
    this.hashtags = matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }
  
  // Set mime type based on mediaType if not provided
  if (!this.mimeType) {
    this.mimeType = this.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
  }
  
  next();
});

// Indexes
storySchema.index({ user: 1, isActive: 1, expiresAt: 1 });
storySchema.index({ isActive: 1, expiresAt: 1, visibility: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ expiresAt: 1 }); // For TTL cleanup

// Static methods
storySchema.statics.getActiveStoriesByUser = async function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).select('-mediaData') // Don't fetch media data
    .sort({ createdAt: -1 });
};

storySchema.statics.getFeedStories = async function(userId, followingIds) {
  const visibleToUser = [
    { visibility: "public" },
    { visibility: "private", visibleTo: userId },
    { visibility: "close_friends", closeFriends: userId }
  ];

  return this.find({
    user: { $in: followingIds },
    isActive: true,
    expiresAt: { $gt: new Date() },
    $or: visibleToUser
  }).select('-mediaData')
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePicture');
};

storySchema.statics.addView = async function(storyId, userId) {
  const story = await this.findById(storyId);
  
  if (!story) throw new Error('Story not found');
  if (story.isExpired) throw new Error('Story has expired');
  
  const alreadyViewed = story.views.some(view => 
    view.user.toString() === userId.toString()
  );
  
  if (!alreadyViewed) {
    story.views.push({ user: userId });
    story.viewCount += 1;
    await story.save();
  }
  
  return story;
};

// Instance methods
storySchema.methods.canUserView = function(userId) {
  if (this.user.toString() === userId.toString()) return true;
  if (this.isExpired) return false;
  
  switch (this.visibility) {
    case 'public':
      return true;
    case 'private':
      return this.visibleTo.some(id => id.toString() === userId.toString());
    case 'close_friends':
      return this.closeFriends.some(id => id.toString() === userId.toString());
    default:
      return false;
  }
};

storySchema.methods.addReaction = async function(userId, type, message) {
  this.reactions = this.reactions.filter(
    reaction => reaction.user.toString() !== userId.toString()
  );
  
  this.reactions.push({
    user: userId,
    type,
    message: type === 'reply' ? message : undefined
  });
  
  return this.save();
};

const Story = mongoose.model("Story", storySchema);

export default Story;