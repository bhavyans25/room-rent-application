import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = 'http://localhost:3000/api/rooms';

function App() {
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Form states
  const [newRoom, setNewRoom] = useState({ name: '', type: 'Single', price: '' });
  const [bookingData, setBookingData] = useState({ customer_name: '', booked_until: '' });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data && response.data.data) {
        setRooms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL, newRoom);
      if (response.data && response.data.data) {
        setRooms([...rooms, response.data.data]);
        setShowAddModal(false);
        setNewRoom({ name: '', type: 'Single', price: '' });
      }
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleBookRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/${selectedRoom.id}/book`, bookingData);
      if (response.data && response.data.data) {
        setRooms(rooms.map(room => 
          room.id === selectedRoom.id ? { ...room, ...response.data.data } : room
        ));
        setShowBookModal(false);
        setSelectedRoom(null);
        setBookingData({ customer_name: '', booked_until: '' });
      }
    } catch (error) {
      console.error('Error booking room:', error);
    }
  };

  const handleCheckout = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/checkout`);
      if (response.data && response.data.data) {
        setRooms(rooms.map(room => 
          room.id === id ? { ...room, ...response.data.data, customer_name: null, booked_until: null } : room
        ));
      }
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const calculateDaysLeft = (bookedUntil) => {
    if (!bookedUntil) return 0;
    const end = new Date(bookedUntil);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const bookedRooms = totalRooms - availableRooms;

  return (
    <div className="container">
      <header>
        <h1>Luxe stays</h1>
        <p className="subtitle">Premium Room Management System</p>
      </header>

      <section className="dashboard-stats">
        <div className="glass-panel stat-card">
          <div className="stat-value">{totalRooms}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value" style={{color: 'var(--success)'}}>{availableRooms}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value" style={{color: 'var(--danger)'}}>{bookedRooms}</div>
          <div className="stat-label">Booked</div>
        </div>
      </section>

      <div className="actions-bar">
        <h2>Room Overview</h2>
        <button className="btn" onClick={() => setShowAddModal(true)}>
          + Add New Room
        </button>
      </div>

      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room.id} className="glass-panel room-card">
            <div className="room-header">
              <h3 className="room-title">{room.name}</h3>
              <span className="room-type">{room.type}</span>
            </div>
            
            <div className="room-details">
              <p>
                <span className="text-muted">Price:</span> 
                <strong>${room.price}/night</strong>
              </p>
              <p>
                <span className="text-muted">Status:</span> 
                <span className={`status-badge status-${room.status}`}>
                  {room.status}
                </span>
              </p>
              {room.status === 'booked' && (
                <p>
                  <span className="text-muted">Guest:</span> 
                  <strong>{room.customer_name}</strong>
                </p>
              )}
            </div>

            {room.status === 'booked' && (
              <div className="days-left">
                <div className="days-number">{calculateDaysLeft(room.booked_until)}</div>
                <div className="text-muted" style={{fontSize: '0.85rem'}}>Days Left to Free</div>
              </div>
            )}

            <div className="room-actions">
              {room.status === 'available' ? (
                <button 
                  className="btn" 
                  style={{width: '100%'}}
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowBookModal(true);
                  }}
                >
                  Book Now
                </button>
              ) : (
                <button 
                  className="btn btn-danger" 
                  style={{width: '100%'}}
                  onClick={() => handleCheckout(room.id)}
                >
                  Checkout
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2>Add New Room</h2>
            <form onSubmit={handleAddRoom} style={{marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>Room Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Room Type</label>
                <select 
                  className="form-control"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
              <div className="form-group">
                <label>Price per Night ($)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newRoom.price}
                  onChange={(e) => setNewRoom({...newRoom, price: e.target.value})}
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn">Add Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Room Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2>Book {selectedRoom?.name}</h2>
            <form onSubmit={handleBookRoom} style={{marginTop: '1.5rem'}}>
              <div className="form-group">
                <label>Guest Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bookingData.customer_name}
                  onChange={(e) => setBookingData({...bookingData, customer_name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Booked Until (Checkout Date)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={bookingData.booked_until}
                  onChange={(e) => setBookingData({...bookingData, booked_until: e.target.value})}
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
