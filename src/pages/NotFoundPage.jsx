import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
      <EmptyState
        icon={Compass}
        title="Sahifa topilmadi"
        description="Bu manzil mavjud emas yoki o'chirilgan bo'lishi mumkin."
      >
        <Link to="/" className="btn btn-primary">
          Bosh sahifaga
        </Link>
      </EmptyState>
    </div>
  );
}

export default NotFoundPage;
