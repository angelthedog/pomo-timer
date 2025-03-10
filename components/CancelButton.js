function CancelButton(props) {
  const handleClick = (e) => {
    e.preventDefault();
    if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <button 
      className="with-text cancel-button" 
      onClick={handleClick}
      disabled={props.disabled}
      style={{ zIndex: 5, position: 'relative' }}
      title={props.tooltip || "Cancel current session"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
      </svg>
      Cancel
    </button>
  );
}

export default CancelButton; 