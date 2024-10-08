import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../../style/viewsStyle/Chatbot.css";
import io from "socket.io-client";
import EmojiPicker from 'emoji-picker-react';
const socket = io.connect("http://localhost:8000");

const Chatbot = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);



    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    const config = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }), [token]);
    /*
    useEffect(() => {
        socket.on('receive', (message) => {
            console.log('Message received:', message);
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('receive');  // Properly remove the event listener
            socket.disconnect();    // Disconnect the socket
        };
    }, [socket]);
*/
   /* const fetchChatHistory = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/chat-history', config);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };
*/
const fetchChatHistory = async () => {
    try {
        const response = await axios.get('http://localhost:4000/api/chat-history', {
            ...config,  
            params: {
                sender_id: userId,
                rolesender: role
            }
        });
        setMessages(response.data);
        const chatElement = document.getElementsByClassName("chatbot-messages")[0];
        if (chatElement) {
          chatElement.scrollTop = chatElement.scrollHeight;
        } else {
          console.warn('Chat element not found');
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }
};


    useEffect(() => {

        fetchChatHistory();

        // Setup the socket event listener
        socket.on('receive', (message) => {
            console.log('Message received:', message);
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('receive');
            socket.disconnect();
        };
    }, [socket]);



    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        const messageData = {
            sender_id: userId,
            rolesender: role,
            message: newMessage,
            receiver_id: -1,  // Set to bot
            rolereciever: 'bot',
            is_sender_bot: false,
            is_receiver_bot: true
        };
        socket.emit('send', messageData);

        setMessages((prevMessages) => [
            ...prevMessages,
            messageData
        ]);

        setNewMessage('');
    };

    const handleEmojiPickerToggle = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div className={`chatbot ${open ? "open" : ""}`}>
            {!open && (
                <div className="chatbot-icon" onClick={() => setOpen(true)}>
                    🤖
                </div>
            )}

            {open && (
                <div className="chatbot-window">
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender_id == userId ? "user" : "bot"}`}>
                                {msg.message}
                            </div>
                        ))}
                    </div>

                    <div className="chatbot-input">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message here"
                        />
                        <button type="button" onClick={handleEmojiPickerToggle}>😀</button>
                        {showEmojiPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
                        <button onClick={handleSendMessage}>Send</button>
                    </div>

                    <button onClick={() => setOpen(false)} className="chatbot-close-button">
                        ✖
                    </button>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
