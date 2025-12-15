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



export const Post = mongoose.model('Post', postSchema);