import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-6xl font-heading font-bold text-primary">404</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-heading font-bold">Page Not Found</h1>
        
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>
        
        <div className="flex justify-center pt-4">
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
