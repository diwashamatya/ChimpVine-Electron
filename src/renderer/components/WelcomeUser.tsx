import React, { useState, useEffect } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import './Css/WelcomeUser.css';

function WelcomeUser() {
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const sentData = {
      event: 'getCurrentUser',
    };
    // console.log('Sending message:', sentData);
    // eslint-disable-next-line no-console
    window.electron.ipcRenderer.sendMessage('getCurrentUser', sentData);

    window.electron.ipcRenderer.once('getCurrentUser', async (arg: any) => {
      // eslint-disable-next-line no-console
      // console.log("Received 'getCurrentUser' response:", arg);
      const data = await arg;
      // console.log(data);

      // Convert the data to uppercase before setting the state
      const uppercaseData = data.toUpperCase();
      setCurrentUser(uppercaseData);
    });
  }, []);

  // const capitalizeFirstLetter = (str) => {
  //   return str.charAt(0).toUpperCase() + str.slice(1);
  // };

  // let capitalizedUserName; // Declare the variable outside the if-else block

  // if (userNameToWelcome !== '') {
  //   capitalizedUserName = capitalizeFirstLetter(userNameToWelcome);
  // } else {
  //   capitalizedUserName = capitalizeFirstLetter('Guest');
  // }

  return (
    <div className="user">
      <p className="img">
        <BsFillPersonFill />
      </p>
      <h1>{currentUser}</h1>
    </div>
  );
}

export default WelcomeUser;
