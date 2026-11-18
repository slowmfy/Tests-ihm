import { test, TOUS_LES_PRODUITS } from '../src/fixtures';

test.describe('Tâche : gérer son panier', () => {
  test.beforeEach(async ({ moi }) => {
    await moi.seConnecter('standard_user');
  });

  test('P1 - ajouter un produit depuis le catalogue', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Backpack');
    await moi.pastillePanierIndique(1);
    await moi.produitEstMarqueAjoute('Sauce Labs Backpack');
    await moi.produitEstMarqueAjoute('Sauce Labs Bike Light', false);
    await moi.ouvrirLePanier();
    await moi.panierContientExactement(['Sauce Labs Backpack']);
  });

  test('P2 - ajouter tous les produits (borne haute)', async ({ moi }) => {
    await moi.ajouterAuPanier(...TOUS_LES_PRODUITS);
    await moi.pastillePanierIndique(6);
    await moi.ouvrirLePanier();
    await moi.panierContientExactement(TOUS_LES_PRODUITS);
  });

  test('P3 - retirer depuis le catalogue ramène au panier vide (borne basse)', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Onesie', 'Sauce Labs Bike Light');
    await moi.retirerDuPanier('Sauce Labs Onesie', 'Sauce Labs Bike Light');
    await moi.pastillePanierIndique(0);
    await moi.ouvrirLePanier();
    await moi.panierContientExactement([]);
  });

  test('P4 - ajouter depuis la fiche produit, retirer depuis le panier', async ({ moi }) => {
    await moi.consulterProduit('Sauce Labs Bolt T-Shirt');
    await moi.ajouterAuPanier('Sauce Labs Bolt T-Shirt');
    await moi.produitEstMarqueAjoute('Sauce Labs Bolt T-Shirt');
    await moi.pastillePanierIndique(1);
    await moi.ouvrirLePanier();
    await moi.prixAfficheEstCorrect('Sauce Labs Bolt T-Shirt');
    await moi.retirerDuPanier('Sauce Labs Bolt T-Shirt');
    await moi.panierContientExactement([]);
    await moi.pastillePanierIndique(0);
  });

  test('P5 - le panier reste cohérent entre catalogue, fiche et panier', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Fleece Jacket');
    await moi.ouvrirLePanier();
    await moi.continuerMesAchats();
    await moi.produitEstMarqueAjoute('Sauce Labs Fleece Jacket');
    await moi.consulterProduit('Sauce Labs Fleece Jacket');
    await moi.produitEstMarqueAjoute('Sauce Labs Fleece Jacket');
    await moi.retirerDuPanier('Sauce Labs Fleece Jacket');
    await moi.revenirAuCatalogue();
    await moi.produitEstMarqueAjoute('Sauce Labs Fleece Jacket', false);
    await moi.pastillePanierIndique(0);
  });

  test('P6 - le panier est conservé après déconnexion / reconnexion', async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Backpack', 'Sauce Labs Onesie');
    await moi.seDeconnecter();
    await moi.seConnecter('standard_user');
    await moi.pastillePanierIndique(2);
  });

  test("P7 - réinitialiser l'application vide le panier", async ({ moi }) => {
    await moi.ajouterAuPanier('Sauce Labs Backpack', 'Sauce Labs Onesie');
    await moi.reinitialiserApplication();
    await moi.pastillePanierIndique(0);
    await moi.ouvrirLePanier();
    await moi.panierContientExactement([]);
  });

  test('P8 - [défaut connu] après réinitialisation, le catalogue affiche encore « Remove »', async ({ moi }) => {
    test.fail(true, 'Les boutons ne sont pas remis à jour après « Reset App State »');
    await moi.ajouterAuPanier('Sauce Labs Backpack');
    await moi.reinitialiserApplication();
    await moi.produitEstMarqueAjoute('Sauce Labs Backpack', false);
  });
});

test.describe('Robustesse : utilisateur à problèmes', () => {
  test('P9 - [défaut connu] problem_user ne peut pas ajouter certains produits', async ({ moi }) => {
    test.fail(true, 'Défaut volontaire de SauceDemo pour problem_user');
    await moi.seConnecter('problem_user');
    await moi.ajouterAuPanier(...TOUS_LES_PRODUITS);
    await moi.pastillePanierIndique(6);
  });
});
