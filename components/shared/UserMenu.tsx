import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  name: string;
  email: string;
  color: string;
};

export function UserMenu({ name, email, color }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-zinc-900">{name}</p>
        <p className="text-xs text-zinc-500">{email}</p>
      </div>

      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" size="sm" variant="outline">
          Déconnexion
        </Button>
      </form>
    </div>
  );
}
