import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";
import { writeFileSync } from "node:fs";

/** Tras cada build, deja la ruta del bundle (con hash) en src/asset.gen.ts para que el Worker la inyecte en el HTML. */
function emitAssetPath(): Plugin {
    return {
        name: "emit-asset-path",
        writeBundle(_, bundle) {
            const entry = Object.values(bundle).find((c) => c.type === "chunk" && c.isEntry);
            if (!entry) return;
            writeFileSync(new URL("./src/asset.gen.ts", import.meta.url), `// Generado por vite build. No editar.\nexport const CLIENT_JS = "/assets/${entry.fileName}";\n`);
        },
    };
}

export default defineConfig({
    plugins: [preact(), emitAssetPath()],
    build: {
        outDir: "public/assets",
        emptyOutDir: true,
        target: "es2022",
        rollupOptions: {
            input: "client/main.tsx",
            output: { entryFileNames: "k.[hash].js", chunkFileNames: "k-[name].[hash].js" },
        },
    },
});
