import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <Card className="w-full max-w-xs sm:max-w-md mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-4xl font-bold text-gray-800">
          Application Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-700 text-sm sm:text-lg leading-relaxed">
          This is where you can manage various settings for your application.
        </CardDescription>
        <p className="text-gray-600 mt-2 text-xs sm:text-md italic p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
          (This page is currently a placeholder. Future updates will include
          customizable options!)
        </p>
        <div className="mt-6">
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow-inner">
            Coming Soon!
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;
