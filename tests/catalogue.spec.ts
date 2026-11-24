import { test, TOUS_LES_PRODUITS, type Tri } from '../src/fixtures';

test.describe('Tâche : parcourir le catalogue', () => {
  test.beforeEach(async ({ moi }) => {
    await moi.seConnecter('standard_user');
  });

  test('C1 - chaque produit est affiché au prix du catalogue de référence', async ({ moi }) => {
    for (const p of TOUS_LES_PRODUITS) await moi.prixAfficheEstCorrect(p);
  });

  const tris: Tri[] = ['nom A-Z', 'nom Z-A', 'prix croissant', 'prix décroissant'];
  for (const [i, tri] of tris.entries()) {
    test(`C2.${i + 1} - le catalogue peut être trié par ${tri}`, async ({ moi }) => {
      await moi.trierCatalogue(tri);
      await moi.catalogueEstTrie(tri);
      await moi.catalogueAfficheProduits(6);
    });
  }

  test('C3 - la fiche produit présente le produit consulté et permet de revenir', async ({ moi }) => {
    await moi.consulterProduit('Sauce Labs Fleece Jacket');
    await moi.ficheAfficheProduit('Sauce Labs Fleece Jacket');
    await moi.prixAfficheEstCorrect('Sauce Labs Fleece Jacket');
    await moi.revenirAuCatalogue();
    await moi.estSurEcran('catalogue');
  });

  test('C4 - [défaut connu] le tri choisi est perdu après consultation d’une fiche', async ({ moi }) => {
    test.fail(true, 'Au retour sur le catalogue, le tri revient à « nom A-Z »');
    await moi.trierCatalogue('prix décroissant');
    await moi.consulterProduit('Sauce Labs Onesie');
    await moi.revenirAuCatalogue();
    await moi.catalogueEstTrie('prix décroissant');
  });
});

test.describe('Robustesse : utilisateur à problèmes', () => {
  test('C5 - [défaut connu] problem_user ne peut pas trier le catalogue', async ({ moi }) => {
    test.fail(true, 'Défaut volontaire de SauceDemo pour problem_user');
    await moi.seConnecter('problem_user');
    await moi.trierCatalogue('nom Z-A');
    await moi.catalogueEstTrie('nom Z-A');
  });
});
