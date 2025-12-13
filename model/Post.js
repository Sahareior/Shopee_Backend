import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Content Types
  contentType: {
    type: String,
    enum: ['text', 'image', 'video', 'imageGallery', 'sharedPost', 'poll', 'event', 'link'],
    default: 'text'
  },
  
  // Text Content
  content: {
    type: String,
    required: function() {
      return !this.media || this.media.length === 0;
    },
    trim: true,
    maxlength: 5000
  },
  
  // Media
// In your Post model schema
media: [{
  base64: String, // Store base64 string directly
  mediaType: {
    type: String,
    enum: ['image', 'video']
  },
  caption: String,
  width: Number,
  height: Number,
  order: Number
}],
  
  // For shared posts
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  sharedContent: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Engagement Metrics
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shareCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Facebook-style Reactions
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  reactionCounts: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    haha: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 }
  },
  
  totalReactions: {
    type: Number,
    default: 0
  },
  
  // Poll Feature
  poll: {
    question: String,
    options: [{
      text: String,
      votes: { type: Number, default: 0 },
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    totalVotes: { type: Number, default: 0 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true }
  },
  
  // Event Feature
  event: {
    title: String,
    description: String,
    date: Date,
    time: String,
    location: String,
    isVirtual: { type: Boolean, default: false },
    registrationLink: String,
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxAttendees: Number,
    isActive: { type: Boolean, default: false }
  },
  
  // Link Sharing
  linkPreview: {
    title: String,
    description: String,
    url: String,
    image: String,
    domain: String
  },
  
  // E-commerce Integration
  taggedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    positionX: Number,
    positionY: Number
  }],
  
  // Location
  location: {
    placeId: String,
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // Tagging People
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  
  // Privacy & Audience
  audience: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
    index: true
  },
  
  // Content Discovery
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true,
    index: true
  }],
  
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  
  // Post Features
  feeling: {
    type: String,
    enum: [
      'happy', 'loved', 'excited', 'thankful', 'blessed', 'cool',
      'sad', 'angry', 'tired', 'crazy', 'confused', 'shocked', 'curious'
    ]
  },
  
  activity: String, // "is watching", "is reading", etc.
  
  // Post Status
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // For scheduled posts
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: Date,
  
  // View count
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Save count (bookmarks)
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  savedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post URL
postSchema.virtual('url').get(function() {
  return `/post/${this._id}`;
});

// Virtual for calculating engagement score
postSchema.virtual('engagementScore').get(function() {
  const weights = {
    like: 1,
    love: 2,
    haha: 1,
    wow: 2,
    sad: 0.5,
    angry: 0.5,
    comment: 3,
    share: 5,
    save: 2
  };
  
  const reactionScore = Object.entries(this.reactionCounts || {}).reduce(
    (sum, [type, count]) => sum + (count * (weights[type] || 1)), 
    0
  );
  
  return reactionScore + 
         (this.commentCount * weights.comment) + 
         (this.shareCount * weights.share) + 
         (this.savedCount * weights.save);
});

// Indexes for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likeCount: -1, createdAt: -1 });
postSchema.index({ 'hashtags': 1, 'createdAt': -1 });
postSchema.index({ 'audience': 1, 'createdAt': -1 });
postSchema.index({ 'location.coordinates': '2dsphere' });
postSchema.index({ isPinned: 1, createdAt: -1 });
postSchema.index({ 'poll.isActive': 1, 'poll.expiresAt': 1 });
postSchema.index({ 'event.isActive': 1, 'event.date': 1 });
postSchema.index({ isScheduled: 1, scheduledFor: 1 });
postSchema.index({ totalReactions: -1, createdAt: -1 });
postSchema.index({ engagementScore: -1 });

// Middleware to update counts and set content type
postSchema.pre('save', function(next) {
  // Update like count
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  
  // Update saved count
  if (this.isModified('savedBy')) {
    this.savedCount = this.savedBy.length;
  }
  
  // Update reaction counts and total
  if (this.isModified('reactions')) {
    const counts = this.reactionCounts || {};
    this.totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  }
  
  // Update userLiked status (for virtual field)
  if (this.isModified('likes') || this.isModified('reactions.like')) {
    this.userLiked = this.likes && this.likes.length > 0;
  }
  
  // Set content type based on content
  if (this.isModified('media') || this.isModified('sharedPost') || this.isModified('poll') || this.isModified('event') || this.isModified('linkPreview')) {
    if (this.media && this.media.length > 0) {
      if (this.media.length === 1) {
        this.contentType = this.media[0].mediaType;
      } else {
        this.contentType = 'imageGallery';
      }
    } else if (this.sharedPost) {
      this.contentType = 'sharedPost';
    } else if (this.poll && this.poll.question) {
      this.contentType = 'poll';
    } else if (this.event && this.event.title) {
      this.contentType = 'event';
    } else if (this.linkPreview && this.linkPreview.url) {
      this.contentType = 'link';
    } else {
      this.contentType = 'text';
    }
  }
  
  // Set poll expiration if not set
  if (this.poll && this.poll.isActive && !this.poll.expiresAt) {
    this.poll.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  }
  
  // Check if poll has expired
  if (this.poll && this.poll.expiresAt && new Date() > this.poll.expiresAt) {
    this.poll.isActive = false;
  }
  
  // Check if event has passed
  if (this.event && this.event.date && new Date() > this.event.date) {
    this.event.isActive = false;
  }
  
  // Process hashtags from content
  if (this.isModified('content')) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.content.match(hashtagRegex);
    if (matches) {
      const extractedHashtags = matches.map(tag => tag.substring(1).toLowerCase());
      this.hashtags = [...new Set([...this.hashtags || [], ...extractedHashtags])];
    }
  }
  
  // Update poll total votes
  if (this.poll && this.poll.options) {
    this.poll.totalVotes = this.poll.options.reduce((sum, option) => sum + option.votes, 0);
  }
  
  next();
});

