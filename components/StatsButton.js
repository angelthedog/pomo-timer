import Link from 'next/link';

/**
 * Stats button component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
function StatsButton({ onClick, disabled = false, tooltip = '' }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div className="button-container">
      <button 
        className={`with-text stats-button ${disabled ? 'disabled' : ''}`} 
        disabled={disabled}
        onClick={handleClick}
        style={{ zIndex: 5, position: 'relative' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
        </svg>
        Stats
      </button>
      
      {tooltip && disabled && (
        <div className="tooltip">{tooltip}</div>
      )}
      
      <style jsx>{`
        .button-container {
          position: relative;
          display: inline-block;
        }
        
        .disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tooltip {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          white-space: nowrap;
          z-index: 10;
        }
        
        .tooltip:before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 0 5px 5px 5px;
          border-style: solid;
          border-color: transparent transparent rgba(0, 0, 0, 0.7) transparent;
        }
      `}</style>
    </div>
  );
}

export default StatsButton; 