import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HomePage: React.FC = () => {
  return (
    <Card className="w-full max-w-xs sm:max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Our Application!</CardTitle>
        <CardDescription>
        This is the public home page. Feel free to explore, or log in to access your personalized dashboard and features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Ready to get started? Head over to the Login page!
      </p>
      </CardContent>
    </Card>
  );
};

export default HomePage;
