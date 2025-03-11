import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

export default function ChatButton({ onClick, hasUnread, isOpen }) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 ${
        isOpen ? 'bg-gray-9 hover:bg-gray-10' : 'bg-blue-9 hover:bg-blue-10'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        rotate: isOpen ? 180 : 0,
      }}
    >
      {isOpen ? <X size={24} className='text-white' /> : <MessageCircle size={24} className='text-white' />}
      {hasUnread && !isOpen && (
        <span className='absolute -top-1 -right-1 w-4 h-4 bg-red-9 rounded-full animate-pulse' />
      )}
    </motion.button>
  );
}
