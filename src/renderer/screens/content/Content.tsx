import React from 'react';
import Heading from 'renderer/components/Heading';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Footer from 'renderer/components/Footer';
import { Card } from 'react-bootstrap';
import importImages from './Images';
import LoadingModal from 'renderer/components/Loading';

// sent data
interface sentData {
  event: string;
  link: string;
}

interface ImageProps {
  [key: string]: string;
}

interface sentData {
  grade: any;
  subject: string;
  Interactive: InteractiveHeading[];
}

interface ScreenData {
  grade?: number;
  subject?: string;
  type?: string;
  Interactive?: {
    Heading?: string;
    interactive_items?: {
      name?: string;
      link?: string;
    }[];
  }[];
  Games?: {
    name?: string;
    image?: any;
    link?: string;
    alt?: string;
  }[];
  Quiz?: {
    Heading?: string;
    quiz_items?: {
      name?: string;
      link?: string;
    }[];
  }[];
}

interface Analytics {
  timestamp?: string;
  details?: string;
}

function Content() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const ID = queryParams.get('id');
  const grade = queryParams.get('grade');
  const subject = queryParams.get('subject');
  const { subID, contentID } = useParams();

  const imagesvariable = importImages();
  console.log(imagesvariable);
  // console.log(ID, grade, subject, subID, contentID);

  // console.log(contentID, ID);
  // //   const { contentID } = useParams();

  const [screenData, setScreenData] = useState<ScreenData[]>([]);
  const [imagesfile, setImagesfile] = useState<ImageProps>({});

  const [modalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages = await importImages();
      setImagesfile(loadedImages);
    };
    loadImages();

    const sentData = {
      event: 'ReadJson',
      link: `${subID}${ID}`,
    };
    window.electron.ipcRenderer.on('Close-Modal', handleCloseModal);
    window.electron.ipcRenderer.on('Game-State', async (arg: any) => {
      // eslint-disable-next-line no-console
      const data = await arg;
      setModalOpen(data);
    });
    // eslint-disable-next-line no-console
    window.electron.ipcRenderer.sendMessage('Screen-data', sentData);

    window.electron.ipcRenderer.once('Screen-data', async (arg: any) => {
      // eslint-disable-next-line no-console
      const data = await arg;
      setScreenData(data);
      // setTestlocation(data);
    });
  }, []);

  const handleClick = (link: any, topic: any) => {
    const sentData = {
      event: 'H5pOpen',
      link: link,
      name: topic,
    };
    window.electron.ipcRenderer.sendMessage('Screen-data', sentData);
  };
  const handleGameClick = (link: any, topic: any) => {
    const sentData = {
      event: 'GamesOpen',
      link: link,
      name: topic,
    };
    window.electron.ipcRenderer.sendMessage('Screen-data', sentData);
  };
  // const handleQuizClick = (link: any) => {
  //   const sentData = {
  //     event: 'QuizOpen',
  //     link: link,
  //   };
  //   window.electron.ipcRenderer.sendMessage('Screen-data', sentData);
  // };

  const loadUI = (item: any) => {
    if (item.type == 'Interactive Content') {
      return (
        <div
          key={`${item.grade}-${item.subject}`}
          style={{ display: 'block', columnCount: '4' }}
        >
          {item.Interactive.map((heading: any) => (
            <div key={`${item.grade}-${item.subject}-${heading.Heading}`}>
              <div
                style={{
                  minWidth: '100%',
                  breakInside: 'avoid',
                  marginBottom: '25px',
                  padding: '10px',
                }}
              >
                <h4 className="fw-bold">{heading.Heading}</h4>
                <ul
                  className="mb-0 px-0"
                  style={{ listStyleType: 'upper-roman' }}
                >
                  {heading['interactive_items'].map((interactive: any) => (
                    <li
                      key={`${interactive.name}`}
                      className="my-3 ic-list"
                      onClick={() =>
                        handleClick(interactive.link, interactive.name)
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <a className="m-0 ">↪ {interactive.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (item.type == 'Games') {
      return (
        <div
          key={`${item.grade}-${item.subject}`}
          className="d-flex flex-wrap gap-5"
        >
          {item.Games.map((games: any) => (
            <div
              style={{ cursor: 'Pointer', flexBasis: 'calc(25% - 40px)' }}
              onClick={() => handleGameClick(games.link, games.name)}
              key={games.link}
            >
              {games && (
                <Card className="game-card">
                  <Card.Img
                    className="card-image"
                    variant="top"
                    src={imagesfile[`${games.image}`]}
                    alt={games.alt}
                  />

                  {/* <Card.Body>
                    <Card.Title className="text-black-50 text-center fw-bold">
                      <h4 className="fw-bold">{games.name}</h4>

                    </Card.Title>
                  </Card.Body> */}
                </Card>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (item.type == 'Quiz') {
      return (
        <div
          key={`${item.grade}-${item.subject}`}
          style={{ display: 'block', columnCount: '4' }}
        >
          {item.Quiz.map((heading: any) => (
            <div key={`${item.grade}-${item.subject}-${heading.Heading}`}>
              <div
                style={{
                  minWidth: '100%',
                  breakInside: 'avoid',
                  marginBottom: '25px',
                  padding: '10px',
                }}
              >
                <h4 className="fw-bold">{heading.Heading}</h4>
                <ul
                  className="mb-0 px-0"
                  style={{ listStyleType: 'upper-roman' }}
                >
                  {heading['quiz_items'].map((quiz: any) => (
                    <li
                      key={`${quiz.name}`}
                      className="my-3 ic-list"
                      // onClick={() => handleQuizClick(quiz.link)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Link to={`/startquiz/${quiz.link}`}>
                        {/* <Link
                        to={`/subject/${subID}/${item.name}?id=${item.id}&grade=${grade}&subject=${subject}`}
                      > */}
                        <a className="m-0 ">↪ {quiz.name}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="container">
      <LoadingModal modalOpen={modalOpen} onHide={handleCloseModal} />
      <Heading />
      {/* {loadUI()} */}
      <div className="row">
        <div className="col text-center">
          <h1 className="fw-bold " style={{ fontSize: '75px' }}>
            {contentID}
          </h1>
        </div>
        <div className="row mt-3">
          <div className="col">
            <h4 className="fw-bold text-dark">Grade: {grade}</h4>
          </div>
          <div className="col text-end">
            <h4 className="fw-bold text-end text-dark">Subject: {subject}</h4>
          </div>
        </div>

        <hr
          className="my-5 mt-2"
          style={{ height: '4px', backgroundColor: 'white' }}
        />
      </div>
      <div>
        {screenData.length > 0 ? (
          <div>
            {screenData.map((item) => (
              <div>
                {loadUI(item)}
                {/* interactive content */}
              </div>
              // end interactive content
            ))}
          </div>
        ) : (
          <h2 className="text-center mt-4 py-5 fw-bold">
            No {contentID} Found
          </h2>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Content;
