const Dashboard: React.FC = () => {
  return (
    <div className="text-center p-6 bg-white rounded-xl shadow-2xl border border-blue-200 transform hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-xs sm:max-w-md mx-auto">
      <h2 className="text-2xl sm:text-4xl font-extrabold text-indigo-800 mb-4 drop-shadow-sm">Welcome to Your Dashboard!</h2>
      <p className="text-gray-700 text-sm sm:text-lg leading-relaxed mb-4">
        This is your personalized private area. Here you'll find an overview of your activities and quick access to key features.
      </p>
      <p className="text-gray-600 mt-2 text-xs sm:text-md italic">
        Use the navigation links above to explore your profile and settings.
      </p>
      <div className="mt-6">
        <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold shadow-inner">
          Explore & Discover
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
