// KINDE_DOMAIN debe coincidir exactamente con el emisor (iss) del JWT,
// por ejemplo "https://waadafood.kinde.com". Se define con:
//   npx convex env set KINDE_DOMAIN https://waadafood.kinde.com
export default {
    providers: [
        {
            domain: process.env.KINDE_DOMAIN,
            applicationID: "convex",
        },
    ],
};
