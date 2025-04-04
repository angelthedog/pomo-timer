import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

/**
 * FeedbackModal component that shows a 5-star rating system
 * Auto-dismisses after 3 seconds or when user provides feedback
 */
const FeedbackModal = ({ onSubmit, onSkip }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRatingClick = (value) => {
    setRating(value);
    onSubmit(value);
  };

  return (
    <div className="feedback-modal">
      <div className="feedback-content">
        <h3>How focused were you during this work session?</h3>
        <div className="stars-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className="star-button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              {star <= (hoveredRating || rating) ? (
                <StarIcon className="star-icon filled" />
              ) : (
                <StarOutlineIcon className="star-icon" />
              )}
            </button>
          ))}
        </div>
        <div className="feedback-actions">
          <button className="skip-button" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>

      <style jsx>{`
        .feedback-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .feedback-content {
          background-color: #2a2a2a;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: white;
          font-size: 1.2rem;
        }

        .stars-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .star-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.2s;
        }

        .star-button:hover {
          transform: scale(1.2);
        }

        .star-icon {
          width: 2rem;
          height: 2rem;
          color: #ccc;
        }

        .star-icon.filled {
          color: #ffd700;
        }

        .feedback-actions {
          margin-top: 1rem;
        }

        .skip-button {
          background-color: transparent;
          border: 1px solid #555;
          color: #aaa;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skip-button:hover {
          background-color: #444;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal; 