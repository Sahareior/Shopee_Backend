import ChatRoom from "../model/Chatroom.js";



export const createChat = async (req, res) => {
  const {  receiver } = req.body;
  const user = req.user.id;

  try {
    // Check if chat room already exists (in either direction)
    const existingChat = await ChatRoom.findOne({
      $or: [
        { user, receiver },
        { user: receiver, receiver: user }
      ]
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        message: 'Chat room already exists',
        chatRoom: existingChat
      });
    }

    const chatRoom = await new ChatRoom({ user, receiver }).save();
    
    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      chatRoom,
    });
  } catch (err) {
    console.error('Error creating chat room:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Chat room already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Could not create chat room',
      error: err.message
    });
  }
};

const sendMessage = async (req,res) => {
    const {chatRoom, message} = req.body

    const findChatroom = await ChatRoom.find({chatRoom})
    console.log(findChatroom,'this is chatroom')
}


