import { motion as Motion } from 'framer-motion'

function MotionButton({ className = '', children, ...props }) {
  return (
    <Motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </Motion.button>
  )
}

export default MotionButton
