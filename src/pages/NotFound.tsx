
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CakeIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-50 px-4">
      <div className="text-center max-w-md">
        <CakeIcon className="mx-auto h-16 w-16 text-bakery-600 mb-4" />
        <h1 className="text-6xl font-serif font-bold mb-4 text-bakery-700">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Oops! We couldn't find the page you were looking for.
        </p>
        <p className="text-muted-foreground mb-8">
          The page may have been moved, deleted, or might never have existed.
        </p>
        <Link to="/">
          <Button className="bg-bakery-600 hover:bg-bakery-700">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
