import React, { useState, useEffect } from 'react';
import './CSS/Search.css';
import Button from 'react-bootstrap/Button';
import { Modal } from 'react-bootstrap';
import { AiOutlineCloseCircle } from 'react-icons/ai';

import { BsSearch } from 'react-icons/bs';

import {
  AiOutlineBook,
  AiOutlineCalculator,
  AiOutlineExperiment,
  AiOutlineLaptop,
} from 'react-icons/ai';
// import { BiSearchAlt } from 'react-icons/bi';

export default function Search() {
  const [searchValue, setSearchValue] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  // const [show, setShow] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchButton, setSearchButton] = useState(false); // New state variable for original data
  const [show, setShow] = useState(false);
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);

      setSearchValue('');
      setGradeFilter('');
      setSubjectFilter('');
      setShowClearBtn(false);
    }, 5000); // Simulate loading for 3 seconds
  }, [isLoading]);

  const handleClose = () => {
    setSearchValue('');
    setGradeFilter('');
    setSubjectFilter('');
    setFilteredData([]);
    setSearchButton(false);
    setShow(false);
    setShowClearBtn(false);
    setIsLoading(false);
  };

  const handleClearClick = () => {
    setSearchValue('');
    setGradeFilter('');
    setSubjectFilter('');
    setFilteredData([]);
    setSearchButton(false);
    setShowClearBtn(false);
  };
  const handleGameClick = (link: any, topic: any) => {
    setIsLoading(true);

    const sentData = {
      event: 'GamesOpen',
      link: link,
      name: topic,
    };
    window.electron.ipcRenderer.sendMessage('Screen-data', sentData);
  };
  const handleShow = () => setShow(true);
  const handleClick = (link: any, topic: any) => {
    const sentData = {
      event: 'H5pOpen',
      link: link,
      name: topic,
    };
    window.electron.ipcRenderer.sendMessage('Screen-data', sentData);
  };

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('searchValue', 'searchValue');
    window.electron.ipcRenderer.once('jsonData', async (arg: any) => {
      setData(arg);
    });
  }, []);

  const handleChange = (e) => {
    const newSearchValue = e.target.value;
    setSearchValue(newSearchValue);
    setSearchButton(false);

    if (newSearchValue.length > 0) {
      setShowClearBtn(true);
    } else {
      setShowClearBtn(false);
    }
  };

  const handleGradeChange = (e) => {
    setGradeFilter(e.target.value);
    setSearchButton(false);
  };

  const handleSubjectChange = (e) => {
    setSubjectFilter(e.target.value);
    // setSearchButton(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchButton(true);

    if (searchValue !== '') {
      // Check if data is not empty before filtering
      if (data.length > 0) {
        const filteredItems = data.filter((item) => {
          const interactiveMatches =
            item.type === 'Interactive Content' &&
            item.Interactive?.some((interactiveItem) => {
              const name = interactiveItem.interactive_items?.some((subItem) =>
                subItem.name?.toLowerCase().includes(searchValue.toLowerCase())
              );
              const grade = item.grade?.toString().toLowerCase();
              const subject = item.subject?.toLowerCase();

              return (
                name &&
                (gradeFilter === '' ||
                  grade?.includes(gradeFilter.toLowerCase())) &&
                (subjectFilter === '' ||
                  subject?.includes(subjectFilter.toLowerCase()))
              );
            });

          const gameMatches =
            item.type === 'Games' &&
            item.Games?.some((gameItem) => {
              const name = gameItem.name?.toLowerCase();
              const grade = item.grade?.toString().toLowerCase();
              const subject = item.subject?.toLowerCase();

              return (
                (searchValue === '' ||
                  name?.includes(searchValue.toLowerCase())) &&
                (gradeFilter === '' ||
                  grade?.includes(gradeFilter.toLowerCase())) &&
                (subjectFilter === '' ||
                  subject?.includes(subjectFilter.toLowerCase()))
              );
            });

          return interactiveMatches || gameMatches;
        });

        setFilteredData(filteredItems);
      } else {
        setFilteredData([]);
      }
    }
  };

  // function handleShow() {
  //   setShow(!show);
  // }

  return (
    <div className="search-form d-flex justify-content-between">
      <button className="search-button" type="button" onClick={handleShow}>
        <BsSearch />
      </button>

      <Modal
        className="modal"
        size="lg"
        // fullscreen={true}
        show={show}
        onHide={handleClose}
        animation={false}
      >
        <Modal.Header closeButton className="title">
          <Modal.Title>Search</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-search">
              <input
                className="search-input "
                type="text"
                value={searchValue}
                onChange={handleChange}
                required
                placeholder="Enter a keyword"
              />
              {showClearBtn ? (
                <AiOutlineCloseCircle
                  className="clear-icon"
                  onClick={handleClearClick}
                />
              ) : null}
            </div>
            <div className="filter">
              <label>Grade:</label>
              <select
                className="select"
                value={gradeFilter}
                onChange={handleGradeChange}
              >
                <option value="">All</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
              </select>
            </div>
            <div className="filter2">
              <label>Subject:</label>
              <select
                className="select"
                value={subjectFilter}
                onChange={handleSubjectChange}
              >
                <option value="">All</option>
                <option value="Math">Math</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="Computer">Computer</option>
              </select>
            </div>

            <button className="searchBtn" onSubmit={handleSubmit} type="submit">
              <BsSearch />
            </button>
          </form>

          <div className="data-container">
            {searchValue !== '' &&
            searchValue.length > 2 &&
            filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <div key={index}>
                  {item.type === 'Interactive Content' ? (
                    <div>
                      {item.Interactive?.map(
                        (interactiveItem, interactiveIndex) => {
                          const filteredInteractiveItems =
                            interactiveItem.interactive_items?.filter(
                              (subItem) =>
                                subItem.name
                                  ?.toLowerCase()
                                  .includes(searchValue.toLowerCase()) &&
                                (gradeFilter === '' ||
                                  item.grade
                                    ?.toString()
                                    .toLowerCase()
                                    .includes(gradeFilter.toLowerCase())) &&
                                (subjectFilter === '' ||
                                  item.subject
                                    ?.toLowerCase()
                                    .includes(subjectFilter.toLowerCase()))
                            );

                          return filteredInteractiveItems.length > 0 ? (
                            <div
                              key={interactiveIndex}
                              className="result-container"
                            >
                              {filteredInteractiveItems.map(
                                (filteredItem, subIndex) => (
                                  <div
                                    key={subIndex}
                                    onClick={() =>
                                      handleClick(
                                        filteredItem.link,
                                        filteredItem.name
                                      )
                                    }
                                    className="result-card"
                                  >
                                    <div className="item-name">
                                      {filteredItem.name}
                                    </div>
                                    <div className="grade-subject">
                                      <div>Grade:{item.grade}</div>
                                      <div className="image-subject">
                                        <span className="subject-icon">
                                          {item.subject === 'English' ? (
                                            <AiOutlineBook />
                                          ) : null}
                                          {item.subject === 'Science' ? (
                                            <AiOutlineExperiment />
                                          ) : null}
                                          {item.subject === 'Math' ? (
                                            <AiOutlineCalculator />
                                          ) : null}
                                          {item.subject === 'Computer' ? (
                                            <AiOutlineLaptop />
                                          ) : null}
                                        </span>
                                        {item.subject}
                                      </div>
                                    </div>
                                    <span className="result-type">
                                      {item.type}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : null;
                        }
                      )}
                    </div>
                  ) : (
                    item.type === 'Games' && (
                      <div className="result-container">
                        {item.Games?.filter(
                          (gameItem) =>
                            gameItem.name
                              ?.toLowerCase()
                              .includes(searchValue.toLowerCase()) &&
                            (gradeFilter === '' ||
                              item.grade
                                ?.toString()
                                .toLowerCase()
                                .includes(gradeFilter.toLowerCase())) &&
                            (subjectFilter === '' ||
                              item.subject
                                ?.toLowerCase()
                                .includes(subjectFilter.toLowerCase()))
                        ).map((filteredGameItem, gameIndex) => (
                          <div
                            key={gameIndex}
                            onClick={() =>
                              handleGameClick(
                                filteredGameItem.link,
                                filteredGameItem.name
                              )
                            }
                            className="result-card"
                          >
                            <div className="item-name">
                              {filteredGameItem.name}
                            </div>
                            <div className="grade-subject">
                              <div>Grade: {item.grade}</div>
                              <div>
                                <span className="subject-icon">
                                  {item.subject === 'Math' ? (
                                    <AiOutlineBook />
                                  ) : null}
                                  {/* Add icons for other subjects if needed */}
                                </span>
                                {item.subject}
                              </div>
                            </div>
                            <span className="result-type-game">
                              {item.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              ))
            ) : (
              <p className="not-found">No data to show.</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div>
            <br />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
