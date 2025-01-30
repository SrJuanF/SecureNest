import React from 'react';
import { motion } from 'framer-motion';
import { HashEntry } from '../../types';

interface HashHistoryProps {
  history: HashEntry[];
}

export function HashHistory({ history }: HashHistoryProps) {
  return (
    <div className="mt-8">
      <h2 className="text-cyber-gray font-mono mb-4">Recent Hashes</h2>
      <div className="space-y-2">
        {history.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-cyber-dark p-3 rounded-lg border border-cyber-green/20"
          >
            <div className="text-sm text-cyber-gray mb-1">
              {entry.function} - {new Date(entry.timestamp).toLocaleString()}
            </div>
            <div className="text-sm text-cyber-gray mb-2">
              Input: {entry.input.join(', ')}
            </div>
            <div className="font-mono text-cyber-green text-sm truncate">
              {entry.hash}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}