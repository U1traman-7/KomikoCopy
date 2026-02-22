import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-background shadow-md">
      <nav className="flex items-center">
        <a href="https://komiko.app" className="text-lg font-semibold text-blue-600 dark:text-blue-400">
          Main App
        </a>
      </nav>
    </header>
  );
};

export default Navbar;
