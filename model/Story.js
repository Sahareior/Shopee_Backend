const mongoose = require('mongoose');

const TextOverlaySchema = new mongoose.Schema({
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
    default: 24
  },
  fontFamily: {
    type: String,
    default: 'System'
  },
  align: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'center'
  },
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
  },
  position: {
    x: {
      type: Number,
      default: 0.1 // percentage of width (0-1)
    },
    y: {
      type: Number,
      default: 0.3 // percentage of height (0-1)
    }
  }
});

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    maxlength: 150,
    trim: true
  },
  textOverlays: [TextOverlaySchema],
  
  // Video specific fields
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Story metadata
  views: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactionCount: {
    type: Number,
    default: 0
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  
  // Expiry settings
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from creation
  },
  
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Analytics
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shareCount: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
StorySchema.index({ user: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StorySchema.index({ status: 1, isPublic: 1, createdAt: -1 });
StorySchema.index({ 'views.user': 1 });

// Virtual for checking if story is expired
StorySchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if user has viewed
StorySchema.virtual('hasUserViewed').get(function() {
  return (userId) => this.views.includes(userId);
});

// Virtual for user reaction
StorySchema.virtual('userReaction').get(function() {
  return (userId) => this.reactions.find(r => r.user.toString() === userId.toString());
});

// Middleware to update counts before save
StorySchema.pre('save', function(next) {
  this.viewCount = this.views.length;
  this.reactionCount = this.reactions.length;
  this.replyCount = this.replies.length;
  this.shareCount = this.shares.length;
  next();
});

// Method to add view
StorySchema.methods.addView = async function(userId) {
  if (!this.views.includes(userId)) {
    this.views.push(userId);
    await this.save();
  }
  return this;
};

// Method to add reaction
StorySchema.methods.addReaction = async function(userId, type) {
  const existingIndex = this.reactions.findIndex(r => r.user.toString() === userId.toString());
  
  if (existingIndex > -1) {
    // Update existing reaction
    this.reactions[existingIndex].type = type;
    this.reactions[existingIndex].createdAt = new Date();
  } else {
    // Add new reaction
    this.reactions.push({ user: userId, type });
  }
  
  await this.save();
  return this;
};

// Method to remove reaction
StorySchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  await this.save();
  return this;
};

// Method to add reply
StorySchema.methods.addReply = async function(userId, text) {
  this.replies.push({ user: userId, text });
  await this.save();
  return this;
};

// Method to delete reply
StorySchema.methods.deleteReply = async function(replyId) {
  this.replies = this.replies.filter(r => r._id.toString() !== replyId.toString());
  await this.save();
  return this;
};

// Method to add share
StorySchema.methods.addShare = async function(userId) {
  if (!this.shares.includes(userId)) {
    this.shares.push(userId);
    await this.save();
  }
  return this;
};

const Story = mongoose.model('Story', StorySchema);

export default Story;