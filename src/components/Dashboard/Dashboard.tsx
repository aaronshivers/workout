import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Dashboard: React.FC = () => {
  return (
    <Card className="w-full max-w-xs sm:max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Your Dashboard!</CardTitle>
        <CardDescription>
          This is your personalized private area. Here you'll find an overview
          of your activities and quick access to key features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Use the navigation links above to explore your profile and settings.
        </p>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
