const Dashboard: React.FC = () => {
  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-md border border-blue-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard!</h2>
      <p className="text-gray-700 text-lg leading-relaxed">
        This is your personalized private area. Here you'll find an overview of your activities and quick access to key features.
      </p>
      <p className="text-gray-600 mt-4 text-md">
        Use the navigation links above to explore your profile and settings.
      </p>
    </div>
  );
};

export default Dashboard;
