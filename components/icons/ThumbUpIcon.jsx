import React from 'react';

export const ThumbUpIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5H21M6.633 10.5c.414 0 .824.066 1.206.193m0 0c.861.276 1.594.748 2.17 1.379C10.59 12.68 11.25 13.5 12 13.5c.75 0 1.41-.82 1.994-1.428.576-.63.996-1.102 1.856-1.378m-3.85 2.806c-.217.29-.47.543-.756.756m7.5 0c.045-.03.088-.062.13-.095M6.633 10.5v7.875c0 .621.504 1.125 1.125 1.125h3.393c.398 0 .788-.128 1.106-.368l4.554-3.415a1.125 1.125 0 000-1.816l-4.554-3.416a1.125 1.125 0 00-1.106-.368H7.758A1.125 1.125 0 006.633 10.5z" />
  </svg>
);