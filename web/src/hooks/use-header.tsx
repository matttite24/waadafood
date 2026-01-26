import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface HeaderContextType {
    centerContent: ReactNode;
    setCenterContent: (content: ReactNode) => void;
    rightContent: ReactNode;
    setRightContent: (content: ReactNode) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [centerContent, setCenterContent] = useState<ReactNode>(null);
    const [rightContent, setRightContent] = useState<ReactNode>(null);

    return (
        <HeaderContext.Provider value={{ centerContent, setCenterContent, rightContent, setRightContent }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error("useHeader must be used within a HeaderProvider");
    }
    return context;
}

/**
 * Helper hook to set header content for a page
 */
export function useHeaderContent({
    center,
    right
}: {
    center?: ReactNode;
    right?: ReactNode;
}) {
    const { setCenterContent, setRightContent } = useHeader();

    useEffect(() => {
        if (center !== undefined) setCenterContent(center);
        if (right !== undefined) setRightContent(right);

        return () => {
            if (center !== undefined) setCenterContent(null);
            if (right !== undefined) setRightContent(null);
        };
    }, [center, right, setCenterContent, setRightContent]);
}
