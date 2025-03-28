import { useState } from 'react';
import { COLORS } from '../utils/constants';
import styles from '../styles/FeedbackModal.module.css';

export default function FeedbackModal({ isOpen, onClose, onSubmit, sessionId }) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(sessionId, rating);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>How was your focus session?</h2>
        
        {showSuccess ? (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✓</span>
            <p>Thank you for your feedback!</p>
          </div>
        ) : (
          <>
            <div className={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`${styles.starButton} ${rating >= star ? styles.active : ''}`}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <span className={styles.starIcon}>★</span>
                </button>
              ))}
            </div>
            
            <div className={styles.buttonContainer}>
              <button 
                className={styles.submitButton} 
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button 
                className={styles.skipButton} 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
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
        
        .modal-content {
          background-color: rgba(0, 0, 0, 0.9);
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        
        h2 {
          margin: 0 0 20px;
          color: white;
        }
        
        .rating-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .star-button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.3);
          transition: color 0.2s;
          padding: 5px;
        }
        
        .star-button.active {
          color: #FFD700;
        }
        
        .star-button:hover:not(:disabled) {
          color: #FFD700;
        }
        
        .star-button:disabled {
          cursor: not-allowed;
        }
        
        .button-container {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .submit-button, .skip-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        .submit-button {
          background-color: ${COLORS.GREEN};
          color: white;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: ${COLORS.GREEN_DARK};
        }
        
        .skip-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .skip-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .submit-button:disabled, .skip-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .success-icon {
          font-size: 3rem;
          color: ${COLORS.GREEN};
        }
        
        .success-message p {
          color: white;
          margin: 0;
        }
      `}</style>
    </div>
  );
} 