import Link from "next/link";
import { MainNav } from "@/components/shared/MainNav";
import { UserMenu } from "@/components/shared/UserMenu";

type AppHeaderProps = {
  user: {
    name: string;
    email: string;
    color: string;
  };
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/agenda"
          className="font-serif text-2xl font-light tracking-tight text-chamade-terracotta"
        >
          La Chamade
        </Link>
        <div className="hidden md:block">
          <MainNav />
        </div>
        <UserMenu name={user.name} email={user.email} color={user.color} />
      </div>
    </header>
  );
}
