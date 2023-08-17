import { Link } from 'react-router-dom';
import { AiOutlineLogout } from 'react-icons/ai';
import './Css/Logout.css';

interface SentData {
  details?: string;
}

const Logout = () => {
  const handleLogout = () => {
    const sentData: SentData = { details: 'Logged out from the system' };
    window.electron.ipcRenderer.sendMessage('logout', sentData);
  };
  return (
    <div className="logout">
      <Link to="/">
        <button type="button" className="logoutBtn" onClick={handleLogout}>
          <AiOutlineLogout />
          <span className="logoutTxt">Logout</span>
        </button>
      </Link>
    </div>
  );
};

export default Logout;
