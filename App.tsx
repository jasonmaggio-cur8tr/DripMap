
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import AddSpot from './pages/AddSpot';
import EditShop from './pages/EditShop';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import ClaimShop from './pages/ClaimShop';
import AdminDashboard from './pages/AdminDashboard';
import EventsFeed from './pages/EventsFeed';
import AdminEvents from './pages/AdminEvents';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:id" element={<ShopDetail />} />
          <Route path="/add" element={<AddSpot />} />
          <Route path="/edit-shop/:id" element={<EditShop />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/claim/:id" element={<ClaimShop />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/events" element={<EventsFeed />} />
          <Route path="/admin/events" element={<AdminEvents />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
