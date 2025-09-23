import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
}

export default function OrderSuccessModal({ isOpen, orderId, onClose }: OrderSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire multiple confetti bursts
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // shoot confetti from different angles
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-full max-w-lg">
              {/* Lottie Animation */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-56 h-56 mx-auto -mb-8"
              >
                <DotLottieReact
                  src="/animations/success.lottie"
                  loop={false}
                  autoplay
                />
              </motion.div>

              {/* Text Content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ההזמנה נשלחה בהצלחה! 🎉
                </h2>
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-lg font-semibold text-green-700">
                    מספר הזמנה: <span className="text-green-900">#{orderId.slice(0, 8)}</span>
                  </p>
                </div>
                <p className="text-gray-600">
                  תודה רבה על הזמנתך! נעדכן אותך בהמשך
                </p>
              </motion.div>

              {/* Close Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-green-600 text-white px-10 py-3 rounded-full font-medium hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  סגור
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