// Exclude deleted posts by default
postSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Method to add reaction
postSchema.methods.addReaction = function(userId, reactionType) {
  // Remove from other reactions first
  const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
  
  reactionTypes.forEach(type => {
    const index = this.reactions[type].indexOf(userId);
    if (index > -1) {
      this.reactions[type].splice(index, 1);
      this.reactionCounts[type] = Math.max(0, this.reactionCounts[type] - 1);
    }
  });
  
  // Add to new reaction
  if (!this.reactions[reactionType].includes(userId)) {
    this.reactions[reactionType].push(userId);
    this.reactionCounts[reactionType] += 1;
  }
  
  // Update like status
  const likeIndex = this.likes.indexOf(userId);
  if (reactionType === 'like') {
    if (likeIndex === -1) {
      this.likes.push(userId);
      this.likeCount += 1;
    }
  } else {
    if (likeIndex > -1) {
      this.likes.splice(likeIndex, 1);
      this.likeCount = Math.max(0, this.likeCount - 1);
    }
  }
  
  return this.save();
};

// Method to remove reaction
postSchema.methods.removeReaction = function(userId) {
  const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
  
  reactionTypes.forEach(type => {
    const index = this.reactions[type].indexOf(userId);
    if (index > -1) {
      this.reactions[type].splice(index, 1);
      this.reactionCounts[type] = Math.max(0, this.reactionCounts[type] - 1);
    }
  });
  
  // Remove from likes
  const likeIndex = this.likes.indexOf(userId);
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    this.likeCount = Math.max(0, this.likeCount - 1);
  }
  
  return this.save();
};

// Method to vote in poll
postSchema.methods.voteInPoll = function(userId, optionIndex) {
  if (!this.poll || !this.poll.isActive) {
    throw new Error('Poll is not active');
  }
  
  // Check if user already voted
  const alreadyVotedIndex = this.poll.options.findIndex(
    option => option.voters && option.voters.includes(userId)
  );
  
  if (alreadyVotedIndex > -1) {
    // Remove previous vote
    this.poll.options[alreadyVotedIndex].votes -= 1;
    const voterIndex = this.poll.options[alreadyVotedIndex].voters.indexOf(userId);
    if (voterIndex > -1) {
      this.poll.options[alreadyVotedIndex].voters.splice(voterIndex, 1);
    }
  }
  
  // Add new vote
  if (optionIndex >= 0 && optionIndex < this.poll.options.length) {
    this.poll.options[optionIndex].votes += 1;
    if (!this.poll.options[optionIndex].voters) {
      this.poll.options[optionIndex].voters = [];
    }
    this.poll.options[optionIndex].voters.push(userId);
  }
  
  return this.save();
};

// Method to register for event
postSchema.methods.registerForEvent = function(userId) {
  if (!this.event || !this.event.isActive) {
    throw new Error('Event is not active');
  }
  
  if (this.event.maxAttendees && this.event.attendees.length >= this.event.maxAttendees) {
    throw new Error('Event is full');
  }
  
  if (!this.event.attendees.includes(userId)) {
    this.event.attendees.push(userId);
  }
  
  return this.save();
};

// Static method to get trending posts
postSchema.statics.getTrendingPosts = async function(limit = 10, days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        isDeleted: false,
        audience: 'public',
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: ['$likeCount', 1] },
            { $multiply: ['$commentCount', 3] },
            { $multiply: ['$shareCount', 5] },
            { $multiply: ['$savedCount', 2] },
            { $multiply: ['$totalReactions', 2] },
            { $multiply: ['$viewCount', 0.1] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1, createdAt: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $project: {
        'author.password': 0,
        'author.__v': 0
      }
    }
  ]);
};

// Static method to get feed for user
postSchema.statics.getUserFeed = async function(userId, followingIds, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const feedUsers = [...followingIds, userId];
  
  return this.find({
    author: { $in: feedUsers },
    isDeleted: false,
    $or: [
      { audience: 'public' },
      { audience: 'followers' },
      { 
        audience: 'private',
        author: userId
      }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name username profilePicture isSeller sellerProfile')
    .populate('taggedProducts.product', 'name price images')
    .populate('taggedUsers', 'name username profilePicture')
    .lean();
};

export const Post = mongoose.model('Post', postSchema);