
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import AddSpot from './pages/AddSpot';
import EditShop from './pages/EditShop';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import ClaimShop from './pages/ClaimShop';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Curator from './pages/admin/Curator';
import ShopDrafts from './pages/admin/ShopDrafts';
import AdminEvents from './pages/admin/AdminEvents';
import EventsFeed from './pages/EventsFeed';
import DripClub from './pages/DripClub';
import ScoutBounty from './pages/ScoutBounty';

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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/claim/:id" element={<ClaimShop />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="curator" element={<Curator />} />
            <Route path="drafts" element={<ShopDrafts />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>

          <Route path="/events" element={<EventsFeed />} />
          <Route path="/dripclub" element={<DripClub />} />
          <Route path="/scout-bounty" element={<ScoutBounty />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
