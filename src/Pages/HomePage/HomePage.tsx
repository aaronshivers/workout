import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-md border border-blue-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Our Application!</h2>
      <p className="text-gray-700 text-lg leading-relaxed">
        This is the public home page. Feel free to explore, or log in to access your personalized dashboard and features.
      </p>
      <p className="text-gray-600 mt-4 text-md">
        Ready to get started? Head over to the <span className="font-semibold text-blue-600">Login</span> page!
      </p>
    </div>
  );
};

export default HomePage;
