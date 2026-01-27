import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/overview" />
        </div>
    );
}
