import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import DestinationDetails from './pages/DestinationDetails';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import TripWorkspace from './pages/TripWorkspace';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import { getUser } from './utils/storage';
import api from './services/api';

export default function App() {
  const loc = useLocation();
  const [user, setUser] = useState(getUser);

  // Silently wake up / pre-warm the backend on initial visit
  useEffect(() => {
    api.get('/health').catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loc.pathname]);

  useEffect(() => {
    const handleUserChange = () => setUser(getUser());
    window.addEventListener('yg-user', handleUserChange);
    return () => window.removeEventListener('yg-user', handleUserChange);
  }, []);

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/destination/:id" element={<DestinationDetails />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/trip/:id" element={<TripWorkspace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
