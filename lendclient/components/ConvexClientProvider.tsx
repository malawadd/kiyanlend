"use client";

import { ReactNode, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function UserProvisioner({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const provisionUser = useMutation(api.users.provisionUser);

  useEffect(() => {
    if (isSignedIn && user) {
      provisionUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        displayName: user.firstName || user.username || "User",
        avatarUrl: user.imageUrl,
      }).catch((error) => {
        console.error("Failed to provision user:", error);
      });
    }
  }, [isSignedIn, user, provisionUser]);

  return <>{children}</>;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserProvisioner>{children}</UserProvisioner>
    </ConvexProviderWithClerk>
  );
}
