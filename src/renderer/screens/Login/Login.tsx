import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './login.css';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import logoimg from '../../../../assets/images/loginlogo.png';

interface Credentials {
  userType?: 'student' | 'guest';
  user?: string;
  pwd?: string;
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [login, setLogin] = useState(false);
  const [invalid, setInvalid] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [show, setShow] = useState(false);

  // const [showHiddenTag, setShowHiddenTag] = useState(false);

  // useEffect(() => {
  //   // Check if the username is stored in local storage
  //   const storedUsername = localStorage.getItem('username');
  //   if (storedUsername) {
  //     setShowHiddenTag(true);
  //   }
  // }, []);

  // useEffect(() => {
  //   window.electron.ipcRenderer.once('authentication', (_event, arg) => {
  //     console.log(arg);
  //     if (arg) {
  //       setLogin(arg);
  //     } else {
  //       console.log(arg);
  //     }
  //   });
  // }, [login]);

  const handleSubmit = (e, type) => {
    e.preventDefault();
    const creds: Credentials = {
      userType: type,
      user: username,
      pwd: password,
    };
    // window.electron.ipcRenderer.sendMessage('cookieData', { username });
    window.electron.ipcRenderer.sendMessage('login', creds);
    window.electron.ipcRenderer.once('authentication', async (arg: any) => {
      console.log(arg);
      if (arg) {
        setLogin(arg);
      } else {
        setInvalid('Incorrect username or password');
        setTimeout(() => {
          setInvalid('');
        }, 10000);
      }
    });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setShow(true);
  };

  return (
    <div className="loginContainer">
      <div className="main">
        <div className="logo">
          <img src={logoimg} alt="img" className="logoimg" />
        </div>
        <form
          className="loginSection"
          onSubmit={(e) => handleSubmit(e, 'student')}
        >
          <h3 className="loginHeader">LOGIN</h3>
          <div className="divInp">
            <FiUser className="icon" size={20} style={{ color: 'black' }} />
            <input
              className="inputField"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="divInp">
            <FiLock className="icon" size={20} style={{ color: 'black' }} />
            <input
              className="inputField"
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required
            />
            {/* Show eye icons for password visibility inside the placeholder */}
            <span className="passwordIcon" onClick={togglePasswordVisibility}>
              {show && (
                <>
                  {passwordVisible ? (
                    <FiEyeOff size={20} style={{ color: 'black' }} />
                  ) : (
                    <FiEye size={20} style={{ color: 'black' }} />
                  )}
                </>
              )}
            </span>
          </div>
          {invalid && <div className="invalid">{invalid}</div>}
          <button type="submit" className="loginBtn">
            LOGIN
          </button>
        </form>
        {/* <Link to="/main">
          <button
            type="button"
            className="guestBtn"
            onClick={(e) => handleSubmit(e, 'guest')}
          >
            Continue as Guest
          </button>
        </Link> */}
        <button
          type="button"
          className="guestBtn"
          onClick={(e) => handleSubmit(e, 'guest')}
        >
          Continue as Guest
        </button>
      </div>
      <div>{login ? <Navigate to="/main" replace={true} /> : null}</div>
    </div>
  );
}

export default Login;
