import { test, CLIENT_TYPE, ERREURS, TOUS_LES_PRODUITS, type Produit } from '../src/fixtures';

test.describe('Tâche : passer commande', () => {
  test.beforeEach(async ({ moi }) => {
    await moi.seConnecter('standard_user');
  });

  test('O1 - parcours nominal : acheter un produit', async ({ moi }) => {
    await moi.acheter(['Sauce Labs Backpack']);
    await moi.commandeEstConfirmee();
    await moi.pastillePanierIndique(0);
  });

  // Plusieurs paniers : 1 produit, 2 produits (prix décimaux), tous les produits
  const paniers: Produit[][] = [
    ['Sauce Labs Onesie'],
    ['Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'],
    TOUS_LES_PRODUITS,
  ];
  for (const [i, panier] of paniers.entries()) {
    test(`O2.${i + 1} - le récapitulatif calcule sous-total, taxe 8 % et total (${panier.length} produit(s))`, async ({ moi }) => {
      await moi.ajouterAuPanier(...panier);
      await moi.ouvrirLePanier();
      await moi.commencerLaCommande();
      await moi.renseignerMesInformations(CLIENT_TYPE);
      await moi.recapitulatifCorrespondA(panier);
    });
  }

  // Partition : un champ obligatoire manquant à la fois
  const champsManquants = [
    { id: 'O3.1', champ: 'prénom', infos: { ...CLIENT_TYPE, prenom: '' }, erreur: ERREURS.prenomRequis },
    { id: 'O3.2', champ: 'nom', infos: { ...CLIENT_TYPE, nom: '' }, erreur: ERREURS.nomRequis },
    { id: 'O3.3', champ: 'code postal', infos: { ...CLIENT_TYPE, codePostal: '' }, erreur: ERREURS.codePostalRequis },
  ];
  for (const c of champsManquants) {
    test(`${c.id} - la commande est bloquée si le ${c.champ} manque`, async ({ moi }) => {
      await moi.ajouterAuPanier('Sauce Labs Backpack');
      await moi.ouvrirLePanier();
      await moi.commencerLaCommande();
      await moi.renseignerMesInformations(c.infos);
      await moi.estSurEcran('informations client');
      await moi.voitLErreur(c.erreur);
    });
  }

  test('O4 - annuler à la saisie des informations ramène au panier intact', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Backpack');
    await moi.ouvrirLePanier();
    await moi.commencerLaCommande();
    await moi.annulerLaCommande();
    await moi.panierContientExactement(['Sauce Labs Backpack']);
  });

  test('O5 - annuler au récapitulatif ramène au catalogue sans vider le panier', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Backpack');
    await moi.ouvrirLePanier();
    await moi.commencerLaCommande();
    await moi.renseignerMesInformations(CLIENT_TYPE);
    await moi.annulerLaCommande();
    await moi.estSurEcran('catalogue');
    await moi.pastillePanierIndique(1);
  });
});

test.describe('Robustesse : utilisateur à problèmes', () => {
  test('O6 - [défaut connu] problem_user ne peut pas finaliser sa commande', async ({ moi }) => {
    test.fail(true, 'Défaut volontaire de SauceDemo pour problem_user (champ nom inutilisable)');
    await moi.seConnecter('problem_user');
    await moi.acheter(['Sauce Labs Backpack']);
    await moi.commandeEstConfirmee();
  });
});
