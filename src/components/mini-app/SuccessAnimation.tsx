import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SuccessAnimationProps {
  onComplete?: () => void;
  message?: string;
  description?: string;
}

export const SuccessAnimation = ({ 
  onComplete, 
  message = "Заявка отправлена!", 
  description = "Мы уведомим вас о результате модерации" 
}: SuccessAnimationProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg"
      onAnimationComplete={() => {
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }}
    >
      <div className="text-center px-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.1
          }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <CheckCircle className="w-14 h-14 text-success" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          {message}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 2, ease: "linear" }}
          className="h-1 bg-success/30 rounded-full mt-8 mx-auto max-w-[200px] origin-left"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 2, ease: "linear" }}
            className="h-full bg-success rounded-full origin-left"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
