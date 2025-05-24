import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="text-center p-6 bg-white rounded-xl shadow-2xl border border-blue-200 transform hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-xs sm:max-w-md mx-auto">
      <h2 className="text-2xl sm:text-4xl font-extrabold text-indigo-800 mb-4 drop-shadow-sm">Welcome to Our Application!</h2>
      <p className="text-gray-700 text-sm sm:text-lg leading-relaxed mb-4">
        This is the public home page. Feel free to explore, or log in to access your personalized dashboard and features.
      </p>
      <p className="text-gray-600 mt-2 text-xs sm:text-md italic">
        Ready to get started? Head over to the <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer">Login</span> page!
      </p>
      <div className="mt-6">
        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-inner">
          Your Journey Starts Here
        </span>
      </div>
    </div>
  );
};

export default HomePage;
