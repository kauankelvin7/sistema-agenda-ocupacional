
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/image-utils";
import { User } from "lucide-react";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">NovaAgenda</h1>
          <div className="flex items-center gap-4">
            {user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuario"} />
                <AvatarFallback className="text-sm">
                  {user.displayName ? getInitials(user.displayName) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
