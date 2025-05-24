const SettingsPage: React.FC = () => {
  return (
    <div className="text-center p-6 bg-white rounded-xl shadow-2xl border border-blue-200 transform hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-xs sm:max-w-md mx-auto">
      <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">Application Settings</h2>
      <p className="text-gray-700 text-sm sm:text-lg leading-relaxed mb-4">
        This is where you can manage various settings for your application.
      </p>
      <p className="text-gray-600 mt-2 text-xs sm:text-md italic p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
        (This page is currently a placeholder. Future updates will include customizable options!)
      </p>
      <div className="mt-6">
        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow-inner">
          Coming Soon!
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
