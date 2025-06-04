import React from 'react';

export const BriefcaseIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073c0 .566-.216.966-.774 1.306S18.504 20 17.625 20H6.375c-.879 0-1.695-.205-2.201-.538S3.375 18.79 3.375 18.223V14.15M16.5 7.5v-1.875a.375.375 0 00-.375-.375h-3.75a.375.375 0 00-.375.375V7.5M12 3v3.75m0 0h-3.75M12 6.75h3.75M3.375 10.875c0-1.455 1.176-2.625 2.625-2.625h12c1.45 0 2.625 1.17 2.625 2.625v3.275c0 .879-.216 1.695-.538 2.201s-.966.774-1.306.774H6.113c-.34 0-.774-.216-1.306-.774S3.375 15.03 3.375 14.15V10.875z" />
  </svg>
);