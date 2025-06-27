import React from 'react';

interface TitleLogoProps {
  className?: string;
}

const TitleLogo: React.FC<TitleLogoProps> = ({ className = '' }) => {
  return (
    <div className={`title-logo ${className}`}>
      {/* 这里将放置您的Figma设计素材 */}
      {/* 可以是 <img> 标签或者 <svg> 元素 */}
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent leading-tight tracking-wider" 
          style={{ 
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
            fontStretch: 'expanded',
            letterSpacing: '0.05em',
            lineHeight: '1.1'
          }}>
        Starwish.fun
      </h1>
    </div>
  );
};

export default TitleLogo;