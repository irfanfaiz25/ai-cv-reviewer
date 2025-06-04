import React from 'react';

export const LightbulbIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a7.5 7.5 0 01-4.5 0m4.5 0v.75A2.25 2.25 0 0113.5 21h-3a2.25 2.25 0 01-2.25-2.25V18m7.5-10.5H5.25m7.5 0A2.25 2.25 0 0115 5.25v.75A2.25 2.25 0 0112.75 8.25H5.25A2.25 2.25 0 013 6V5.25A2.25 2.25 0 015.25 3h7.5A2.25 2.25 0 0115 5.25v.75c0 .567.18 1.095.508 1.526M5.25 8.25h7.5M5.25 8.25V18m0-9.75A2.25 2.25 0 013 6V5.25" />
  </svg>
);