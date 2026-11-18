import { test, ERREURS, MOT_DE_PASSE_VALIDE } from '../src/fixtures';

test.describe("Tâche : s'authentifier", () => {
  test('A1 - un utilisateur standard se connecte et voit le catalogue complet', async ({ moi }) => {
    await moi.seConnecter('standard_user');
    await moi.estSurEcran('catalogue');
    await moi.catalogueAfficheProduits(6);
    await moi.pastillePanierIndique(0);
  });

  // Partition des entrées (identifiant, mot de passe) en classes d'équivalence invalides
  const casInvalides = [
    { id: 'A2', cas: 'identifiant vide', user: '', mdp: MOT_DE_PASSE_VALIDE, erreur: ERREURS.identifiantRequis },
    { id: 'A3', cas: 'mot de passe vide', user: 'standard_user', mdp: '', erreur: ERREURS.motDePasseRequis },
    { id: 'A4', cas: 'mot de passe erroné', user: 'standard_user', mdp: 'mauvais', erreur: ERREURS.identifiantsInvalides },
    { id: 'A5', cas: 'utilisateur inconnu', user: 'inconnu', mdp: MOT_DE_PASSE_VALIDE, erreur: ERREURS.identifiantsInvalides },
    { id: 'A6', cas: 'compte bloqué', user: 'locked_out_user', mdp: MOT_DE_PASSE_VALIDE, erreur: ERREURS.compteBloque },
  ];
  for (const c of casInvalides) {
    test(`${c.id} - connexion refusée : ${c.cas}`, async ({ moi }) => {
      await moi.seConnecter(c.user, c.mdp);
      await moi.estSurEcran('connexion');
      await moi.voitLErreur(c.erreur);
    });
  }

  test("A7 - l'accès direct au catalogue sans être connecté est refusé", async ({ moi }) => {
    await moi.accederDirectementA('catalogue');
    await moi.estSurEcran('connexion');
    await moi.voitLErreur(ERREURS.accesNonAutorise('/inventory.html'));
  });

  test("A8 - après déconnexion, l'accès direct au panier est refusé", async ({ moi }) => {
    await moi.seConnecter('standard_user');
    await moi.seDeconnecter();
    await moi.estSurEcran('connexion');
    await moi.accederDirectementA('panier');
    await moi.voitLErreur(ERREURS.accesNonAutorise('/cart.html'));
  });

  test('A9 - un utilisateur lent (performance_glitch_user) finit par accéder au catalogue', async ({ moi }) => {
    await moi.seConnecter('performance_glitch_user');
    await moi.estSurEcran('catalogue');
    await moi.catalogueAfficheProduits(6);
  });
});
