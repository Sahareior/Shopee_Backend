import mongoose from 'mongoose';

const Connection = async () => {

    const URL = `mongodb+srv://sahin:wjEcZF5vwY0hxedr@cluster0.s4ykc77.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    // const URL = `mongodb://localhost:27017/`;
    
    try {
        await mongoose.connect(URL);
        console.log('Database Connected Succesfully ');
    } catch(error) {
        console.log('Error: ', error.message);
    }

};

export default Connection;