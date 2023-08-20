import Modal from 'react-bootstrap/Modal';

function LoadingModal({ modalOpen }) {
  return (
    <Modal show={modalOpen} onHide={() => {}} animation={false}>
      <div className="fullscreen-modal">
        <div className="fullscreen-modal-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-game-text">Loading Game...</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default LoadingModal;
