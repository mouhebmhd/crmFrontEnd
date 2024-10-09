import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaArrowDown, FaShoppingBasket } from 'react-icons/fa';
import { CiSettings } from "react-icons/ci";
import flag from "../../images/flag.png";
import { Link } from 'react-router-dom';
import { IoIosNotifications } from "react-icons/io";

import io from 'socket.io-client';
import { FaCartArrowDown } from "react-icons/fa";

import axios from 'axios';
import { useNotificationContext } from '../../views/context/NotificationContext';
import './TopNav.css';
import { RiDeleteBinLine } from "react-icons/ri";
import { useAuth } from '../../views/context/authContext';

import { useNavigate } from 'react-router-dom'; // Correct import

function TopNav() {
    const currentUser = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const photo = localStorage.getItem('photo');

    const [isOpen, setIsOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const socketRef = useRef();
    const { state: { notifications, unreadCount }, dispatch } = useNotificationContext();


    const { logout } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate
/*
    useEffect(() => {
        socketRef.current = io('http://localhost:8000', {
            query: { userId }
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to server');
        });

        socketRef.current.on('receiveNotification', (notification) => {
            console.log('New notification received:', notification);
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [dispatch, userId]);*/

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:4000/api/getUnreadCount/${email}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data.unreadCount });
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();
    }, [email, token, dispatch]);
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:4000/api/getNotification', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data.notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };
    useEffect(() => {


        fetchNotifications();
    }, [token, dispatch]);



    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        setShowNotifications(false);
    };

    const handleNotificationClick = async () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications) {
            try {
                await axios.put('http://127.0.0.1:4000/api/updateSeenNotification', { email }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                dispatch({ type: 'MARK_AS_READ' });
            } catch (error) {
                console.error('Error updating notifications:', error);
            }
        }
    };
    const handleDelete = async (Id) => {
        try {
            await axios.delete(`http://127.0.0.1:4000/api/deleteNotification/${Id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Notif deleted successfully');
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting Notif:', error);
        }
    };


    const handleLogout = async () => {
        try {
            console.log("Logged out");
            await logout(); // Ensure the function is async
            navigate('/login'); // Redirect to login page
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <div className="row m-0 p-0 ">
            <div className="w-100  navbarIcons navbar m-0 p-1 d-flex  navbar p-2">
                <div className="icons  d-flex column-gap-2">
                    <Link to="/cart" className="basket">
                        <i className='basketIcon'><FaCartArrowDown />
                        </i> 
                    </Link>
                </div>

                <div className="icons d-flex column-gap-2">
                    <div className="icon1" onClick={handleNotificationClick}>
                        <div className="notification-icon">
                            <FaBell />
                            {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
                        </div>
                    </div>
                    <div className="icon1"><CiSettings /></div>
                    <div className="icon1"><img src={flag} alt="flag" className='flag' /></div>
                    <div className='d-flex'>
                        <div className="icon1" onClick={toggleDropdown}>
                            <img src={localStorage.getItem("photo")} alt="profile" className='profile' />                        </div>

                        <div className="dropdown">
                            {isOpen && (
                                <div className="dropdown-menu">
                                    <Link to={`/profile/${userId}`} className="dropdown-item">Profile</Link>
                                    <Link to={`/history/${userId}`} className="dropdown-item">history</Link>

                                    <div className="dropdown-item" onClick={handleLogout}>
                                        Logout
                                    </div>                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showNotifications && (
                <div className="notification-list notificationContainer">
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <div key={index} className="notification-item d-flex justify-content-between align-items-center ">
                                <div  className='notificationImageContainer' >
                                    <IoIosNotifications></IoIosNotifications>
                                </div>
                                <p>{notification.message}</p>
                                <div className='deleteNotification' >
                                    <button type="button" onClick={() => handleDelete(notification.id)} className='d-flex align-items-center deleteNotificationBtn'><RiDeleteBinLine className='mx-1'/> delete</button>
                                </div>

                            </div>
                        ))
                    ) : (
                        <p className="no-notifications">No notifications</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default TopNav;
