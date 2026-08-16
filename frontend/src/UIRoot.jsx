import React, { useState, useEffect } from 'react';

export default function UIRoot() {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    // Expose simple global APIs for quick usage from anywhere in the app
    window.showToast = (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((t) => [...t, { id, message, type: opts.type || 'info' }]);
      const duration = typeof opts.duration === 'number' ? opts.duration : 3000;
      setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), duration);
    };
    window.showModal = (content) => setModal(content);
    window.closeModal = () => setModal(null);

    return () => {
      delete window.showToast;
      delete window.showModal;
      delete window.closeModal;
    };
  }, []);

  return (
    <div id="ui-root">
      <div className="toast-wrapper" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type || 'info'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="modal-body">{typeof modal === 'string' ? <div>{modal}</div> : modal}</div>
            <div className="modal-actions">
              <button className="iq-btn-ghost" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
