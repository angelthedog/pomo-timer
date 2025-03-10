function SettingsButton({ onClick, disabled = false, tooltip = '' }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <div className="button-container">
      <button 
        onClick={handleClick} 
        className={`with-text settings-button ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
        style={{ zIndex: 5, position: 'relative' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
        </svg>
        Settings
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

export default SettingsButton; 