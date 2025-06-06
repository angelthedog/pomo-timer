function FastForwardButton(props) {
  const handleClick = (e) => {
    e.preventDefault();
    if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <button 
      className="with-text fast-forward-button" 
      onClick={handleClick}
      disabled={props.disabled}
      style={{ zIndex: 5, position: 'relative' }}
      title={props.tooltip || "Fast forward to next session"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
      </svg>
      Skip
    </button>
  );
}

export default FastForwardButton; 