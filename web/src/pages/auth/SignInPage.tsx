import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                forceRedirectUrl="/overview"
                afterSignInUrl="/overview"
            />
        </div>
    );
}
