import { useState } from 'react';
import styles from '../styles/FeedbackModal.module.css';

export default function FeedbackModal({ isOpen, onClose, onSubmit, sessionId }) {
  const [rating, setRating] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log(`Submitting rating: ${rating} for session: ${sessionId}`);
    onSubmit(sessionId, rating);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Session Completed!</h2>
        <p>How productive was your work session?</p>
        
        <div className={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`${styles.starButton} ${rating >= star ? styles.active : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} stars`}
            >
              <span className={styles.starIcon}>★</span>
            </button>
          ))}
        </div>
        <div className={styles.ratingText}>
          {rating} {rating === 1 ? 'Star' : 'Stars'}
        </div>
        
        <div className={styles.buttonContainer}>
          <button className={styles.submitButton} onClick={handleSubmit}>
            Submit
          </button>
          <button className={styles.skipButton} onClick={onClose}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
} 